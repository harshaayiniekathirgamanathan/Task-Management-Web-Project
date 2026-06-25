const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const attachmentController = require('../controllers/attachmentController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * @swagger
 * /api/tasks/{taskId}/attachments:
 *   post:
 *     summary: Upload a file attachment for a task
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The task ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Attachment uploaded successfully
 *       400:
 *         description: File missing or file size limit exceeded (>10MB)
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/tasks/:taskId/attachments',
  authMiddleware,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ code: 400, message: 'File size limit exceeded (max 10MB)' });
        }
        return res.status(400).json({ code: 400, message: err.message });
      }
      next();
    });
  },
  attachmentController.uploadAttachment
);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments:
 *   get:
 *     summary: List all attachments for a task
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The task ID
 *     responses:
 *       200:
 *         description: List of task attachments, newest first
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/tasks/:taskId/attachments',
  authMiddleware,
  attachmentController.listAttachments
);

module.exports = router;
