import { Request, Response } from 'express';
import { db } from '../db';
import { siteSettings } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { ok, handleError } from '../lib/response';
import { ValidationError } from '../lib/errors';
import { ALLOWED_SETTING_KEYS } from '../lib/schemas/index';

// Default settings — returned for any key not yet persisted in DB
const DEFAULT_SETTINGS: Record<string, string> = {
    heroTitle:            'NOT ME, BUT YOU',
    heroSubtitle:         'National Service Scheme - JSPM RSCOE',
    heroCta:              'Join Us / Register',
    statEventsCount:      '50+',
    statEventsLabel:      'Events Conducted',
    statVolunteersCount:  '200+',
    statVolunteersLabel:  'Volunteers',
    statImpactCount:      '1000+',
    statImpactLabel:      'Lives Impacted',
    aboutMission:         '',
    aboutHistory:         '',
};

export const getSettings = async (_req: Request, res: Response) => {
    try {
        const rows = await db.select().from(siteSettings);

        // Merge DB values over defaults
        const result: Record<string, string> = { ...DEFAULT_SETTINGS };
        rows.forEach(r => { result[r.key] = r.value; });

        ok(res, result);
    } catch (error) {
        handleError(res, error);
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const updates = req.body as Record<string, string>;
        const entries = Object.entries(updates);

        if (entries.length === 0) {
            throw new ValidationError('No settings provided.');
        }

        // Reject unknown keys
        const unknownKeys = entries.map(([k]) => k).filter(k => !ALLOWED_SETTING_KEYS.has(k));
        if (unknownKeys.length > 0) {
            throw new ValidationError(`Unknown setting key(s): ${unknownKeys.join(', ')}`);
        }

        // Validate value types
        for (const [, value] of entries) {
            if (typeof value !== 'string') {
                throw new ValidationError('All setting values must be strings.');
            }
            if (value.length > 50000) {
                throw new ValidationError('Setting value exceeds maximum length of 50000 characters.');
            }
        }

        const keys = entries.map(([k]) => k);

        // Load existing rows in one query (eliminates N+1)
        const existing = await db
            .select({ key: siteSettings.key })
            .from(siteSettings)
            .where(inArray(siteSettings.key, keys));
        const existingKeys = new Set(existing.map(r => r.key));

        // Batch updates and inserts transactionally
        await db.transaction(async (tx) => {
            for (const [key, value] of entries) {
                if (existingKeys.has(key)) {
                    await tx.update(siteSettings)
                        .set({ value, updatedAt: new Date() })
                        .where(eq(siteSettings.key, key));
                } else {
                    await tx.insert(siteSettings).values({ key, value });
                }
            }
        });

        ok(res, null, 'Settings updated successfully.');
    } catch (error) {
        handleError(res, error);
    }
};
