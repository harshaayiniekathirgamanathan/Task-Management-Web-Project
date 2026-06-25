// Service for projects — ALL Supabase database work lives here.
// Controllers call these functions; this file talks to the database.
const supabase = require('../utils/supabase');

// Get all projects, newest first.
async function listProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, created_by, created_at')
    .order('created_at', { ascending: false }); // newest first

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  return data;
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

// Get one project by id. Returns the row, or null if it doesn't exist.
async function getProjectById(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, created_by, created_at')
    .eq('id', id)
    .maybeSingle(); // null (not an error) when no row matches

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  return data; // the project, or null
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