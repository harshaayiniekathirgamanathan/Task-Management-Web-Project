const db = require('../utils/db');

// Get all comments for a task
async function listComments(taskId) {
  try {
    const rows = await db.many(
      `SELECT c.id, c.content, c.created_at, u.id AS user_id, u.name AS user_name
         FROM comments c
    LEFT JOIN users u ON u.id = c.user_id
        WHERE c.task_id = $1
     ORDER BY c.created_at ASC`,
      [taskId]
    );

    return rows.map((comment) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      author: comment.user_id ? { id: comment.user_id, name: comment.user_name } : null,
    }));
  } catch (err) {
    console.error('listComments error:', err.message);
    return [];
  }
}

// Add a comment to a task
async function addComment(taskId, userId, content) {
  if (!content || !content.trim()) {
    const err = new Error('Comment content is required');
    err.status = 400;
    throw err;
  }

  const inserted = await db.one(
    `INSERT INTO comments (task_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, content, created_at, user_id`,
    [taskId, userId, content.trim()]
  );

  const user = await db.one('SELECT id, name FROM users WHERE id = $1', [userId]);

  const formattedComment = {
    id: inserted.id,
    content: inserted.content,
    created_at: inserted.created_at,
    author: user ? { id: user.id, name: user.name } : null,
  };

  // Step 4.9 hook: Notify the other assignees on this task
  try {
    const assignees = await db.many(
      'SELECT user_id FROM task_assignments WHERE task_id = $1',
      [taskId]
    );

    if (assignees && assignees.length > 0) {
      const { createNotification } = require('./notificationService');
      for (const assignment of assignees) {
        if (assignment.user_id !== userId) {
          await createNotification(
            assignment.user_id,
            'comment_added',
            `A new comment was added to a task you are assigned to.`,
            taskId
          );
        }
      }
    }
  } catch (err) {
    console.error('Failed to notify assignees of new comment:', err.message);
  }

  return formattedComment;
}

module.exports = {
  listComments,
  addComment,
};
