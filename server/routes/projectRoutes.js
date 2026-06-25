const express = require('express');
const { body } = require('express-validator');
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
  requireRole('project_manager', 'admin'), // role check first
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required'),
  ],
  validate, // returns 400 with the message above if title is missing
  projectController.createProject
);

module.exports = router;