import { Request, Response } from 'express';
import { db } from '../db';
import { eq, desc, sql } from 'drizzle-orm';
import { events, academicYears } from '../db/schema';
import { ok, created, handleError } from '../lib/response';
import { NotFoundError, ForbiddenError, ValidationError } from '../lib/errors';
import { positiveIntParam } from '../lib/schemas';

// ── Helpers ───────────────────────────────────────────────────────────────────

const requireEventNotLocked = async (eventId: number) => {
    const [result] = await db
        .select({
            academicYearId: events.academicYearId,
            isLocked: academicYears.isLocked,
        })
        .from(events)
        .leftJoin(academicYears, eq(events.academicYearId, academicYears.id))
        .where(eq(events.id, eventId));

    if (!result) throw new NotFoundError('Event not found.');
    if (result.isLocked) throw new ForbiddenError('Cannot modify an event in a locked academic year.', 'AY_LOCKED');
    return result;
};

// ── Controllers ───────────────────────────────────────────────────────────────

export const getEvents = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        let query = db.select({
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
            approvalStatus: events.approvalStatus,
        }).from(events);

        if (!user || user.role === 'volunteer') {
            query = query.where(eq(events.approvalStatus, 'approved')) as typeof query;
        }

        const allEvents = await query.orderBy(desc(events.date));

        ok(res, allEvents);
    } catch (error) {
        handleError(res, error);
    }
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        const { title, description, location, reportUrl, driveLink, date } = req.body;

        if (!title || !location || !date) {
            throw new ValidationError('title, location, and date are required.');
        }

        const [currentAY] = await db
            .select({ id: academicYears.id, isLocked: academicYears.isLocked })
            .top(1).from(academicYears)
            .where(eq(academicYears.isCurrent, true));

        if (currentAY?.isLocked) {
            throw new ForbiddenError('Current academic year is locked.', 'AY_LOCKED');
        }

        const user = (req as any).user;
        const approvalStatus = user?.isSuperadmin ? 'approved' : 'pending';
        const approvedById = user?.isSuperadmin ? user.id : null;
        const approvedAt = user?.isSuperadmin ? new Date() : null;

        const [newEvent] = await db.insert(events).output().values({
            title: String(title).trim(),
            description: String(description).trim(),
            location: String(location).trim(),
            reportUrl: reportUrl ?? null,
            driveLink: driveLink ?? null,
            academicYearId: currentAY?.id ?? null,
            date: new Date(date),
            approvalStatus,
            approvedById,
            approvedAt,
        });

        created(res, newEvent);
    } catch (error) {
        handleError(res, error);
    }
};

export const updateEvent = async (req: Request, res: Response) => {
    try {
        const id = positiveIntParam.parse(req.params.id);
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
        const id = positiveIntParam.parse(req.params.id);
        await requireEventNotLocked(id);
        await db.delete(events).where(eq(events.id, id));
        ok(res, null, 'Event deleted.');
    } catch (error) {
        handleError(res, error);
    }
};
