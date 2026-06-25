const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const taskController = require('../controllers/taskController');

// Every task route requires login
router.use(authMiddleware);

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

    body('title')
      .trim()
      .notEmpty().withMessage('Title is required'),

    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('priority must be low, medium, or high'),

    body('due_date')
      .optional()
      .isISO8601().withMessage('due_date must be a valid date')
      .bail()
      .custom((value) => {
        if (new Date(value).getTime() < Date.now()) {
          throw new Error('due_date cannot be in the past');
        }
        return true;
      }),

    body('assignee_ids')
      .optional()
      .isArray().withMessage('assignee_ids must be an array'),
    body('assignee_ids.*')
      .isUUID().withMessage('each assignee id must be a valid id'),
  ],
  validate,
  taskController.createTask
);

module.exports = router;