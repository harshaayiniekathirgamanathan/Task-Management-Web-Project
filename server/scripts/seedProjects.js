process.env.DATABASE_SSL = 'disable';
require('dotenv').config();
const db = require('../utils/db');

async function seedProjects() {
  try {
    const admin = await db.one("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const adminId = admin ? admin.id : null;

    const initialProjects = [
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

    for (const p of initialProjects) {
      await db.query(
        `INSERT INTO projects (id, title, description, created_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description`,
        [p.id, p.title, p.description, adminId]
      );
    }

    // Seed sample tasks into project 1 & 3
    const tasks = [
      {
        id: '44444444-4444-4444-a444-444444444444',
        project_id: '11111111-1111-4111-a111-111111111111',
        title: 'Design Interactive User Dashboard',
        description: 'Create card layouts, stats overview widgets, and responsive activity timelines for team members.',
        status: 'todo',
        priority: 'high',
      },
      {
        id: '55555555-5555-4555-a555-555555555555',
        project_id: '33333333-3333-4333-a333-333333333333',
        title: 'Implement Real-Time Task Notifications',
        description: 'Connect WebSocket events to alert team members instantly when a task status is changed or assigned.',
        status: 'in_progress',
        priority: 'medium',
      },
    ];

    for (const t of tasks) {
      await db.query(
        `INSERT INTO tasks (id, project_id, title, description, status, priority, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description`,
        [t.id, t.project_id, t.title, t.description, t.status, t.priority, adminId]
      );
    }

    console.log('Successfully seeded initial projects and tasks into PostgreSQL!');
  } catch (err) {
    console.error('Error seeding projects:', err.message);
  } finally {
    process.exit();
  }
}

seedProjects();
