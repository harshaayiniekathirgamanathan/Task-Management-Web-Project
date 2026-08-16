const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const passwordsToTry = ['postgres', 'admin', 'root', '123456', 'password', ''];
const dbNames = ['task_management', 'postgres'];

async function main() {
  const adminEmail = 'admin@example.com';
  const newPassword = 'Password123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  for (const dbName of dbNames) {
    for (const pass of passwordsToTry) {
      const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: pass,
        database: dbName,
      });

      try {
        await client.connect();
        console.log(`Connected to Postgres database '${dbName}' with user 'postgres' and password '${pass}'`);

        // Check if users table exists
        const tableRes = await client.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');"
        );
        
        if (tableRes.rows[0].exists) {
          console.log("Table 'users' exists!");
          
          // Check if admin user exists
          const userRes = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
          if (userRes.rows.length > 0) {
            console.log(`User '${adminEmail}' found in DB. Updating password to '${newPassword}'...`);
            await client.query(
              "UPDATE users SET password_hash = $1, is_active = true, must_reset_password = false WHERE email = $2",
              [passwordHash, adminEmail]
            );
            console.log("Password successfully updated in local PostgreSQL!");
          } else {
            console.log(`User '${adminEmail}' not found. Creating user with password '${newPassword}'...`);
            await client.query(
              `INSERT INTO users (name, email, password_hash, role, is_active, must_reset_password)
               VALUES ($1, $2, $3, 'admin', true, false)`,
              ['Admin User', adminEmail, passwordHash]
            );
            console.log("User successfully created in local PostgreSQL!");
          }
        } else {
          console.log(`Table 'users' does not exist in database '${dbName}'.`);
        }

        await client.end();
        return;
      } catch (err) {
        // failed connection or query, try next
      }
    }
  }
  console.log("Could not connect to local PostgreSQL with common credentials.");
}

main();
