const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function setup() {
  const pgConfig = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
  };

  console.log("Connecting to PostgreSQL server...");
  const adminClient = new Client({ ...pgConfig, database: 'postgres' });
  await adminClient.connect();

  // Check if task_management database exists
  const dbRes = await adminClient.query(
    "SELECT 1 FROM pg_database WHERE datname = 'task_management';"
  );

  if (dbRes.rows.length === 0) {
    console.log("Creating database 'task_management'...");
    await adminClient.query("CREATE DATABASE task_management;");
  } else {
    console.log("Database 'task_management' already exists.");
  }
  await adminClient.end();

  // Connect to task_management database
  console.log("Connecting to 'task_management' database...");
  const dbClient = new Client({ ...pgConfig, database: 'task_management' });
  await dbClient.connect();

  // Check if users table exists
  const tableCheck = await dbClient.query(
    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');"
  );

  if (!tableCheck.rows[0].exists) {
    console.log("Applying schema from db/schema.sql...");
    const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    await dbClient.query(schemaSql);
    console.log("Schema applied successfully.");
  } else {
    console.log("Tables already present in database.");
  }

  // Create or update admin user
  const adminEmail = 'admin@example.com';
  const rawPassword = 'Password123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);

  const userRes = await dbClient.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
  if (userRes.rows.length > 0) {
    await dbClient.query(
      "UPDATE users SET password_hash = $1, is_active = true, must_reset_password = false WHERE email = $2",
      [passwordHash, adminEmail]
    );
    console.log(`Updated admin user '${adminEmail}' password to '${rawPassword}'.`);
  } else {
    await dbClient.query(
      `INSERT INTO users (name, email, password_hash, role, is_active, must_reset_password)
       VALUES ($1, $2, $3, 'admin', true, false)`,
      ['System Admin', adminEmail, passwordHash]
    );
    console.log(`Created admin user '${adminEmail}' with password '${rawPassword}'.`);
  }

  await dbClient.end();
  console.log("Local Database Setup & Admin Seeding Complete!");
}

setup().catch(console.error);
