const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { listProjects } = require('../controllers/projectController');

// All project routes require login
router.use(authMiddleware);

// GET /api/projects
router.get('/', listProjects);

module.exports = router;
