import { Request, Response, NextFunction } from 'express';

/**
 * Adds HTTP caching headers to public (unauthenticated) GET responses.
 *
 * How it works:
 *  - max-age=60            → CDN and browser serve from cache for 1 minute without
 *                            hitting the origin at all.
 *  - stale-while-revalidate=300 → After 1 minute, serve stale data instantly AND
 *                            refresh in the background. Users never see a slow
 *                            "cache miss" response — the CDN handles revalidation
 *                            invisibly.
 *
 * At 100K concurrent public visitors this means the origin server receives
 * ~1 request per minute per unique URL instead of 100K.
 *
 * Only applies to GET/HEAD requests. POST, PUT, PATCH, DELETE always bypass
 * the CDN cache and hit the origin directly.
 */
export const cachePublicData = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    next();
};

/**
 * Marks uploaded files as immutable so browsers and CDNs cache them forever.
 *
 * Uploaded filenames include a timestamp (e.g. file-1788166437885-334332889.jpeg)
 * so the filename changes whenever the content changes. A browser that has
 * cached the old filename will automatically fetch the new one. This means
 * it is safe to cache these responses permanently.
 *
 * Without this, browsers re-request every image on every page load (an extra
 * round-trip per image per user per visit).
 */
export const cacheImmutableFile = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
    next();
};
