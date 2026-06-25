const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io; // holds the running Socket.IO server once started

// Start Socket.IO on top of the existing HTTP server
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // Check the login token BEFORE allowing a connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.id; // remember which user this socket belongs to
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    // Put this socket in a private room named after the user,
    // so later we can send messages to just this person.
    socket.join(`user:${socket.userId}`);
    console.log(`Socket connected for user ${socket.userId}`);

    // Deliver missed notifications when user reconnects (Step 4.10)
    try {
      const supabase = require('../utils/supabase');
      const { data: missedNotifications, error } = await supabase
        .from('notifications')
        .select('id, type, message, task_id, created_at')
        .eq('user_id', socket.userId)
        .eq('is_delivered', false);

      if (!error && missedNotifications && missedNotifications.length > 0) {
        for (const notification of missedNotifications) {
          socket.emit('notification:new', {
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
        }
      }
    } catch (err) {
      console.error('Failed to deliver missed notifications on reconnect:', err.message);
    }

    socket.on('disconnect', () => {
      console.log(`Socket disconnected for user ${socket.userId}`);
    });
  });


  console.log('Socket.IO ready');
  return io;
}

// Get the running server from anywhere in the app
function getIO() {
  if (!io) throw new Error('Socket.IO not started yet');
  return io;
}

// Send an event to ONE user (reaches all their open tabs/devices)
function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSocket, getIO, emitToUser };