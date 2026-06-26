const attachmentService = require('../services/attachmentService');
const taskService = require('../services/taskService');

// Upload a file attachment
async function uploadAttachment(req, res, next) {
  try {
    // Collaborators may only upload files to tasks assigned to them.
    const allowed = await taskService.canModifyTask(req.params.taskId, req.user);
    if (!allowed) {
      return res.status(403).json({
        code: 403,
        message: 'You can only upload files to tasks assigned to you',
      });
    }

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