const db = require('../utils/db');
const bcrypt = require('bcryptjs');

const loginUser = async (email, password) => {
  const user = await db.one('SELECT * FROM users WHERE email = $1', [email]);

  if (!user || user.is_active === false) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  return user;
};

const getUserById = async (id) => {
  const user = await db.one('SELECT * FROM users WHERE id = $1', [id]);

  if (!user || user.is_active === false) {
    throw { status: 401, message: 'User not found or inactive' };
  }

  return user;
};

const storeRefreshToken = async (token, userId, expiresAt) => {
  try {
    await db.query(
      'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [token, userId, expiresAt]
    );
  } catch (err) {
    throw { status: 500, message: 'Failed to store refresh token' };
  }
};

const findRefreshToken = async (token) => {
  return db.one('SELECT * FROM refresh_tokens WHERE token = $1', [token]);
};

const deleteRefreshToken = async (token) => {
  await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
};

const revokeAllOtherRefreshTokens = async (userId, currentRefreshToken) => {
  if (currentRefreshToken) {
    await db.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1 AND token <> $2',
      [userId, currentRefreshToken]
    );
  } else {
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  }
};

const changePassword = async (userId, currentPassword, newPassword, currentRefreshToken) => {
  const user = await db.one('SELECT * FROM users WHERE id = $1', [userId]);

  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  // Bypass checks on must_reset_password = true
  if (!user.must_reset_password) {
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw { status: 400, message: 'Invalid current password' };
    }
  }

  const salt = await bcrypt.genSalt(10);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);

  try {
    await db.query(
      'UPDATE users SET password_hash = $1, must_reset_password = false, updated_at = NOW() WHERE id = $2',
      [hashedNewPassword, userId]
    );
  } catch (err) {
    throw { status: 500, message: 'Failed to update password' };
  }

  // Revoke all OTHER sessions/tokens
  await revokeAllOtherRefreshTokens(userId, currentRefreshToken);
};

module.exports = {
  loginUser,
  getUserById,
  storeRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  revokeAllOtherRefreshTokens,
  changePassword,
};
