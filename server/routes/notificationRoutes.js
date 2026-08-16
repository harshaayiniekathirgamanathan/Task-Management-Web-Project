const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get current user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications, newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   type:
 *                     type: string
 *                   message:
 *                     type: string
 *                   task_id:
 *                     type: string
 *                     format: uuid
 *                   is_read:
 *                     type: boolean
 *                   created_at:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/notifications',
  authMiddleware,
  notificationController.getNotifications
);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/notifications/:id/read',
  authMiddleware,
  notificationController.markAsRead
);

module.exports = router;
