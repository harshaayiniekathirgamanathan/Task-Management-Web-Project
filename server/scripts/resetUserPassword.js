const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function resetPassword(email, newPassword) {
  const pgConfig = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'task_management'
  };

  const client = new Client(pgConfig);

  try {
    await client.connect();
    console.log(`Connected to database 'task_management'`);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);

    if (res.rows.length === 0) {
      console.log(`User '${email}' not found. Creating user...`);
      await client.query(
        `INSERT INTO users (name, email, password_hash, role, is_active, must_reset_password)
         VALUES ($1, $2, $3, 'admin', true, false)`,
        [email.split('@')[0], email, passwordHash]
      );
      console.log(`User '${email}' created with password: '${newPassword}'`);
    } else {
      await client.query(
        'UPDATE users SET password_hash = $1, is_active = true, must_reset_password = false WHERE email = $2',
        [passwordHash, email]
      );
      console.log(`Password for '${email}' successfully updated to: '${newPassword}'`);
    }
  } catch (err) {
    console.error('Error resetting password in PostgreSQL:', err.message);
  } finally {
    await client.end();
  }
}

const targetEmail = process.argv[2] || 'admin@example.com';
const targetPassword = process.argv[3] || 'Password123';

resetPassword(targetEmail, targetPassword);
