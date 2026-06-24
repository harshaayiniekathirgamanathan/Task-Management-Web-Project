const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../routes/authRoutes');
const supabase = require('../utils/supabase');
const bcrypt = require('bcryptjs');
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Mock the Supabase client
jest.mock('../utils/supabase', () => {
    return {
        from: jest.fn()
    };
});

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('Auth Endpoints', () => {
    let mockSingle = jest.fn();
    let mockEq = jest.fn(() => ({ single: mockSingle }));
    let mockSelect = jest.fn(() => ({ eq: mockEq }));

    beforeEach(() => {
        jest.clearAllMocks();
        supabase.from.mockImplementation((table) => {
            if (table === 'users' || table === 'refresh_tokens') {
                return {
                    select: mockSelect,
                    insert: jest.fn().mockResolvedValue({ error: null }),
                    delete: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis()
                };
            }
        });
    });

    it('POST /login should login user with correct credentials', async () => {
        const mockUser = {
            id: 'user-uuid',
            name: 'Test Admin',
            email: 'admin@example.com',
            password_hash: await bcrypt.hash('Password123', 10),
            role: 'admin',
            is_active: true,
            must_reset_password: false
        };

        mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@example.com', password: 'Password123' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.user.email).toBe('admin@example.com');
        expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('POST /login should return 401 for invalid password', async () => {
        const mockUser = {
            id: 'user-uuid',
            name: 'Test Admin',
            email: 'admin@example.com',
            password_hash: await bcrypt.hash('Password123', 10),
            role: 'admin',
            is_active: true,
            must_reset_password: false
        };

        mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@example.com', password: 'WrongPassword' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid credentials');
    });

    it('POST /login should return 400 for invalid email format', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'invalid-email', password: 'Password123' });

        expect(res.status).toBe(400);
    });
});
