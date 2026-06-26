const commentService = require('../services/commentService');
const taskService = require('../services/taskService');

// Get all comments for a task
async function listComments(req, res, next) {
  try {
    const comments = await commentService.listComments(
      req.params.taskId
    );

    res.json(comments);
  } catch (err) {
    next(err);
  }
}

// Add a new comment
async function addComment(req, res, next) {
  try {
    // Collaborators may only comment on tasks assigned to them.
    const allowed = await taskService.canModifyTask(req.params.taskId, req.user);
    if (!allowed) {
      return res.status(403).json({
        code: 403,
        message: 'You can only comment on tasks assigned to you',
      });
    }

    const comment = await commentService.addComment(
      req.params.taskId,
      req.user.id,
      req.body.content
    );

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listComments,
  addComment,
};