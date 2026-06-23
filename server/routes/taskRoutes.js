const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const taskController = require('../controllers/taskController');

const router = express.Router();

// List all tasks
router.get('/', authMiddleware, taskController.listTasks);

module.exports = router;
