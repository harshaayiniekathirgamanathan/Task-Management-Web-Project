const db = require('../utils/db');
const { createNotification } = require('./notificationService');

// Get all comments for a task
async function listComments(taskId) {
  return db.many(
    `SELECT c.id, c.content, c.created_at,
            json_build_object('id', u.id, 'name', u.name) AS author
       FROM comments c
       JOIN users u ON u.id = c.user_id
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC`,
    [taskId]
  );
}

// Add a comment to a task
async function addComment(taskId, userId, content) {
  if (!content || !content.trim()) {
    const err = new Error('Comment content is required');
    err.status = 400;
    throw err;
  }

  const comment = await db.one(
    `INSERT INTO comments (task_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [taskId, userId, content]
  );

  // Step 4.9 — notify the other people assigned to this task
  const assignees = await db.many(
    'SELECT user_id FROM task_assignments WHERE task_id = $1',
    [taskId]
  );

  for (const a of assignees) {
    if (a.user_id === userId) continue; // don't notify the comment author
    try {
      await createNotification(
        a.user_id,
        'comment_added',
        'A new comment was added to a task you are on',
        taskId
      );
    } catch (e) {
      console.error('comment_added notification failed:', e.message);
    }
  }

  return comment;
}

module.exports = {
  listComments,
  addComment,
};
