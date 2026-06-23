const authService = require('../services/authService');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const { password_hash, ...safeUser } = user;
    
    res.json({
      accessToken: token,
      user: safeUser
    });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    res.status(status).json({ code: status, message: message });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ code: 401, message: 'No refresh token provided' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await authService.getUserById(decoded.id);
    
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ code: 401, message: 'Invalid or expired refresh token' });
  }
};

const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.status(204).end();
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    await authService.changePassword(userId, currentPassword, newPassword);
    
    res.json({ message: 'Password updated' });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    res.status(status).json({ code: status, message });
  }
};

module.exports = {
  login,
  refresh,
  logout,
  changePassword
};
