const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-user-route-secret';

jest.mock('../services/userService', () => ({
    listUsers: jest.fn(),
    listAssignableUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deactivateUser: jest.fn(),
    activateUser: jest.fn(),
}));

const userService = require('../services/userService');
const userRoutes = require('../routes/userRoutes');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('Users API validation', () => {
    const adminToken = jwt.sign(
        { id: 'admin-id', role: 'admin' },
        process.env.JWT_SECRET
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects non-Gmail addresses when creating users', async () => {
        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'External User',
                email: 'person@example.com',
                role: 'collaborator',
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email must be a valid @gmail.com address');
        expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('normalizes accepted Gmail addresses before creating users', async () => {
        userService.createUser.mockResolvedValue({
            id: 'user-id',
            name: 'Gmail User',
            email: 'person@gmail.com',
            role: 'collaborator',
        });

        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Gmail User',
                email: ' Person@Gmail.com ',
                role: 'collaborator',
            });

        expect(res.status).toBe(201);
        expect(userService.createUser).toHaveBeenCalledWith({
            name: 'Gmail User',
            email: 'person@gmail.com',
            role: 'collaborator',
        });
    });

    it('allows an admin to re-activate a user', async () => {
        userService.activateUser.mockResolvedValue({
            id: 'inactive-user-id',
            is_active: true,
        });

        const res = await request(app)
            .patch('/api/users/inactive-user-id/activate')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(userService.activateUser).toHaveBeenCalledWith('inactive-user-id');
        expect(res.body.is_active).toBe(true);
    });

    it('does not allow a non-admin to re-activate a user', async () => {
        const collaboratorToken = jwt.sign(
            { id: 'collaborator-id', role: 'collaborator' },
            process.env.JWT_SECRET
        );

        const res = await request(app)
            .patch('/api/users/inactive-user-id/activate')
            .set('Authorization', `Bearer ${collaboratorToken}`);

        expect(res.status).toBe(403);
        expect(userService.activateUser).not.toHaveBeenCalled();
    });
});
