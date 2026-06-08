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
            req.user = { id: 1, role: 'admin' };
            next();
        },
        requireAdmin: (req: any, res: any, next: any) => next(),
        requireSuperAdmin: (req: any, res: any, next: any) => next(),
    };
});

describe('Events API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/events', () => {
        it('should return all events', async () => {
            const mockEvents = [
                { id: 1, title: 'Blood Donation Camp', date: '2025-01-01', description: 'A camp' }
            ];

            const mockOrderBy = vi.fn().mockResolvedValue(mockEvents);
            const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any) = mockSelect;

            const res = await request(app).get('/api/events');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].title).toBe('Blood Donation Camp');
        });
    });

    describe('POST /api/events', () => {
        it('should create an event as admin', async () => {
            const newEvent = { title: 'New Event', date: '2026-06-06', description: 'desc', location: 'Lab' };
            
            // Mock the Academic Year lookup
            const mockLimit = vi.fn().mockResolvedValue([{ id: 1, isLocked: false }]);
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any) = mockSelect;

            // Mock the insert
            const mockReturning = vi.fn().mockResolvedValue([{ id: 3, ...newEvent }]);
            const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
            (db.insert as any) = vi.fn().mockReturnValue({ values: mockValues });

            const res = await request(app)
                .post('/api/events')
                .set('Authorization', 'Bearer fake-admin-token')
                .send(newEvent);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('New Event');
        });
    });
});

