// Service for tasks — ALL Supabase database work for tasks lives here.
const supabase = require('../utils/supabase');

// Helper: fetch one task with its assignees joined in as [{ id, name }].
// Uses the task_assignments junction table to reach the users table.
async function getTaskWithAssignees(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .select(
      'id, project_id, title, description, priority, status, due_date, created_by, created_at, task_assignments ( users ( id, name ) )'
    )
    .eq('id', taskId)
    .maybeSingle();

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  if (!data) return null;

  // Flatten task_assignments: [{ users: {id,name} }] -> assignees: [{id,name}]
  const assignees = (data.task_assignments || []).map((row) => row.users);
  delete data.task_assignments;

  return { ...data, assignees };
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

  // 2. Every assignee must be a real user.
  //    We check BEFORE inserting the task, so a bad id never leaves an
  //    orphan task behind (Supabase has no easy multi-step transaction here).
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
    // If fewer rows came back than ids we asked for, at least one is unknown
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

  // 5. Return the task with its assignees joined in
  return getTaskWithAssignees(task.id);
}

module.exports = {
  createTask,
  getTaskWithAssignees,
};