// Service for tasks — ALL Supabase database work for tasks lives here.
const supabase = require('../utils/supabase');

// Turn a raw task row (with embedded join tables) into the API contract shape.
function toTaskShape(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    due_date: row.due_date,
    assignees: (row.task_assignments || []).map((a) => a.users),
    labels: (row.task_labels || []).map((l) => l.labels),
  };
}

const TASK_SELECT =
  'id, title, description, priority, status, due_date, ' +
  'task_assignments ( users ( id, name ) ), ' +
  'task_labels ( labels ( id, name, color ) )';

// Get one full task by id (assignees + labels joined). Returns null if not found.
async function getTaskById(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('id', taskId)
    .maybeSingle();

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  if (!data) return null;
  return toTaskShape(data);
}

// Is this user assigned to this task? (true/false)
async function isUserAssigned(taskId, userId) {
  const { data, error } = await supabase
    .from('task_assignments')
    .select('task_id')
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }
  return !!data;
}

// Confirm a list of ids are all real users (else throw 400).
async function assertUsersExist(uniqueIds) {
  if (uniqueIds.length === 0) return;
  const { data: users, error } = await supabase
    .from('users')
    .select('id')
    .in('id', uniqueIds);

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }
  if (users.length !== uniqueIds.length) {
    const err = new Error('Unknown user assigned');
    err.status = 400;
    throw err;
  }
}

// List tasks with optional filters and sorting.
async function listTasks({ project_id, status, priority, assignee, sort } = {}) {
  let assignedTaskIds = null;
  if (assignee) {
    const { data: rows, error: aErr } = await supabase
      .from('task_assignments')
      .select('task_id')
      .eq('user_id', assignee);

    if (aErr) {
      const err = new Error(aErr.message);
      err.status = 500;
      throw err;
    }
    assignedTaskIds = rows.map((r) => r.task_id);
    if (assignedTaskIds.length === 0) return [];
  }

  let query = supabase.from('tasks').select(TASK_SELECT);

  if (project_id) query = query.eq('project_id', project_id);
  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);
  if (assignedTaskIds) query = query.in('id', assignedTaskIds);

  if (sort === 'due_date') {
    query = query.order('due_date', { ascending: true, nullsFirst: false });
  } else if (sort === 'priority') {
    query = query.order('priority', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  return data.map(toTaskShape);
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
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .maybeSingle();

  if (projectError) {
    const err = new Error(projectError.message);
    err.status = 500;
    throw err;
  }
  if (!project) {
    const err = new Error('project_id does not exist');
    err.status = 400;
    throw err;
  }

  const uniqueAssignees = [...new Set(assignee_ids)];
  await assertUsersExist(uniqueAssignees);

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      project_id,
      title,
      description: description ?? null,
      priority: priority || 'medium',
      status: 'todo',
      due_date: due_date || null,
      created_by,
    })
    .select('id')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  if (uniqueAssignees.length > 0) {
    const rows = uniqueAssignees.map((user_id) => ({ task_id: task.id, user_id }));
    const { error: assignError } = await supabase
      .from('task_assignments')
      .insert(rows);

    if (assignError) {
      const err = new Error(assignError.message);
      err.status = 500;
      throw err;
    }
  }

  return getTaskById(task.id);
}

// Update a task's title/description/priority/due_date/assignee_ids (managers only — enforced in the route).
async function updateTask(id, { title, description, priority, due_date, assignee_ids }) {
  const { data: existing, error: existErr } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (existErr) {
    const err = new Error(existErr.message);
    err.status = 500;
    throw err;
  }
  if (!existing) return null;

  let uniqueAssignees = null;
  if (assignee_ids !== undefined) {
    uniqueAssignees = [...new Set(assignee_ids)];
    await assertUsersExist(uniqueAssignees);
  }

  const patch = { updated_at: new Date().toISOString() };
  if (title !== undefined) patch.title = title;
  if (description !== undefined) patch.description = description;
  if (priority !== undefined) patch.priority = priority;
  if (due_date !== undefined) patch.due_date = due_date;

  const { error: updErr } = await supabase.from('tasks').update(patch).eq('id', id);
  if (updErr) {
    const err = new Error(updErr.message);
    err.status = 500;
    throw err;
  }

  if (uniqueAssignees !== null) {
    const { error: delErr } = await supabase.from('task_assignments').delete().eq('task_id', id);
    if (delErr) {
      const err = new Error(delErr.message);
      err.status = 500;
      throw err;
    }
    if (uniqueAssignees.length > 0) {
      const rows = uniqueAssignees.map((user_id) => ({ task_id: id, user_id }));
      const { error: insErr } = await supabase.from('task_assignments').insert(rows);
      if (insErr) {
        const err = new Error(insErr.message);
        err.status = 500;
        throw err;
      }
    }
  }

  return getTaskById(id);
}

// Change ONLY a task's status.
// Managers/admins may change any task; a collaborator may change it ONLY
// if they are assigned to that task. `user` is { id, role } from the token.
// Returns the updated task, or null if the task does not exist (-> 404).
async function updateTaskStatus(id, status, user) {
  // 1. Task must exist
  const { data: existing, error: existErr } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (existErr) {
    const err = new Error(existErr.message);
    err.status = 500;
    throw err;
  }
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
  const { error: updErr } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updErr) {
    const err = new Error(updErr.message);
    err.status = 500;
    throw err;
  }

  // notifications hook here
  // Member 4: the task's status just changed — fire a "status changed"
  // notification to the task's assignees here (e.g. notifyStatusChange(id, status, user.id)).

  // 4. Return the full updated task
  return getTaskById(id);
}

module.exports = {
  listTasks,
  createTask,
  getTaskById,
  updateTask,
  updateTaskStatus,
};