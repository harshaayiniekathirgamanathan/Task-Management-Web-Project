const attachmentService = require('../services/attachmentService');

// Upload a file attachment
async function uploadAttachment(req, res, next) {
  try {
    const attachment = await attachmentService.uploadAttachment(
      req.params.taskId,
      req.user.id,
      req.file
    );

    res.status(201).json(attachment);
  } catch (err) {
    next(err);
  }
}

// List attachments for a task
async function listAttachments(req, res, next) {
  try {
    const attachments = await attachmentService.listAttachments(
      req.params.taskId
    );

    res.json(attachments);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadAttachment,
  listAttachments,
};