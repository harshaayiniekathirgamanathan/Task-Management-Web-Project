const supabase = require('../utils/supabase');
const bcrypt = require('bcryptjs');

async function seedOrResetAdmin() {
  const email = 'admin@example.com';
  const newPassword = 'Password123';

  console.log(`Hashing password '${newPassword}'...`);
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(newPassword, salt);

  // Check if admin user exists
  const { data: existingUser, error: fetchErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (fetchErr) {
    console.error('Error fetching user from Supabase:', fetchErr);
    return;
  }

  if (existingUser) {
    console.log(`User ${email} found! Updating password...`);
    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update({
        password_hash,
        is_active: true,
        must_reset_password: false,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();

    if (updateErr) {
      console.error('Error updating admin password:', updateErr);
    } else {
      console.log('Successfully updated admin password!');
      console.log('Updated user record:', updated);
    }
  } else {
    console.log(`User ${email} not found. Inserting new admin user...`);
    const { data: inserted, error: insertErr } = await supabase
      .from('users')
      .insert([
        {
          name: 'Harshaa',
          email,
          password_hash,
          role: 'admin',
          is_active: true,
          must_reset_password: false
        }
      ])
      .select();

    if (insertErr) {
      console.error('Error inserting admin user:', insertErr);
    } else {
      console.log('Successfully created admin user!');
      console.log('Created user record:', inserted);
    }
  }
}

seedOrResetAdmin().catch(console.error);
