import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// ── Redis client (optional) ──────────────────────────────────────────────────
// When REDIS_URL is set (production), rate limit counters are stored in Redis so
// they are shared across all server instances and survive server restarts.
// Without REDIS_URL (local dev), falls back to the default in-memory store.

let redisClient: Redis | null = null;

if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, {
        // Retry strategy: give up after 3 retries to avoid blocking startup
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
    });
    redisClient.connect().catch((err) => {
        console.error('[rate-limit] Redis connection failed, falling back to in-memory store:', err.message);
        redisClient = null;
    });
    console.log('[rate-limit] Redis store enabled');
} else {
    console.log('[rate-limit] No REDIS_URL set — using in-memory store (single-instance only)');
}

const makeStore = (): RedisStore | undefined => {
    if (!redisClient) return undefined; // undefined = use default MemoryStore
    return new RedisStore({
        // ioredis .call() requires a rest-parameter tuple, not a plain string[]
        sendCommand: (...args: string[]) => redisClient!.call(...args as [string, ...string[]]) as any,
    });
};

// Strict rate limiter for login — prevents brute force attacks
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                   // 20 attempts per IP per window
    store: makeStore(),
    skipSuccessfulRequests: true, // Only count failed attempts
    message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3000,                 // 3000 requests per IP per window
    store: makeStore(),
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
