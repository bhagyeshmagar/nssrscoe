import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../index';
import { db } from '../db/index';

vi.mock('../db/index');
vi.mock('../middleware/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../middleware/auth')>();
    return {
        ...actual,
        authenticateToken: (req: any, res: any, next: any) => {
            req.user = { id: 1, role: 'superadmin' };
            next();
        },
        requireSuperAdmin: (req: any, res: any, next: any) => next(),
    };
});

describe('Settings API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/settings', () => {
        it('should return site settings', async () => {
            const mockSettings = [
                { key: 'heroTitle', value: 'Test Title' },
                { key: 'statEventsCount', value: '100' }
            ];

            const mockFrom = vi.fn().mockResolvedValue(mockSettings);
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any) = mockSelect;

            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.heroTitle).toBe('Test Title');
            expect(res.body.data.statEventsCount).toBe('100');
            // Check default was merged
            expect(res.body.data.heroSubtitle).toBeDefined();
        });
    });

    describe('PUT /api/settings', () => {
        it('should update site settings as superadmin', async () => {
            const updates = { heroTitle: 'New Title' };
            
            // Mock existing check
            const mockWhereSelect = vi.fn().mockResolvedValue([{ key: 'heroTitle', value: 'Old Title' }]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhereSelect });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            
            // Mock update
            const mockWhereUpdate = vi.fn().mockResolvedValue([]);
            const mockSet = vi.fn().mockReturnValue({ where: mockWhereUpdate });
            const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
            
            (db.select as any) = mockSelect;
            (db.update as any) = mockUpdate;

            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', 'Bearer fake-token')
                .send(updates);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Settings updated successfully.');
        });
    });
});
