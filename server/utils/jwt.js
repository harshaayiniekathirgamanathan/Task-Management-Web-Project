const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
};

module.exports = {
  generateAccessToken
};
