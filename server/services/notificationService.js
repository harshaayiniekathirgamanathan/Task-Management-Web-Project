const db = require('../utils/db');
const { emitToUser } = require('../sockets/io');

const ALLOWED_TYPES = [
  'task_assigned',
  'status_changed',
  'comment_added',
  'deadline_approaching',
  'admin_update',
];

// Save notification and try to deliver it immediately
async function createNotification(
  userId,
  type,
  message,
  taskId = null
) {
  if (!ALLOWED_TYPES.includes(type)) {
    const err = new Error('Invalid notification type');
    err.status = 400;
    throw err;
  }

  const notification = await db.one(
    `INSERT INTO notifications (user_id, task_id, type, message, is_read, is_delivered)
     VALUES ($1, $2, $3, $4, false, false)
     RETURNING *`,
    [userId, taskId, type, message]
  );

  try {
    const { getIO } = require('../sockets/io');
    let isOnline = false;
    try {
      const io = getIO();
      const room = io.sockets.adapter.rooms.get(`user:${userId}`);
      isOnline = room && room.size > 0;
    } catch (e) {
      // Catch error during test setups where Socket.IO might not be initialized
    }

    if (isOnline) {
      emitToUser(userId, 'notification:new', {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        task_id: notification.task_id,
        created_at: notification.created_at,
      });

      await db.query('UPDATE notifications SET is_delivered = true WHERE id = $1', [
        notification.id,
      ]);

      notification.is_delivered = true;
    }
  } catch (err) {
    console.error('Notification delivery failed:', err.message);
  }

  return notification;
}

module.exports = {
  createNotification,
};
