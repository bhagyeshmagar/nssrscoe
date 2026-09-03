import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../index';
import { db } from '../db/index';
import bcrypt from 'bcryptjs';
import * as schema from '../db/schema';

// We import the mock instance
vi.mock('../db/index');

describe('Auth API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 if validation fails', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'not-an-email' });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('required');
        });

        it('should return 401 for non-existent user', async () => {
            // Mock db.select().top(1).from().where().fetch() to return empty array
            const mockWhere = vi.fn().mockResolvedValue([]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockTop = vi.fn().mockReturnValue({ from: mockFrom });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom, top: mockTop });
            (db.select as any) = mockSelect;

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid credentials.');
        });

        it('should login successfully for valid user', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                passwordHash: hashedPassword,
                role: 'volunteer',
                isActive: true
            };

            const mockWhere = vi.fn()
                .mockResolvedValueOnce([]) // Admin check
                .mockResolvedValueOnce([mockUser]); // Volunteer check
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockTop = vi.fn().mockReturnValue({ from: mockFrom });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom, top: mockTop });
            (db.select as any) = mockSelect;

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.role).toBe('volunteer');
        });
    });
});
