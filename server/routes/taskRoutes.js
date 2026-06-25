const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const taskController = require('../controllers/taskController');

// Every task route requires login
router.use(authMiddleware);

// GET /api/tasks -> list tasks (scaffold: returns [] for now)
router.get('/', taskController.listTasks);

// POST /api/tasks -> create a task (managers/admins only)
router.post(
  '/',
  requireRole('project_manager', 'admin'), // role check first -> collaborator gets 403
  [
    body('project_id')
      .notEmpty().withMessage('project_id is required')
      .bail() // stop here if it's empty, so we don't also report "not a valid id"
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
  ],
  validate,
  taskController.createTask
);

module.exports = router;