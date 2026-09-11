import { vi } from 'vitest';

process.env.JWT_SECRET = 'test_secret_must_be_at_least_32_chars_long';

// We mock the database to prevent integration tests from hitting real MSSQL.
// IMPORTANT: every method in a Drizzle query chain must be listed here.
// If you add a new join/modifier to production code and tests start failing
// with "X is not a function", add the method name below.
vi.mock('../db/index.ts', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        top: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(), // needed by authController & requireVolunteer
        leftJoin: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        output: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        fetch: vi.fn().mockReturnThis(),
    }
}));
