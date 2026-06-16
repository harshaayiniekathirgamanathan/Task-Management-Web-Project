// Restricts a route to certain roles.
// Use like: router.post('/', requireRole('admin', 'project_manager'), handler)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireRole };