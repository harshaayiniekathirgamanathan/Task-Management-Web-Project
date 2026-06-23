const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const commentController = require('../controllers/commentController');

const router = express.Router();

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   get:
 *     summary: Get all comments for a task
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The task ID
 *     responses:
 *       200:
 *         description: List of comments sorted oldest first
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
 *                   content:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                   author:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/tasks/:taskId/comments',
  authMiddleware,
  commentController.listComments
);

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   post:
 *     summary: Add a new comment to a task
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Comment content is empty
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/tasks/:taskId/comments',
  authMiddleware,
  commentController.addComment
);

module.exports = router;
