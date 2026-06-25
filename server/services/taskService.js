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
    // task_assignments: [{ users: {id,name} }] -> assignees: [{id,name}]
    assignees: (row.task_assignments || []).map((a) => a.users),
    // task_labels: [{ labels: {id,name,color} }] -> labels: [{id,name,color}]
    labels: (row.task_labels || []).map((l) => l.labels),
  };
}

// The columns + joins we select for the full task shape.
const TASK_SELECT =
  'id, title, description, priority, status, due_date, ' +
  'task_assignments ( users ( id, name ) ), ' +
  'task_labels ( labels ( id, name, color ) )';

// Helper: fetch one task with its assignees + labels joined in.
async function getTaskWithAssignees(taskId) {
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

// List tasks with optional filters and sorting.
// Returns each task in the contract shape (with assignees + labels).
async function listTasks({ project_id, status, priority, assignee, sort } = {}) {
  // If filtering by assignee, first find which tasks that user is on.
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
    if (assignedTaskIds.length === 0) return []; // user is on no tasks -> nothing to return
  }

  // Build the main query
  let query = supabase.from('tasks').select(TASK_SELECT);

  if (project_id) query = query.eq('project_id', project_id);
  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);
  if (assignedTaskIds) query = query.in('id', assignedTaskIds);

  // Sorting
  if (sort === 'due_date') {
    query = query.order('due_date', { ascending: true, nullsFirst: false }); // soonest first
  } else if (sort === 'priority') {
    query = query.order('priority', { ascending: false }); // high -> medium -> low (enum order)
  } else {
    query = query.order('created_at', { ascending: false }); // default: newest first
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
  // 1. The project must exist
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

  // 2. Every assignee must be a real user (checked before inserting the task)
  const uniqueAssignees = [...new Set(assignee_ids)];
  if (uniqueAssignees.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .in('id', uniqueAssignees);

    if (usersError) {
      const err = new Error(usersError.message);
      err.status = 500;
      throw err;
    }
    if (users.length !== uniqueAssignees.length) {
      const err = new Error('Unknown user assigned');
      err.status = 400;
      throw err;
    }
  }

  // 3. Insert the task (status starts as 'todo')
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

  // 4. Insert one task_assignments row per assignee
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

  // 5. Return the task with assignees + labels joined in
  return getTaskWithAssignees(task.id);
}

module.exports = {
  listTasks,
  createTask,
  getTaskWithAssignees,
};