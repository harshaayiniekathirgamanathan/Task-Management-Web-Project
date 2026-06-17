const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    
    // For now, return the user object on successful login
    res.json(user);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    res.status(status).json({ code: status, message: message });
  }
};

module.exports = {
  login
};
