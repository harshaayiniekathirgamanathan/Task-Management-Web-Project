// Integration tests for the Tasks API (Jest + supertest).
// These run against a real PostgreSQL database (via DATABASE_URL): they seed two
// test users (a manager and a collaborator), log in through the real
// /api/auth/login endpoint to get tokens, then exercise the task rules.
// Everything created is removed again in afterAll.
//
// Because they need a live database, they run wherever DATABASE_URL points at a
// reachable Postgres. They are SKIPPED in CI by default; the CI workflow spins
// up a Postgres service and opts in with RUN_DB_TESTS=true.
require('dotenv').config();

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const db = require('../utils/db');
const authRoutes = require('../routes/authRoutes');
const taskRoutes = require('../routes/taskRoutes');
const errorHandler = require('../middleware/errorHandler');

// Build a small app with just the pieces these tests need (same wiring as index.js)
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use(errorHandler);

// Helper: log in through the real endpoint and return the access token.
async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`login failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken; // <-- this token is sent as "Authorization: Bearer <token>"
}

// Skip this live-DB suite in CI unless explicitly opted in (CI provides a
// Postgres service container and sets RUN_DB_TESTS=true).
const dbTestsEnabled = process.env.RUN_DB_TESTS === 'true' || !process.env.CI;
const describeDb = dbTestsEnabled ? describe : describe.skip;

describeDb('Tasks API', () => {
  const PASSWORD = 'Password123';
  const stamp = Date.now();

  let manager;        // seeded project_manager user row
  let collaborator;   // seeded collaborator user row
  let projectId;
  let assignedTaskId; // collaborator IS assigned to this one
  let otherTaskId;    // collaborator is NOT assigned to this one
  let managerToken;
  let collabToken;

  beforeAll(async () => {
    const password_hash = await bcrypt.hash(PASSWORD, 10);

    // 1. seed a manager and a collaborator
    manager = await db.one(
      `INSERT INTO users (name, email, password_hash, role, is_active, must_reset_password)
       VALUES ('Test Manager', $1, $2, 'project_manager', true, false)
       RETURNING id, email`,
      [`test-pm-${stamp}@test.local`, password_hash]
    );

    collaborator = await db.one(
      `INSERT INTO users (name, email, password_hash, role, is_active, must_reset_password)
       VALUES ('Test Collaborator', $1, $2, 'collaborator', true, false)
       RETURNING id, email`,
      [`test-collab-${stamp}@test.local`, password_hash]
    );

    // 2. a project + two tasks; collaborator is assigned to ONE of them
    const p = await db.one(
      `INSERT INTO projects (title, created_by) VALUES ($1, $2) RETURNING id`,
      [`Test project ${stamp}`, manager.id]
    );
    projectId = p.id;

    const t1 = await db.one(
      `INSERT INTO tasks (project_id, created_by, title, priority, status)
       VALUES ($1, $2, 'Assigned task', 'medium', 'todo') RETURNING id`,
      [projectId, manager.id]
    );
    assignedTaskId = t1.id;
    await db.query(
      'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)',
      [assignedTaskId, collaborator.id]
    );

    const t2 = await db.one(
      `INSERT INTO tasks (project_id, created_by, title, priority, status)
       VALUES ($1, $2, 'Other task', 'medium', 'todo') RETURNING id`,
      [projectId, manager.id]
    );
    otherTaskId = t2.id;

    // 3. log in as both test users to get real tokens
    managerToken = await login(manager.email, PASSWORD);
    collabToken = await login(collaborator.email, PASSWORD);
  });

  afterAll(async () => {
    // deleting the project cascades its tasks + assignments
    if (projectId) await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
    if (manager) await db.query('DELETE FROM users WHERE id = $1', [manager.id]);
    if (collaborator) await db.query('DELETE FROM users WHERE id = $1', [collaborator.id]);
    await db.end();
  });

  it('logs in the seeded test users and returns access tokens', () => {
    expect(typeof managerToken).toBe('string');
    expect(typeof collabToken).toBe('string');
  });

  it('creating a task requires a manager: collaborator -> 403', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${collabToken}`)
      .send({ project_id: projectId, title: 'Should be blocked' });

    expect(res.status).toBe(403);
  });

  it('manager can create a task -> 201 with status todo', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        project_id: projectId,
        title: 'Created in test',
        priority: 'high',
        assignee_ids: [collaborator.id],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('todo');
  });

  it('creating a task with no assignees is rejected -> 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ project_id: projectId, title: 'No assignees' });

    expect(res.status).toBe(400);
  });

  it('a task with a past due_date is rejected -> 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        project_id: projectId,
        title: 'Late task',
        due_date: '2020-01-01',
        assignee_ids: [collaborator.id],
      });

    expect(res.status).toBe(400);
  });

  it('collaborator CAN patch status on a task they are assigned to -> 200', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${assignedTaskId}/status`)
      .set('Authorization', `Bearer ${collabToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  it('collaborator CANNOT patch status on a task they are NOT assigned to -> 403', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${otherTaskId}/status`)
      .set('Authorization', `Bearer ${collabToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(403);
  });
});