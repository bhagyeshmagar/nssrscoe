import { Request, Response } from 'express';
import { db } from '../db';
import { eventRegistrations, events } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ok, created } from '../lib/response';

// Helper to generate a unique Visitor Pass ID
const generateVisitorId = () => {
    return `NSS-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
};

export const createRegistration = async (req: Request, res: Response) => {
    try {
        const { eventId, name, email, phone, department, year } = req.body;
        
        let uniqueId = generateVisitorId();
        
        // Ensure uniqueness (in a real app, you might want a retry loop here to guarantee uniqueness if collisions occur)
        let isUnique = false;
        let retries = 0;
        while (!isUnique && retries < 5) {
            const existing = await db.select().from(eventRegistrations).where(eq(eventRegistrations.visitorPassId, uniqueId));
            if (existing.length === 0) {
                isUnique = true;
            } else {
                uniqueId = generateVisitorId();
                retries++;
            }
        }

        const newRegistration = await db.insert(eventRegistrations).values({
            eventId: Number(eventId),
            name,
            email,
            phone,
            department,
            year,
            visitorPassId: uniqueId
        }).returning();

        created(res, newRegistration[0]);
    } catch (error) {
        console.error('Error creating registration:', error);
        res.status(500).json({ message: 'Error creating registration', error });
    }
};

export const getRegistrationByVisitorId = async (req: Request, res: Response) => {
    try {
        const { visitorId } = req.params;
        
        // Fetch registration joined with event details
        const results = await db.select({
            registration: eventRegistrations,
            event: events
        })
        .from(eventRegistrations)
        .leftJoin(events, eq(eventRegistrations.eventId, events.id))
        .where(eq(eventRegistrations.visitorPassId, visitorId));

        if (results.length === 0) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        ok(res, results[0]);
    } catch (error) {
        console.error('Error fetching registration:', error);
        res.status(500).json({ message: 'Error fetching registration', error });
    }
};

export const getRegistrationsByEventId = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        const results = await db.select()
            .from(eventRegistrations)
            .where(eq(eventRegistrations.eventId, Number(eventId)));
            
        ok(res, results);
    } catch (error) {
        console.error('Error fetching event registrations:', error);
        res.status(500).json({ message: 'Error fetching event registrations', error });
    }
};
