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
            // Volunteer login now does: .select().from().innerJoin().where()
            const mockWhere = vi.fn().mockResolvedValue([]);
            const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
            const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere });
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
            // Login checks admin first (.top(1).from().where()), then volunteer
            // with a join (.from().innerJoin().where()). Wire both paths.
            const mockAdminWhere = vi.fn().mockResolvedValue([]);           // admin not found
            const mockAdminFrom = vi.fn().mockReturnValue({ where: mockAdminWhere });
            const mockAdminTop = vi.fn().mockReturnValue({ from: mockAdminFrom });

            const mockVolWhere = vi.fn().mockResolvedValue([{             // volunteer found
                volunteer: mockUser,
                ay: { isLocked: false, isArchived: false },
            }]);
            const mockVolInnerJoin = vi.fn().mockReturnValue({ where: mockVolWhere });
            const mockVolFrom = vi.fn().mockReturnValue({ innerJoin: mockVolInnerJoin, where: mockVolWhere });

            // select() is called twice; first call → admin path, second → volunteer path
            (db.select as any) = vi.fn()
                .mockReturnValueOnce({ top: mockAdminTop, from: mockAdminFrom })
                .mockReturnValueOnce({ from: mockVolFrom });

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
