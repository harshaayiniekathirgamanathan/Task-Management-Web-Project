const supabase = require('../utils/supabase');
const bcrypt = require('bcryptjs');

const loginUser = async (email, password) => {
  // Fetch user from Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  // Check if user is active
  if (user.is_active === false) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  // Return user row on success
  return user;
};

const getUserById = async (id) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !user || user.is_active === false) {
    throw { status: 401, message: 'User not found or inactive' };
  }

  return user;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw { status: 404, message: 'User not found' };
  }

  if (!user.must_reset_password) {
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isMatch) {
    throw { status: 400, message: 'Invalid current password' };
  }
}

  const salt = await bcrypt.genSalt(10);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: hashedNewPassword, must_reset_password: false })
    .eq('id', userId);

  if (updateError) {
    throw { status: 500, message: 'Failed to update password' };
  }
};

module.exports = {
  loginUser,
  getUserById,
  changePassword
};
