process.env.DATABASE_SSL = 'disable';
require('dotenv').config();
const db = require('../utils/db');

async function seedProjects() {
  try {
    const adminUser = await db.one("SELECT id FROM users WHERE email = 'admin@example.com' OR email = 'admin@gmail.com' LIMIT 1");
    const creatorId = adminUser ? adminUser.id : null;

    const projects = [
      {
        id: '11111111-1111-4111-a111-111111111111',
        title: 'Website Redesign',
        description: 'Redesign the company website with modern typography, glassmorphism UI, and dark mode theme.',
      },
      {
        id: '22222222-2222-4222-a222-222222222222',
        title: 'Mobile App MVP',
        description: 'Build the first version of the iOS and Android application with real-time push notifications.',
      },
      {
        id: '33333333-3333-4333-a333-333333333333',
        title: 'API Gateway Integration',
        description: 'Connect frontend dashboard to microservice backend with JWT authentication and PostgreSQL.',
      },
    ];

    for (const p of projects) {
      await db.query(
        `INSERT INTO projects (id, title, description, created_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description`,
        [p.id, p.title, p.description, creatorId]
      );
    }
    console.log('Successfully seeded projects into PostgreSQL');
  } catch (err) {
    console.error('Error seeding projects:', err.message);
  } finally {
    process.exit();
  }
}

seedProjects();
