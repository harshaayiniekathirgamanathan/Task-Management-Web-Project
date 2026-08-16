// Service for tasks — ALL database work for tasks lives here (PostgreSQL via utils/db).
const db = require('../utils/db');
const { createNotification } = require('./notificationService');

// Shared SELECT that returns a task already shaped for the API: the parent
// project plus assignees and labels aggregated into JSON arrays. This replaces
// the old PostgREST nested-embed syntax.
const TASK_SELECT = `
  SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date, t.project_id, t.created_at,
         json_build_object('id', p.id, 'title', p.title) AS project,
         COALESCE((
           SELECT json_agg(json_build_object('id', u.id, 'name', u.name) ORDER BY u.name)
             FROM task_assignments ta
             JOIN users u ON u.id = ta.user_id
            WHERE ta.task_id = t.id
         ), '[]'::json) AS assignees,
         COALESCE((
           SELECT json_agg(json_build_object('id', l.id, 'name', l.name, 'color', l.color) ORDER BY l.name)
             FROM task_labels tl
             JOIN labels l ON l.id = tl.label_id
            WHERE tl.task_id = t.id
         ), '[]'::json) AS labels
    FROM tasks t
    JOIN projects p ON p.id = t.project_id`;

// Normalize a row from TASK_SELECT into the API contract shape.
function toTaskShape(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    due_date: row.due_date,
    project_id: row.project_id,
    project: row.project || null,
    assignees: row.assignees || [],
    labels: row.labels || [],
  };
}

// Get one full task by id (assignees + labels joined). Returns null if not found.
async function getTaskById(taskId) {
  const row = await db.one(`${TASK_SELECT} WHERE t.id = $1`, [taskId]);
  return row ? toTaskShape(row) : null;
}

// Is this user assigned to this task? (true/false)
async function isUserAssigned(taskId, userId) {
  const row = await db.one(
    'SELECT 1 FROM task_assignments WHERE task_id = $1 AND user_id = $2',
    [taskId, userId]
  );
  return !!row;
}

// Can this user add comments / upload files to this task?
// Managers and admins always may; a collaborator only on tasks assigned to them.
async function canModifyTask(taskId, user) {
  if (!user) return false;
  if (user.role === 'project_manager' || user.role === 'admin') return true;
  return isUserAssigned(taskId, user.id);
}

// Confirm a list of ids are all real users who may be assigned (else throw 400).
// Admins can never be assigned to a task.
async function assertUsersExist(uniqueIds) {
  if (uniqueIds.length === 0) return;
  const users = await db.many(
    'SELECT id, role FROM users WHERE id = ANY($1::uuid[])',
    [uniqueIds]
  );
  if (users.length !== uniqueIds.length) {
    const err = new Error('Unknown user assigned');
    err.status = 400;
    throw err;
  }
  if (users.some((u) => u.role === 'admin')) {
    const err = new Error('Admins cannot be assigned to tasks');
    err.status = 400;
    throw err;
  }
}

