const supabase = require('../utils/supabase');
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

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        task_id: taskId,
        type,
        message,
        is_read: false,
        is_delivered: false,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

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

      await supabase
        .from('notifications')
        .update({ is_delivered: true })
        .eq('id', notification.id);

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
