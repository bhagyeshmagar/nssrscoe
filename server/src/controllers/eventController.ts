import { Request, Response } from 'express';
import { db } from '../db';
import { eq, desc, sql } from 'drizzle-orm';
import { events, academicYears } from '../db/schema';
import { ok, created, handleError } from '../lib/response';
import { NotFoundError, ForbiddenError } from '../lib/errors';

// ── Helpers ───────────────────────────────────────────────────────────────────

const requireEventNotLocked = async (eventId: number) => {
    const [ev] = await db.select({ academicYearId: events.academicYearId }).top(1).from(events).where(eq(events.id, eventId));
    if (!ev) throw new NotFoundError('Event not found.');
    if (ev.academicYearId) {
        const [ay] = await db.select({ isLocked: academicYears.isLocked }).top(1).from(academicYears).where(eq(academicYears.id, ev.academicYearId));
        if (ay?.isLocked) throw new ForbiddenError('Cannot modify an event in a locked academic year.', 'AY_LOCKED');
    }
    return ev;
};

// ── Controllers ───────────────────────────────────────────────────────────────

export const getEvents = async (req: Request, res: Response) => {
    try {
        const allEvents = await db.select({
            id: events.id,
            title: events.title,
            description: events.description,
            date: events.date,
            location: events.location,
            type: sql<string>`CASE WHEN CAST(events.date AS DATE) > CAST(GETDATE() AS DATE) THEN 'upcoming' WHEN CAST(events.date AS DATE) = CAST(GETDATE() AS DATE) THEN 'today' ELSE 'past' END`.as('type'),
            reportUrl: events.reportUrl,
            driveLink: events.driveLink,
            academicYearId: events.academicYearId,
            createdAt: events.createdAt,
            imageUrl: sql<string>`COALESCE(NULLIF(events.image_url, ''), (SELECT TOP 1 url FROM event_images WHERE event_id = events.id AND is_master = 1), (SELECT TOP 1 url FROM event_images WHERE event_id = events.id))`,
            volunteersCount: sql<number>`(SELECT COUNT(ar.id) FROM attendance_records ar JOIN attendance_sessions s ON ar.session_id = s.id WHERE s.event_id = events.id AND ar.status = 'present')`,
        }).from(events).orderBy(desc(events.date));

        ok(res, allEvents);
    } catch (error) {
        handleError(res, error);
    }
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        const { title, description, location, reportUrl, driveLink, date } = req.body;

        if (!title || !description || !location || !date) {
            return res.status(400).json({ success: false, message: 'title, description, location, and date are required.' });
        }

        const [currentAY] = await db
            .select({ id: academicYears.id, isLocked: academicYears.isLocked })
            .top(1).from(academicYears)
            .where(eq(academicYears.isCurrent, true));

        if (currentAY?.isLocked) {
            throw new ForbiddenError('Current academic year is locked.', 'AY_LOCKED');
        }

        const [newEvent] = await db.insert(events).output().values({
            title: String(title).trim(),
            description: String(description).trim(),
            location: String(location).trim(),
            reportUrl: reportUrl ?? null,
            driveLink: driveLink ?? null,
            academicYearId: currentAY?.id ?? null,
            date: new Date(date),
        });

        created(res, newEvent);
    } catch (error) {
        handleError(res, error);
    }
};

export const updateEvent = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        await requireEventNotLocked(id);

        const { title, description, location, reportUrl, driveLink, date } = req.body;
        const updateData: Partial<typeof events.$inferInsert> = {};
        if (title !== undefined)       updateData.title = String(title).trim();
        if (description !== undefined) updateData.description = String(description).trim();
        if (location !== undefined)    updateData.location = String(location).trim();
        if (reportUrl !== undefined)   updateData.reportUrl = reportUrl;
        if (driveLink !== undefined)   updateData.driveLink = driveLink;
        if (date !== undefined)        updateData.date = new Date(date);

        const [updated] = await db.update(events).set(updateData).where(eq(events.id, id)).output();
        ok(res, updated);
    } catch (error) {
        handleError(res, error);
    }
};

export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        await requireEventNotLocked(id);
        await db.delete(events).where(eq(events.id, id));
        ok(res, null, 'Event deleted.');
    } catch (error) {
        handleError(res, error);
    }
};
