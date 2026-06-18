const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const attachmentController = require('../controllers/attachmentController');

const router = express.Router();

// Store file in memory before uploading to Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Upload attachment
router.post(
  '/tasks/:taskId/attachments',
  authMiddleware,
  upload.single('file'),
  attachmentController.uploadAttachment
);

// List attachments for a task
router.get(
  '/tasks/:taskId/attachments',
  authMiddleware,
  attachmentController.listAttachments
);

module.exports = router;