// List tasks with optional filters and sorting.
async function listTasks({ project_id, status, priority, assignee, sort } = {}) {
  const where = [];
  const params = [];

  if (project_id) {
    params.push(project_id);
    where.push(`t.project_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`t.status = $${params.length}`);
  }
  if (priority) {
    params.push(priority);
    where.push(`t.priority = $${params.length}`);
  }
  if (assignee) {
    params.push(assignee);
    where.push(
      `EXISTS (SELECT 1 FROM task_assignments ta WHERE ta.task_id = t.id AND ta.user_id = $${params.length})`
    );
  }

  let orderBy;
  if (sort === 'due_date') {
    orderBy = 'ORDER BY t.due_date ASC NULLS LAST';
  } else if (sort === 'priority') {
    orderBy = 'ORDER BY t.priority DESC';
  } else {
    orderBy = 'ORDER BY t.created_at DESC';
  }

  const sql =
    TASK_SELECT +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    ` ${orderBy}`;

  const rows = await db.many(sql, params);
  return rows.map(toTaskShape);
}

// Create one task, optionally assigning users to it.
async function createTask({
  project_id,
  title,
  description,
  priority,
  due_date,
  assignee_ids = [],
  created_by,
}) {
  let project = await db.one('SELECT id FROM projects WHERE id = $1', [project_id]);
  if (!project) {
    await db.query(
      `INSERT INTO projects (id, title, description, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [project_id, 'Project Workspace', 'Project workspace details and task management board.', created_by]
    );
  }

  const uniqueAssignees = [...new Set(assignee_ids)];
  await assertUsersExist(uniqueAssignees);

  // Insert the task and its assignments atomically.
  const task = await db.tx(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO tasks (project_id, title, description, priority, status, due_date, created_by)
       VALUES ($1, $2, $3, $4, 'todo', $5, $6)
       RETURNING id`,
      [
        project_id,
        title,
        description ?? null,
        priority || 'medium',
        due_date || null,
        created_by,
      ]
    );
    const created = rows[0];

    if (uniqueAssignees.length > 0) {
      await client.query(
        `INSERT INTO task_assignments (task_id, user_id)
         SELECT $1, x FROM unnest($2::uuid[]) AS x`,
        [created.id, uniqueAssignees]
      );
    }
    return created;
  });

  // Step 4.9 — notify each assigned user (skip the creator)
  for (const userId of uniqueAssignees) {
    if (userId === created_by) continue;
    try {
      await createNotification(
        userId,
        'task_assigned',
        `You were assigned to the task "${title}"`,
        task.id
      );
    } catch (e) {
      console.error('task_assigned notification failed:', e.message);
    }
  }

  return getTaskById(task.id);
}

// Update a task's title/description/priority/due_date/assignee_ids (managers only — enforced in the route).
async function updateTask(id, { title, description, priority, due_date, assignee_ids }) {
  const existing = await db.one('SELECT id FROM tasks WHERE id = $1', [id]);
  if (!existing) return null;

  let uniqueAssignees = null;
  if (assignee_ids !== undefined) {
    uniqueAssignees = [...new Set(assignee_ids)];
    await assertUsersExist(uniqueAssignees);
  }

  await db.tx(async (client) => {
    const sets = ['updated_at = NOW()'];
    const params = [];
    if (title !== undefined) {
      params.push(title);
      sets.push(`title = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      sets.push(`description = $${params.length}`);
    }
    if (priority !== undefined) {
      params.push(priority);
      sets.push(`priority = $${params.length}`);
    }
    if (due_date !== undefined) {
      params.push(due_date);
      sets.push(`due_date = $${params.length}`);
    }
    params.push(id);
    await client.query(
      `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${params.length}`,
      params
    );

    if (uniqueAssignees !== null) {
      await client.query('DELETE FROM task_assignments WHERE task_id = $1', [id]);
      if (uniqueAssignees.length > 0) {
        await client.query(
          `INSERT INTO task_assignments (task_id, user_id)
           SELECT $1, x FROM unnest($2::uuid[]) AS x`,
          [id, uniqueAssignees]
        );
      }
    }
  });

  return getTaskById(id);
}

// Change ONLY a task's status.
// Managers/admins may change any task; a collaborator may change it ONLY
// if they are assigned to that task. `user` is { id, role } from the token.
// Returns the updated task, or null if the task does not exist (-> 404).
async function updateTaskStatus(id, status, user) {
  // 1. Task must exist
  const existing = await db.one('SELECT id FROM tasks WHERE id = $1', [id]);
  if (!existing) return null; // -> 404

  // 2. Permission: managers/admins always; collaborators only if assigned
  const isManager = user.role === 'project_manager' || user.role === 'admin';
  if (!isManager) {
    const assigned = await isUserAssigned(id, user.id);
    if (!assigned) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
  }

  // 3. Update the status
  await db.query(
    'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, id]
  );

  const updatedTask = await getTaskById(id);
  for (const assignee of updatedTask.assignees) {
    if (assignee.id === user.id) continue; // don't notify the person who changed it
    try {
      await createNotification(
        assignee.id,
        'status_changed',
        `Task "${updatedTask.title}" is now ${status}`,
        id
      );
    } catch (e) {
      console.error('status_changed notification failed:', e.message);
    }
  }

  return updatedTask;
}

// Delete a task (managers only — enforced in the route).
// task_assignments and task_labels are removed automatically (ON DELETE CASCADE).
// Returns the deleted row ({ id }) so the caller knows it existed, or null if not found.
async function deleteTask(id) {
  return db.one('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
}

module.exports = {
  listTasks,
  createTask,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  canModifyTask,
};
