import { Request, Response } from 'express';
import { db } from '../db';
import { eventRegistrations, events, admins } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ok, created } from '../lib/response';
import { AuthRequest } from '../middleware/auth';
import { sendVolunteeringPassEmail } from '../services/emailService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateVisitorId = () =>
    `NSS-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

const getClientOrigin = (req: Request) => {
    // Prefer the configured origin, then infer from request
    if (process.env.CLIENT_URL) return process.env.CLIENT_URL;
    if (process.env.ALLOWED_ORIGINS) return process.env.ALLOWED_ORIGINS.split(',')[0].trim();
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host  = req.headers['x-forwarded-host']  || req.headers.host;
    return `${proto}://${host}`;
};

// ── Public: submit registration ───────────────────────────────────────────────

export const createRegistration = async (req: Request, res: Response) => {
    try {
        const { eventId, name, email, phone, department, year } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email address is required.' });
        }

        // Generate a unique visitor pass ID
        let uniqueId = generateVisitorId();
        let isUnique = false;
        let retries = 0;
        while (!isUnique && retries < 5) {
            const existing = await db
                .select({ id: eventRegistrations.id })
                .from(eventRegistrations)
                .where(eq(eventRegistrations.visitorPassId, uniqueId))
                .limit(1);
            if (existing.length === 0) {
                isUnique = true;
            } else {
                uniqueId = generateVisitorId();
                retries++;
            }
        }

        const newRegistration = await db
            .insert(eventRegistrations)
            .values({
                eventId: Number(eventId),
                name,
                email,
                phone,
                department,
                year,
                visitorPassId: uniqueId,
                status: 'pending',
            })
            .returning();

        // Return the new registration; status is 'pending' until admin approves
        created(res, newRegistration[0]);
    } catch (error) {
        console.error('Error creating registration:', error);
        res.status(500).json({ message: 'Error creating registration', error });
    }
};

// ── Public: look up pass by visitor ID ───────────────────────────────────────

export const getRegistrationByVisitorId = async (req: Request, res: Response) => {
    try {
        const { visitorId } = req.params;
        const results = await db
            .select({ registration: eventRegistrations, event: events })
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

// ── Admin: list registrations for an event ────────────────────────────────────

export const getRegistrationsByEventId = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        const results = await db
            .select()
            .from(eventRegistrations)
            .where(eq(eventRegistrations.eventId, Number(eventId)));

        ok(res, results);
    } catch (error) {
        console.error('Error fetching event registrations:', error);
        res.status(500).json({ message: 'Error fetching event registrations', error });
    }
};

// ── Admin: approve a registration ────────────────────────────────────────────

export const approveRegistration = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = (req as AuthRequest).user?.id;

        // Fetch registration
        const [reg] = await db
            .select()
            .from(eventRegistrations)
            .where(eq(eventRegistrations.id, Number(id)))
            .limit(1);

        if (!reg) {
            return res.status(404).json({ message: 'Registration not found' });
        }
        if (reg.status === 'approved') {
            return res.status(409).json({ message: 'Registration is already approved.' });
        }

        // Fetch the linked event for email details
        const [event] = await db
            .select()
            .from(events)
            .where(eq(events.id, reg.eventId))
            .limit(1);

        if (!event) {
            return res.status(404).json({ message: 'Associated event not found.' });
        }

        // Update status in DB
        const [updated] = await db
            .update(eventRegistrations)
            .set({
                status: 'approved',
                approvedAt: new Date(),
                approvedById: adminId ?? null,
            })
            .where(eq(eventRegistrations.id, Number(id)))
            .returning();

        // Build the public pass download URL
        const clientOrigin = getClientOrigin(req);
        const passDownloadUrl = `${clientOrigin}/events/pass/${reg.visitorPassId}`;

        // Send approval email with the pass (fire-and-forget so the response is instant)
        sendVolunteeringPassEmail({
            name: reg.name,
            email: reg.email,
            visitorPassId: reg.visitorPassId!,
            eventTitle: event.title,
            eventDate: (event.date instanceof Date ? event.date : new Date(event.date as string)).toISOString(),
            eventLocation: event.location,
            department: reg.department,
            year: reg.year,
            passDownloadUrl,
        }).catch(err => console.error('Failed to send pass email:', err));

        ok(res, updated, 'Registration approved and pass email sent.');
    } catch (error) {
        console.error('Error approving registration:', error);
        res.status(500).json({ message: 'Error approving registration', error });
    }
};

// ── Admin: reject a registration ─────────────────────────────────────────────

export const rejectRegistration = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [reg] = await db
            .select({ id: eventRegistrations.id, status: eventRegistrations.status })
            .from(eventRegistrations)
            .where(eq(eventRegistrations.id, Number(id)))
            .limit(1);

        if (!reg) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        const [updated] = await db
            .update(eventRegistrations)
            .set({ status: 'rejected' })
            .where(eq(eventRegistrations.id, Number(id)))
            .returning();

        ok(res, updated, 'Registration rejected.');
    } catch (error) {
        console.error('Error rejecting registration:', error);
        res.status(500).json({ message: 'Error rejecting registration', error });
    }
};
