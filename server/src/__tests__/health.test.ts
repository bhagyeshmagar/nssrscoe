import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Server Health Check', () => {
    it('should return 200 OK from the root route', async () => {
        const response = await request(app).get('/');
        
        expect(response.status).toBe(200);
        expect(response.text).toContain('Express + TypeScript Server is running');
    });

    it('should return 404 for unknown routes', async () => {
        const response = await request(app).get('/random-unknown-route-12345');
        
        // Our error handler typically returns 404 for unknown routes or JSON error
        // Note: Without a catch-all route, express might just return HTML 404, so we test status.
        expect(response.status).toBe(404);
    });
});
