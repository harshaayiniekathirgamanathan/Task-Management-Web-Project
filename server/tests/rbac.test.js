const request = require('supertest');
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbac');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

app.get('/admin-only', authMiddleware, requireRole('admin'), (req, res) => {
    res.json({ ok: true });
});

describe('RBAC Middleware', () => {
    const adminPayload = { id: 'admin-id', role: 'admin' };
    const collaboratorPayload = { id: 'collab-id', role: 'collaborator' };

    let adminToken;
    let collabToken;

    beforeAll(() => {
        process.env.JWT_SECRET = 'test-secret';
        adminToken = jwt.sign(adminPayload, process.env.JWT_SECRET);
        collabToken = jwt.sign(collaboratorPayload, process.env.JWT_SECRET);
    });

    it('should allow access (200) for admin role', async () => {
        const res = await request(app)
            .get('/admin-only')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
    });

    it('should deny access (403) for collaborator role', async () => {
        const res = await request(app)
            .get('/admin-only')
            .set('Authorization', `Bearer ${collabToken}`);

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Forbidden');
    });
});
