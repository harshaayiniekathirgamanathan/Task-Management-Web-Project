const labelService = require('../services/labelService');

async function getLabels(req, res, next) {
  try {
    const labels = await labelService.getLabels(
      req.params.projectId
    );

    res.json(labels);
  } catch (err) {
    next(err);
  }
}

async function createLabel(req, res, next) {
  try {
    const label = await labelService.createLabel(
      req.params.projectId,
      req.user.id,
      req.body.name,
      req.body.color
    );

    res.status(201).json(label);
  } catch (err) {
    next(err);
  }
}

async function attachLabel(req, res, next) {
  try {
    const result = await labelService.attachLabel(
      req.params.taskId,
      req.body.labelId
    );

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function removeLabel(req, res, next) {
  try {
    const result = await labelService.removeLabel(
      req.params.taskId,
      req.params.labelId
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLabels,
  createLabel,
  attachLabel,
  removeLabel,
};