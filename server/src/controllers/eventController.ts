import { Request, Response } from 'express';
import { db } from '../db';
import { eq, desc, sql } from 'drizzle-orm';
import { events, academicYears } from '../db/schema';

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

        res.json(allEvents);
    } catch (error) {
        console.error("Error in getEvents:", error);
        res.status(500).json({ message: 'Error fetching events', error });
    }
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        const [currentAY] = await db
            .select({ id: academicYears.id })
            .from(academicYears)
            .where(eq(academicYears.isCurrent, true))
            .limit(1);

        const { title, description, location, reportUrl, date } = req.body;
        const newEvent = await db.insert(events).values({
            title,
            description,
            location,
            reportUrl,
            academicYearId: currentAY?.id || null,
            date: new Date(req.body.date) // Ensure date is Date object
        }).returning();
        res.json(newEvent[0]);
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

        const updated = await db.update(events).set(updateData).where(eq(events.id, Number(id))).returning();
        res.json(updated[0]);
    } catch (error) {
        console.error("Error in updateEvent:", error);
        res.status(500).json({ message: 'Error updating event', error });
    }
}

export const deleteEvent = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await db.delete(events).where(eq(events.id, Number(id)));
        res.json({ message: 'Event deleted' });
    } catch (error) {
        console.error("Error in deleteEvent:", error);
        res.status(500).json({ message: 'Error deleting event', error });
    }
}
