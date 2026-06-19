const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Get current user's notifications
router.get(
  '/notifications',
  authMiddleware,
  notificationController.getNotifications
);

// Mark notification as read
router.patch(
  '/notifications/:notificationId/read',
  authMiddleware,
  notificationController.markAsRead
);

module.exports = router;