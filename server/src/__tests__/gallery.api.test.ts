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
    };
});

describe('Gallery API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/gallery', () => {
        it('should return all gallery items', async () => {
            const mockGallery = [
                { id: 1, title: 'Camp Photo', imageUrl: '/uploads/img1.jpg', description: 'Camp' }
            ];

            const mockOrderBy = vi.fn().mockResolvedValue(mockGallery);
            const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any) = mockSelect;

            const res = await request(app).get('/api/gallery');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].title).toBe('Camp Photo');
        });
    });

    describe('POST /api/gallery', () => {
        it('should create a gallery item as admin', async () => {
            const newItem = { title: 'New Photo', imageUrl: '/uploads/new.jpg', description: 'New' };
            
            const mockValues = vi.fn().mockResolvedValue([{ id: 2, ...newItem }]);
            const mockOutput = vi.fn().mockReturnValue({ values: mockValues });
            (db.insert as any) = vi.fn().mockReturnValue({ values: mockValues, output: mockOutput });

            const res = await request(app)
                .post('/api/gallery')
                .set('Authorization', 'Bearer fake-token')
                .send(newItem);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('New Photo');
        });
    });

    describe('DELETE /api/gallery/:id', () => {
        it('should delete a gallery item as admin', async () => {
            const mockWhere = vi.fn().mockResolvedValue([]);
            (db.delete as any) = vi.fn().mockReturnValue({ where: mockWhere });

            const res = await request(app)
                .delete('/api/gallery/1')
                .set('Authorization', 'Bearer fake-token');

            expect(res.status).toBe(204);
        });
    });
});
