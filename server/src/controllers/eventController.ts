import { Request, Response } from 'express';
import { db } from '../db';
import { events } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const getEvents = async (req: Request, res: Response) => {
    try {
        const allEvents = await db.select().from(events).orderBy(desc(events.date));
        res.json(allEvents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error });
    }
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        // Basic validation could go here or use Zod
        const newEvent = await db.insert(events).values({
            ...req.body,
            date: new Date(req.body.date) // Ensure date is Date object
        }).returning();
        res.json(newEvent[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error creating event', error });
    }
};

export const updateEvent = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const updateData = { ...req.body };
        if (updateData.date) {
            updateData.date = new Date(updateData.date);
        }
        const updated = await db.update(events).set(updateData).where(eq(events.id, Number(id))).returning();
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating event', error });
    }
}

export const deleteEvent = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await db.delete(events).where(eq(events.id, Number(id)));
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting event', error });
    }
}
