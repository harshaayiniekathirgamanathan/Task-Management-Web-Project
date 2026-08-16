process.env.DATABASE_SSL = 'disable';
require('dotenv').config();
const db = require('../utils/db');

async function updateNames() {
  try {
    // 1. Update Admin name to Harshaa
    await db.query(
      "UPDATE users SET name = 'Harshaa' WHERE role = 'admin' OR email IN ('admin@example.com', 'admin@gmail.com')"
    );

    // 2. Update Alex Johnson to Nuha
    await db.query(
      "UPDATE users SET name = 'Nuha' WHERE email = 'alex.tech@gmail.com' OR name = 'Alex Johnson'"
    );

    // 3. Update Sarah Smith to Shaheen
    await db.query(
      "UPDATE users SET name = 'Shaheen' WHERE email = 'sarah.pm@gmail.com' OR name = 'Sarah Smith'"
    );

    // 4. Update Michael Brown to Karthi
    await db.query(
      "UPDATE users SET name = 'Karthi' WHERE email = 'michael.dev@gmail.com' OR name = 'Michael Brown'"
    );

    const users = await db.many("SELECT id, name, email, role FROM users ORDER BY role, name");
    console.log('Updated Users in Database:', users);
  } catch (err) {
    console.error('Error updating names:', err.message);
  } finally {
    process.exit();
  }
}

updateNames();
