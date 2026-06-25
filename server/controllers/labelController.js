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
    const { name, color } = req.body;
    if (!name || !name.trim()) {
      const err = new Error('Label name is required');
      err.status = 400;
      throw err;
    }
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!color || !hexColorRegex.test(color)) {
      const err = new Error('Label color must be a valid hex color code (e.g. #FF0000)');
      err.status = 400;
      throw err;
    }

    const label = await labelService.createLabel(
      req.params.projectId,
      req.user.id,
      name.trim(),
      color
    );

    res.status(201).json(label);
  } catch (err) {
    if (err.code === '23505') {
      const error = new Error('Label name must be unique per project');
      error.status = 400;
      return next(error);
    }
    next(err);
  }
}

async function attachLabel(req, res, next) {
  try {
    const result = await labelService.attachLabel(
      req.params.taskId,
      req.params.labelId
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function removeLabel(req, res, next) {
  try {
    await labelService.removeLabel(
      req.params.taskId,
      req.params.labelId
    );

    res.status(204).end();
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
