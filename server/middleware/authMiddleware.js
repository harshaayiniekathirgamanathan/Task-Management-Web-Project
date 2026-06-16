const jwt = require('jsonwebtoken');

// Checks the request has a valid login token.
// If valid, attaches { id, role } to req.user so routes know who's calling.
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  // Expecting the header "Authorization: Bearer <token>"
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ code: 401, message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'Unauthorized' });
  }
}

module.exports = authMiddleware;