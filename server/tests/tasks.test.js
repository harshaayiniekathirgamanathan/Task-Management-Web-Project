// Integration tests for the Tasks API (Jest + supertest).
// These run against the real Supabase database: they seed two test users
// (a manager and a collaborator), log in through the real /api/auth/login
// endpoint to get tokens, then exercise the task rules. Everything created
// is removed again in afterAll.
require('dotenv').config();

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const supabase = require('../utils/supabase');
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

describe('Tasks API', () => {
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
    const { data: m, error: mErr } = await supabase
      .from('users')
      .insert({
        name: 'Test Manager',
        email: `test-pm-${stamp}@test.local`,
        password_hash,
        role: 'project_manager',
        is_active: true,
        must_reset_password: false,
      })
      .select('id, email')
      .single();
    if (mErr) throw mErr;
    manager = m;

    const { data: c, error: cErr } = await supabase
      .from('users')
      .insert({
        name: 'Test Collaborator',
        email: `test-collab-${stamp}@test.local`,
        password_hash,
        role: 'collaborator',
        is_active: true,
        must_reset_password: false,
      })
      .select('id, email')
      .single();
    if (cErr) throw cErr;
    collaborator = c;

    // 2. a project + two tasks; collaborator is assigned to ONE of them
    const { data: p } = await supabase
      .from('projects')
      .insert({ title: `Test project ${stamp}`, created_by: manager.id })
      .select('id')
      .single();
    projectId = p.id;

    const { data: t1 } = await supabase
      .from('tasks')
      .insert({ project_id: projectId, created_by: manager.id, title: 'Assigned task', priority: 'medium', status: 'todo' })
      .select('id')
      .single();
    assignedTaskId = t1.id;
    await supabase.from('task_assignments').insert({ task_id: assignedTaskId, user_id: collaborator.id });

    const { data: t2 } = await supabase
      .from('tasks')
      .insert({ project_id: projectId, created_by: manager.id, title: 'Other task', priority: 'medium', status: 'todo' })
      .select('id')
      .single();
    otherTaskId = t2.id;

    // 3. log in as both test users to get real tokens
    managerToken = await login(manager.email, PASSWORD);
    collabToken = await login(collaborator.email, PASSWORD);
  });

  afterAll(async () => {
    // deleting the project cascades its tasks + assignments
    if (projectId) await supabase.from('projects').delete().eq('id', projectId);
    if (manager) await supabase.from('users').delete().eq('id', manager.id);
    if (collaborator) await supabase.from('users').delete().eq('id', collaborator.id);
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