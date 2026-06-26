const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const taskController = require('../controllers/taskController');

// Every task route requires login
router.use(authMiddleware);

// Reusable validators for the task body fields (used by create + update)
const priorityRule = body('priority')
  .optional()
  .isIn(['low', 'medium', 'high']).withMessage('priority must be low, medium, or high');

const dueDateRule = body('due_date')
  .optional({ nullable: true, checkFalsy: true })
  .isISO8601().withMessage('due_date must be a valid date')
  .bail()
  .custom((value) => {
    if (new Date(value).getTime() < Date.now()) {
      throw new Error('due_date cannot be in the past');
    }
    return true;
  });

const assigneeRules = [
  body('assignee_ids').optional().isArray().withMessage('assignee_ids must be an array'),
  body('assignee_ids.*').isUUID().withMessage('each assignee id must be a valid id'),
];

// On create, a task must have at least one assignee (a collaborator or
// project manager — admins are rejected in the service layer).
const createAssigneeRules = [
  body('assignee_ids')
    .isArray({ min: 1 }).withMessage('At least one assignee is required'),
  body('assignee_ids.*').isUUID().withMessage('each assignee id must be a valid id'),
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Assignee:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *     Label:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         color:
 *           type: string
 *     Task:
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
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *         status:
 *           type: string
 *           enum: [todo, in_progress, completed]
 *         due_date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         assignees:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Assignee'
 *         labels:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Label'
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: List tasks with optional filters and sorting
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Only tasks in this project
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, completed]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Only tasks assigned to this user id
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [due_date, priority]
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid filter/sort value
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  [
    query('project_id').optional().isUUID().withMessage('project_id must be a valid id'),
    query('assignee').optional().isUUID().withMessage('assignee must be a valid id'),
    query('status').optional().isIn(['todo', 'in_progress', 'completed']).withMessage('invalid status'),
    query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('invalid priority'),
    query('sort').optional().isIn(['due_date', 'priority']).withMessage('sort must be due_date or priority'),
  ],
  validate,
  taskController.listTasks
);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a task (project_manager/admin only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - title
 *             properties:
 *               project_id:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               due_date:
 *                 type: string
 *                 format: date-time
 *               assignee_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request (validation failed / unknown project or user)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a manager/admin)
 */
router.post(
  '/',
  requireRole('project_manager', 'admin'),
  [
    body('project_id')
      .notEmpty().withMessage('project_id is required')
      .bail()
      .isUUID().withMessage('project_id must be a valid id'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    priorityRule,
    dueDateRule,
    ...createAssigneeRules,
  ],
  validate,
  taskController.createTask
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get one full task by id
 *     tags: [Tasks]
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
 *         description: The task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid task id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid task id')],
  validate,
  taskController.getTask
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Update a task (project_manager/admin only)
 *     tags: [Tasks]
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
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               due_date:
 *                 type: string
 *                 format: date-time
 *               assignee_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Updated task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a manager/admin)
 *       404:
 *         description: Task not found
 */
router.patch(
  '/:id',
  requireRole('project_manager', 'admin'),
  [
    param('id').isUUID().withMessage('Invalid task id'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    priorityRule,
    dueDateRule,
    ...assigneeRules,
  ],
  validate,
  taskController.updateTask
);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: Change a task's status (managers any task; collaborators only if assigned)
 *     tags: [Tasks]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, completed]
 *     responses:
 *       200:
 *         description: Updated task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request (invalid status)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (collaborator not assigned to this task)
 *       404:
 *         description: Task not found
 */
router.patch(
  '/:id/status',
  [
    param('id').isUUID().withMessage('Invalid task id'),
    body('status')
      .notEmpty().withMessage('status is required')
      .bail()
      .isIn(['todo', 'in_progress', 'completed']).withMessage('status must be todo, in_progress, or completed'),
  ],
  validate,
  taskController.updateTaskStatus
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task (project_manager/admin only)
 *     tags: [Tasks]
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
 *         description: Task deleted (no content)
 *       400:
 *         description: Invalid task id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a manager/admin)
 *       404:
 *         description: Task not found
 */
router.delete(
  '/:id',
  requireRole('project_manager', 'admin'),
  [param('id').isUUID().withMessage('Invalid task id')],
  validate,
  taskController.deleteTask
);

module.exports = router;