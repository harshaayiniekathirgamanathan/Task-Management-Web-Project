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

module.exports = {
  loginUser
};
