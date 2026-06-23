const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbac');
const labelController = require('../controllers/labelController');

const router = express.Router();

/**
 * @swagger
 * /api/projects/{projectId}/labels:
 *   get:
 *     summary: Get all labels for a project
 *     tags: [Labels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The project ID
 *     responses:
 *       200:
 *         description: List of project labels
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
 *                   name:
 *                     type: string
 *                   color:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/projects/:projectId/labels',
  authMiddleware,
  labelController.getLabels
);

/**
 * @swagger
 * /api/projects/{projectId}/labels:
 *   post:
 *     summary: Create a new label for a project
 *     tags: [Labels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - color
 *             properties:
 *               name:
 *                 type: string
 *                 description: The label name
 *               color:
 *                 type: string
 *                 description: Hex color (e.g. #FF0000)
 *     responses:
 *       201:
 *         description: Label created successfully
 *       400:
 *         description: Invalid input or duplicate label name
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 */
router.post(
  '/projects/:projectId/labels',
  authMiddleware,
  requireRole('project_manager', 'admin'),
  labelController.createLabel
);

/**
 * @swagger
 * /api/tasks/{taskId}/labels/{labelId}:
 *   post:
 *     summary: Attach a label to a task
 *     tags: [Labels]
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
 *       - in: path
 *         name: labelId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The label ID to attach
 *     responses:
 *       200:
 *         description: Label attached successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/tasks/:taskId/labels/:labelId',
  authMiddleware,
  requireRole('project_manager', 'admin'),
  labelController.attachLabel
);

/**
 * @swagger
 * /api/tasks/{taskId}/labels/{labelId}:
 *   delete:
 *     summary: Remove a label from a task
 *     tags: [Labels]
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
 *       - in: path
 *         name: labelId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The label ID to remove
 *     responses:
 *       204:
 *         description: Label removed successfully (no content)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/tasks/:taskId/labels/:labelId',
  authMiddleware,
  requireRole('project_manager', 'admin'),
  labelController.removeLabel
);

module.exports = router;
