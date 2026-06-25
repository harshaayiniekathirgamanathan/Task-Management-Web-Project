const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get the logged-in user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the user's notifications (newest first)
 *       401:
 *         description: Unauthorized
 */

// Get current user's notifications
router.get(
  '/notifications',
  authMiddleware,
  notificationController.getNotifications
);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The notification's id
 *     responses:
 *       200:
 *         description: The updated notification
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */

// Mark notification as read
router.patch(
  '/notifications/:notificationId/read',
  authMiddleware,
  notificationController.markAsRead
);

module.exports = router;