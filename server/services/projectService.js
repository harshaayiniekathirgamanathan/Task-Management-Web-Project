// Service for projects — ALL database work for projects lives here.
// Controllers call these functions; this file talks to PostgreSQL via utils/db.
const db = require('../utils/db');

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
    creator_name: row.creator_name || null,
    total_tasks: stats.total,
    completed_tasks: stats.completed,
    progress,
  };
}

// Build a { project_id: { total, completed } } map for the given project ids.
async function getTaskStats(projectIds) {
  const stats = {};
  if (!projectIds.length) return stats;

  const rows = await db.many(
    `SELECT project_id,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
       FROM tasks
      WHERE project_id = ANY($1::uuid[])
      GROUP BY project_id`,
    [projectIds]
  );

  for (const row of rows) {
    stats[row.project_id] = { total: row.total, completed: row.completed };
  }
  return stats;
}

const PROJECT_SELECT =
  `SELECT p.id, p.title, p.description, p.created_by, p.created_at, u.name AS creator_name
     FROM projects p
     LEFT JOIN users u ON u.id = p.created_by`;

// Get all projects, newest first, each with its creator's name and a task-
// completion summary (total / completed / progress %).
async function listProjects() {
  const data = await db.many(`${PROJECT_SELECT} ORDER BY p.created_at DESC`);
  const stats = await getTaskStats(data.map((p) => p.id));
  return data.map((p) => toProjectShape(p, stats[p.id]));
}

// Create one project. created_by is the logged-in user's id.
async function createProject({ title, description, userId }) {
  return db.one(
    `INSERT INTO projects (title, description, created_by)
     VALUES ($1, $2, $3)
     RETURNING id, title, description, created_by, created_at`,
    [title, description ?? null, userId]
  );
}

// Get one project by id (with creator name + task progress). Null if missing.
async function getProjectById(id) {
  const data = await db.one(`${PROJECT_SELECT} WHERE p.id = $1`, [id]);
  if (!data) return null;

  const stats = await getTaskStats([id]);
  return toProjectShape(data, stats[id]);
}

// Update title/description on a project. Returns the updated row, or null if not found.
async function updateProject(id, { title, description }) {
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
  params.push(id);

  return db.one(
    `UPDATE projects SET ${sets.join(', ')} WHERE id = $${params.length}
     RETURNING id, title, description, created_by, created_at`,
    params
  );
}

// Delete a project. Returns the deleted row (so we know it existed), or null.
async function deleteProject(id) {
  return db.one('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
}

module.exports = {
  listProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
};
