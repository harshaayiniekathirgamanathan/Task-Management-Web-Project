// Service for projects — ALL Supabase database work lives here.
// Controllers call these functions; this file talks to the database.
const supabase = require('../utils/supabase');

// Get all projects, newest first.
async function listProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, created_by, created_at')
    .order('created_at', { ascending: false }); // newest first

  // If the database call failed, throw so the error handler sends clean JSON
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

module.exports = {
  listProjects,
  createProject,
};