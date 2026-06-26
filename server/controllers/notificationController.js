const db = require('../utils/db');

// Get notifications for logged-in user
async function getNotifications(req, res, next) {
  try {
    const data = await db.many(
      `SELECT id, type, message, task_id, is_read, created_at
         FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
}

// Mark notification as read
async function markAsRead(req, res, next) {
  try {
    const data = await db.one(
      `UPDATE notifications SET is_read = true
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
      [req.params.notificationId, req.user.id]
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
};
