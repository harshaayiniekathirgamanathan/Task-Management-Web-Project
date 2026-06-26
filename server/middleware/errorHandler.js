// The LAST middleware. Any error sent to next(err) ends up here,
// so the server replies with clean JSON instead of crashing.
function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  // For 5xx, hide the internal details (e.g. raw DB/driver errors) from the
  // client and send a generic message. Our own 4xx messages are safe to show.
  const message = status >= 500
    ? 'Internal server error'
    : (err.message || 'Error');

  console.error(err); // full detail still goes to the server logs

  res.status(status).json({ code: status, message });
}

module.exports = errorHandler;