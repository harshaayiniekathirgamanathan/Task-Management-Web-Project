const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const commentController = require('../controllers/commentController');

const router = express.Router();

router.get(
  '/tasks/:taskId/comments',
  authMiddleware,
  commentController.listComments
);

router.post(
  '/tasks/:taskId/comments',
  authMiddleware,
  commentController.addComment
);

module.exports = router;