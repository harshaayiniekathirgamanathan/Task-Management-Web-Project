const authService = require('../services/authService');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');

// Refresh-token cookie options. In production the frontend (e.g. Vercel) and the
// API (e.g. Render) are on different domains, so the cookie must be SameSite=None
// + Secure to be sent at all. Locally we use Lax so it still works over http.
const isProd = process.env.NODE_ENV === 'production';
const refreshCookieOptions = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

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

    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ code: 401, message: 'Invalid or expired refresh token' });
  }
};

const logout = (req, res) => {
  // clearCookie must use the same attributes (minus maxAge) or the browser won't clear it
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  });
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
