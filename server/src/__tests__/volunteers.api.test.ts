import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../index';
import { db } from '../db/index';
import * as volService from '../services/volunteerService';

vi.mock('../db/index');
vi.mock('../middleware/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../middleware/auth')>();
    return {
        ...actual,
        authenticateToken: (req: any, res: any, next: any) => {
            req.user = { id: 1, role: 'volunteer' };
            next();
        },
        requireAdmin: (req: any, res: any, next: any) => next(),
        requireSuperAdmin: (req: any, res: any, next: any) => next(),
    };
});

describe('Volunteers API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/volunteers/public', () => {
        it('should return public volunteers', async () => {
            const mockVolunteers = [
                { id: 1, name: 'John Doe', department: 'CS', profile: { profilePhotoUrl: 'test.jpg' } }
            ];

            // Mock the first DB query for getting the user's AY
            const mockLimit = vi.fn().mockResolvedValue([{ academicYearId: 1 }]);
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any) = mockSelect;

            // Mock the volService using spyOn
            vi.spyOn(volService, 'listVolunteersForAY').mockResolvedValue({ data: mockVolunteers } as any);

            const res = await request(app)
                .get('/api/volunteers/public')
                .set('Authorization', 'Bearer fake-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].name).toBe('John Doe');
        });
    });
});
