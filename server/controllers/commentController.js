const commentService = require('../services/commentService');

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