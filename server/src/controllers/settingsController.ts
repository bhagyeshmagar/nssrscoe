import { Request, Response } from 'express';
import { db } from '../db';
import { siteSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ok } from '../lib/response';

// Default settings structure
const defaultSettings = {
    heroTitle: 'NOT ME, BUT YOU',
    heroSubtitle: 'National Service Scheme - JSPM RSCOE',
    heroCta: 'Join Us / Register',
    statEventsCount: '50+',
    statEventsLabel: 'Events Conducted',
    statVolunteersCount: '200+',
    statVolunteersLabel: 'Volunteers',
    statImpactCount: '1000+',
    statImpactLabel: 'Lives Impacted',
    aboutMission: '',
    aboutHistory: '',
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await db.select().from(siteSettings);

        // Convert array to object
        const settingsObj: Record<string, string> = { ...defaultSettings };
        settings.forEach(s => {
            settingsObj[s.key] = s.value;
        });

        ok(res, settingsObj);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings', error });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const updates = req.body as Record<string, string>;

        for (const [key, value] of Object.entries(updates)) {
            // Upsert each setting
            const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key));

            if (existing.length > 0) {
                await db.update(siteSettings)
                    .set({ value, updatedAt: new Date() })
                    .where(eq(siteSettings.key, key));
            } else {
                await db.insert(siteSettings).values({ key, value });
            }
        }

        ok(res, { message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error });
    }
};
