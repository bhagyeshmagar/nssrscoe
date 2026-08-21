import { vi } from 'vitest';

process.env.JWT_SECRET = 'test_secret_must_be_at_least_32_chars_long';

// We mock the database to prevent integration tests from hitting real Postgres
vi.mock('../db/index.ts', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        top: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(), // keeping for compatibility if any left
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        output: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(), // keeping for compatibility
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
    }
}));
