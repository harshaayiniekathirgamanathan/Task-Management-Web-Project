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
});
