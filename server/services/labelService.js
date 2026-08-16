const db = require('../utils/db');

// Get all labels for a project
async function getLabels(projectId) {
  return db.many(
    `SELECT id, name, color FROM labels
      WHERE project_id = $1
      ORDER BY created_at ASC`,
    [projectId]
  );
}

// Create a new label
async function createLabel(projectId, userId, name, color) {
  return db.one(
    `INSERT INTO labels (project_id, created_by, name, color)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, color`,
    [projectId, userId, name, color]
  );
}

// Attach label to task. Idempotent: a duplicate is silently treated as success.
async function attachLabel(taskId, labelId) {
  const inserted = await db.one(
    `INSERT INTO task_labels (task_id, label_id)
     VALUES ($1, $2)
     ON CONFLICT (task_id, label_id) DO NOTHING
     RETURNING task_id, label_id`,
    [taskId, labelId]
  );

  // null when the row already existed (ON CONFLICT DO NOTHING returns nothing).
  return inserted || { task_id: taskId, label_id: labelId };
}

// Remove label from task
async function removeLabel(taskId, labelId) {
  await db.query(
    'DELETE FROM task_labels WHERE task_id = $1 AND label_id = $2',
    [taskId, labelId]
  );
  return { message: 'Label removed successfully' };
}

module.exports = {
  getLabels,
  createLabel,
  attachLabel,
  removeLabel,
};
