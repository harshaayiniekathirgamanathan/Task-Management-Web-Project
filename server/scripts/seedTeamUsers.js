process.env.DATABASE_SSL = 'disable';
require('dotenv').config();
const db = require('../utils/db');
const bcrypt = require('bcryptjs');

async function seedTeamUsers() {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const users = [
      { name: 'Alex Johnson', email: 'alex.tech@gmail.com', role: 'collaborator' },
      { name: 'Sarah Smith', email: 'sarah.pm@gmail.com', role: 'project_manager' },
      { name: 'Michael Brown', email: 'michael.dev@gmail.com', role: 'collaborator' },
    ];

    for (const u of users) {
      await db.query(
        `INSERT INTO users (name, email, role, password_hash, is_active, must_reset_password)
         VALUES ($1, $2, $3, $4, true, false)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role`,
        [u.name, u.email, u.role, passwordHash]
      );
    }

    console.log('Successfully seeded team members into PostgreSQL');
  } catch (err) {
    console.error('Error seeding team users:', err.message);
  } finally {
    process.exit();
  }
}

seedTeamUsers();
