const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const projectController = require('../controllers/projectController');

// All project routes require login
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         created_by:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: List all projects (newest first)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 */
router.get('/', projectController.listProjects);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a project (project_manager/admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request (title is required)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a manager/admin)
 */
router.post(
  '/',
  requireRole('project_manager', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
  ],
  validate,
  projectController.createProject
);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get one project by id
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid project id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid project id')],
  validate,
  projectController.getProject
);

/**
 * @swagger
 * /api/projects/{id}:
 *   patch:
 *     summary: Update a project's title/description (project_manager/admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a manager/admin)
 *       404:
 *         description: Project not found
 */
router.patch(
  '/:id',
  requireRole('project_manager', 'admin'),
  [
    param('id').isUUID().withMessage('Invalid project id'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  ],
  validate,
  projectController.updateProject
);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project (project_manager/admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Project deleted (no content)
 *       400:
 *         description: Invalid project id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a manager/admin)
 *       404:
 *         description: Project not found
 */
router.delete(
  '/:id',
  requireRole('project_manager', 'admin'),
  [param('id').isUUID().withMessage('Invalid project id')],
  validate,
  projectController.deleteProject
);

module.exports = router;