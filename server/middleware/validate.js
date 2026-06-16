const { validationResult } = require('express-validator');

// Runs after express-validator checks on a route.
// If any input failed validation, stop and return the first message.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return res.status(400).json({ code: 400, message: first.msg });
  }
  next();
}

module.exports = validate;