import { Request, Response } from 'express';
import { db } from '../db';
import { eq, desc, sql } from 'drizzle-orm';
import { events, academicYears } from '../db/schema';
import { ok, created } from '../lib/response';

export const getEvents = async (req: Request, res: Response) => {
    try {
        const allEvents = await db.select({
            id: events.id,
            title: events.title,
            description: events.description,
            date: events.date,
            location: events.location,
            type: sql<string>`CASE WHEN DATE(events.date) > CURRENT_DATE THEN 'upcoming' WHEN DATE(events.date) = CURRENT_DATE THEN 'today' ELSE 'past' END`.as('type'),
            reportUrl: events.reportUrl,
            academicYearId: events.academicYearId,
            createdAt: events.createdAt,
            imageUrl: sql<string>`COALESCE(NULLIF(events.image_url, ''), (SELECT url FROM event_images WHERE event_id = events.id AND is_master = true LIMIT 1), (SELECT url FROM event_images WHERE event_id = events.id LIMIT 1))`,
            volunteersCount: sql<number>`(SELECT COUNT(ar.id)::int FROM attendance_records ar JOIN attendance_sessions s ON ar.session_id = s.id WHERE s.event_id = events.id AND ar.status = 'present')`
        }).from(events).orderBy(desc(events.date));

        ok(res, allEvents);
    } catch (error) {
        console.error("Error in getEvents:", error);
        res.status(500).json({ message: 'Error fetching events', error });
    }
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        const [currentAY] = await db
            .select({ id: academicYears.id, isLocked: academicYears.isLocked })
            .from(academicYears)
            .where(eq(academicYears.isCurrent, true))
            .limit(1);

        if (currentAY?.isLocked) {
            return res.status(403).json({ success: false, message: 'Current academic year is locked.' });
        }

        const { title, description, location, reportUrl, date } = req.body;
        const newEvent = await db.insert(events).values({
            title,
            description,
            location,
            reportUrl,
            academicYearId: currentAY?.id || null,
            date: new Date(req.body.date) // Ensure date is Date object
        }).returning();
        created(res, newEvent[0]);
    } catch (error) {
        console.error("Error in createEvent:", error);
        res.status(500).json({ message: 'Error creating event', error });
    }
};

export const updateEvent = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { title, description, location, reportUrl, date } = req.body;
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (location !== undefined) updateData.location = location;
        if (reportUrl !== undefined) updateData.reportUrl = reportUrl;
        if (date !== undefined) updateData.date = new Date(date);

        const [eventToUpdate] = await db.select({ academicYearId: events.academicYearId }).from(events).where(eq(events.id, Number(id))).limit(1);
        if (!eventToUpdate) return res.status(404).json({ message: 'Event not found' });
        
        if (eventToUpdate.academicYearId) {
            const [ay] = await db.select({ isLocked: academicYears.isLocked }).from(academicYears).where(eq(academicYears.id, eventToUpdate.academicYearId)).limit(1);
            if (ay?.isLocked) return res.status(403).json({ message: 'Cannot update event in a locked academic year' });
        }

        const updated = await db.update(events).set(updateData).where(eq(events.id, Number(id))).returning();
        ok(res, updated[0]);
    } catch (error) {
        console.error("Error in updateEvent:", error);
        res.status(500).json({ message: 'Error updating event', error });
    }
}

export const deleteEvent = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [eventToDelete] = await db.select({ academicYearId: events.academicYearId }).from(events).where(eq(events.id, Number(id))).limit(1);
        if (!eventToDelete) return res.status(404).json({ message: 'Event not found' });

        if (eventToDelete.academicYearId) {
            const [ay] = await db.select({ isLocked: academicYears.isLocked }).from(academicYears).where(eq(academicYears.id, eventToDelete.academicYearId)).limit(1);
            if (ay?.isLocked) return res.status(403).json({ message: 'Cannot delete event in a locked academic year' });
        }

        await db.delete(events).where(eq(events.id, Number(id)));
        ok(res, { message: 'Event deleted' });
    } catch (error) {
        console.error("Error in deleteEvent:", error);
        res.status(500).json({ message: 'Error deleting event', error });
    }
}
