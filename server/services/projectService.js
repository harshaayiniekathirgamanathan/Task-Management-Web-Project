// Service for projects — ALL Supabase database work lives here.
// Controllers call these functions; this file talks to the database.
const supabase = require('../utils/supabase');

// Turn a project row + its task counts into the enriched API shape.
function toProjectShape(row, stats = { total: 0, completed: 0 }) {
  const progress = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    created_by: row.created_by,
    created_at: row.created_at,
    creator_name: row.creator?.name || null,
    total_tasks: stats.total,
    completed_tasks: stats.completed,
    progress,
  };
}

// Build a { project_id: { total, completed } } map for the given project ids.
async function getTaskStats(projectIds) {
  const stats = {};
  if (!projectIds.length) return stats;

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('project_id, status')
    .in('project_id', projectIds);

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  for (const task of tasks || []) {
    const entry = stats[task.project_id] || (stats[task.project_id] = { total: 0, completed: 0 });
    entry.total += 1;
    if (task.status === 'completed') entry.completed += 1;
  }
  return stats;
}

// Get all projects, newest first, each with its creator's name and a task-
// completion summary (total / completed / progress %).
async function listProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, created_by, created_at, creator:users!created_by ( name )')
    .order('created_at', { ascending: false }); // newest first

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  const stats = await getTaskStats(data.map((p) => p.id));
  return data.map((p) => toProjectShape(p, stats[p.id]));
}

// Create one project. created_by is the logged-in user's id.
async function createProject({ title, description, userId }) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      title,
      description,
      created_by: userId,
    })
    .select('id, title, description, created_by, created_at')
    .single(); // return just the one row we inserted

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  return data;
}

// Get one project by id (with creator name + task progress). Null if missing.
async function getProjectById(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, created_by, created_at, creator:users!created_by ( name )')
    .eq('id', id)
    .maybeSingle(); // null (not an error) when no row matches

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  if (!data) return null;

  const stats = await getTaskStats([id]);
  return toProjectShape(data, stats[id]);
}

// Update title/description on a project. Returns the updated row, or null if not found.
async function updateProject(id, { title, description }) {
  // Build the patch with only the fields that were actually sent
  const patch = { updated_at: new Date().toISOString() };
  if (title !== undefined) patch.title = title;
  if (description !== undefined) patch.description = description;

  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .select('id, title, description, created_by, created_at')
    .maybeSingle(); // null if no row matched that id

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  return data; // updated project, or null
}

// Delete a project. Returns the deleted row (so we know it existed), or null.
async function deleteProject(id) {
  const { data, error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  return data; // { id } if a row was deleted, or null
}

module.exports = {
  listProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
};