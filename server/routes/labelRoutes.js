const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const labelController = require('../controllers/labelController');

const router = express.Router();

// Get all labels for a project
router.get(
  '/projects/:projectId/labels',
  authMiddleware,
  labelController.getLabels
);

// Create label
router.post(
  '/projects/:projectId/labels',
  authMiddleware,
  labelController.createLabel
);

// Attach label to task
router.post(
  '/tasks/:taskId/labels',
  authMiddleware,
  labelController.attachLabel
);

// Remove label from task
router.delete(
  '/tasks/:taskId/labels/:labelId',
  authMiddleware,
  labelController.removeLabel
);

module.exports = router;