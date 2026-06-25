const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const projectController = require('../controllers/projectController');

// All project routes require login
router.use(authMiddleware);

// GET /api/projects -> list projects (any logged-in user)
router.get('/', projectController.listProjects);

// POST /api/projects -> create a project (managers/admins only)
router.post(
  '/',
  requireRole('project_manager', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
  ],
  validate,
  projectController.createProject
);

// GET /api/projects/:id -> one project (any logged-in user)
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid project id')],
  validate,
  projectController.getProject
);

// PATCH /api/projects/:id -> update title/description (managers/admins only)
router.patch(
  '/:id',
  requireRole('project_manager', 'admin'), // role check first -> collaborator gets 403
  [
    param('id').isUUID().withMessage('Invalid project id'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  ],
  validate,
  projectController.updateProject
);

// DELETE /api/projects/:id -> remove it (managers/admins only)
router.delete(
  '/:id',
  requireRole('project_manager', 'admin'),
  [param('id').isUUID().withMessage('Invalid project id')],
  validate,
  projectController.deleteProject
);

module.exports = router;