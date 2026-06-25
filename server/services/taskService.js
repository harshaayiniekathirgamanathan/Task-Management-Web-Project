// Service for tasks — ALL Supabase database work for tasks lives here.
const supabase = require('../utils/supabase');

// Create one task.
// The route already checked the input shape; here we confirm the project
// exists (tasks.project_id references projects.id), then insert with status 'todo'.
async function createTask({ project_id, title, description, priority, due_date, created_by }) {
  // 1. Make sure the project actually exists
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .maybeSingle(); // null instead of an error when no project matches

  if (projectError) {
    const err = new Error(projectError.message);
    err.status = 500;
    throw err;
  }

  if (!project) {
    const err = new Error('project_id does not exist');
    err.status = 400; // bad input: the project they referenced isn't real
    throw err;
  }

  // 2. Insert the task (status starts as 'todo')
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id,
      title,
      description: description ?? null,
      priority: priority || 'medium', // fall back to the schema default if not sent
      status: 'todo',
      due_date: due_date || null,
      created_by,
    })
    .select('id, project_id, title, description, priority, status, due_date, created_by, created_at')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  return data;
}

module.exports = {
  createTask,
};