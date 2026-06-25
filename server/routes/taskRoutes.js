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
  .optional()
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

// GET /api/tasks -> list tasks (any logged-in user), optional filters + sort
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

// POST /api/tasks -> create a task (managers/admins only)
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
    ...assigneeRules,
  ],
  validate,
  taskController.createTask
);

// GET /api/tasks/:id -> one full task (any logged-in user)
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid task id')],
  validate,
  taskController.getTask
);

// PATCH /api/tasks/:id -> update a task (managers/admins only)
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

// PATCH /api/tasks/:id/status -> change status.
// NOTE: no requireRole here — collaborators are allowed too (if assigned),
// so the role+assignment check happens in the service.
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

// DELETE /api/tasks/:id -> delete a task (managers/admins only)
router.delete(
  '/:id',
  requireRole('project_manager', 'admin'), // collaborator -> 403
  [param('id').isUUID().withMessage('Invalid task id')],
  validate,
  taskController.deleteTask
);

module.exports = router;