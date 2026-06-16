// The LAST middleware. Any error sent to next(err) ends up here,
// so the server replies with clean JSON instead of crashing.
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(err); // log the full error on the server for debugging

  res.status(status).json({ code: status, message });
}

module.exports = errorHandler;