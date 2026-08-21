import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { db } from '../db';
import { eventRegistrations, events } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { ok, created, handleError } from '../lib/response';
import { AuthRequest } from '../middleware/auth';
import { ConflictError, NotFoundError } from '../lib/errors';
import { sendVolunteeringPassEmail } from '../services/emailService';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cryptographically random pass ID: NSS-XXXXXX (6 hex chars = 16M combinations) */
const generateVisitorPassId = (): string =>
    `NSS-${randomBytes(3).toString('hex').toUpperCase()}`;

const getClientOrigin = (req: Request): string => {
    if (process.env.CLIENT_URL) return process.env.CLIENT_URL;
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const host  = (req.headers['x-forwarded-host']  as string) || req.headers.host;
    return `${proto}://${host}`;
};

// ── Public: submit registration ───────────────────────────────────────────────

export const createRegistration = async (req: Request, res: Response) => {
    try {
        const { eventId, name, email, phone, department, year } = req.body;

        if (!eventId || !name || !email || !phone || !department || !year) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const normalizedEmail = String(email).toLowerCase().trim();

        if (typeof normalizedEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({ success: false, message: 'Invalid email address.' });
        }

        // Prevent duplicate registrations for the same email + event
        const [dupe] = await db
            .select({ id: eventRegistrations.id })
            .top(1).from(eventRegistrations)
            .where(and(
                eq(eventRegistrations.eventId, Number(eventId)),
                eq(eventRegistrations.email, normalizedEmail),
            ));
        if (dupe) throw new ConflictError('You have already registered for this event.');

        // Generate a unique visitor pass ID (retry up to 5 times on collision — extremely rare)
        let visitorPassId = generateVisitorPassId();
        for (let attempt = 0; attempt < 5; attempt++) {
            const [existing] = await db
                .select({ id: eventRegistrations.id })
                .top(1).from(eventRegistrations)
                .where(eq(eventRegistrations.visitorPassId, visitorPassId));
            if (!existing) break;
            visitorPassId = generateVisitorPassId();
        }

        const [newRegistration] = await db
            .insert(eventRegistrations)
            .output().values({
                eventId: Number(eventId),
                name: String(name).trim(),
                email: normalizedEmail,
                phone: String(phone).trim(),
                department: String(department).trim(),
                year: String(year).trim(),
                visitorPassId,
                status: 'pending',
            });

        created(res, newRegistration, 'Registration submitted successfully. Awaiting admin approval.');
    } catch (error) {
        console.error('[createRegistration] Error:', error);
        handleError(res, error);
    }
};

// ── Public: look up pass by visitor ID ───────────────────────────────────────

export const getRegistrationByVisitorId = async (req: Request, res: Response) => {
    try {
        const { visitorId } = req.params;

        if (!visitorId || typeof visitorId !== 'string') {
            return res.status(400).json({ success: false, message: 'Visitor ID is required.' });
        }

        const [result] = await db
            .select({ registration: eventRegistrations, event: events })
            .from(eventRegistrations)
            .leftJoin(events, eq(eventRegistrations.eventId, events.id))
            .where(eq(eventRegistrations.visitorPassId, visitorId));

        if (!result) {
            throw new NotFoundError('Registration not found.');
        }

        ok(res, result);
    } catch (error) {
        handleError(res, error);
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
        handleError(res, error);
    }
};

// ── Admin: approve a registration ────────────────────────────────────────────

export const approveRegistration = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = (req as AuthRequest).user?.id;

        const [reg] = await db
            .select()
            .top(1).from(eventRegistrations)
            .where(eq(eventRegistrations.id, Number(id)));

        if (!reg) throw new NotFoundError('Registration not found.');
        if (reg.status === 'approved') throw new ConflictError('Registration is already approved.');

        const [event] = await db
            .select()
            .top(1).from(events)
            .where(eq(events.id, reg.eventId));

        if (!event) throw new NotFoundError('Associated event not found.');

        const [updated] = await db
            .update(eventRegistrations)
            .set({ status: 'approved', approvedAt: new Date(), approvedById: adminId ?? null })
            .where(eq(eventRegistrations.id, Number(id)))
            .output();

        const clientOrigin = getClientOrigin(req);
        const passDownloadUrl = `${clientOrigin}/events/pass/${reg.visitorPassId}`;

        // Fire-and-forget — don't let email failure block the response
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
        }).catch(err => console.error('[approveRegistration] Failed to send pass email:', err));

        ok(res, updated, 'Registration approved and pass email sent.');
    } catch (error) {
        handleError(res, error);
    }
};

// ── Admin: reject a registration ─────────────────────────────────────────────

export const rejectRegistration = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [reg] = await db
            .select({ id: eventRegistrations.id, status: eventRegistrations.status })
            .top(1).from(eventRegistrations)
            .where(eq(eventRegistrations.id, Number(id)));

        if (!reg) throw new NotFoundError('Registration not found.');

        const [updated] = await db
            .update(eventRegistrations)
            .set({ status: 'rejected' })
            .where(eq(eventRegistrations.id, Number(id)))
            .output();

        ok(res, updated, 'Registration rejected.');
    } catch (error) {
        handleError(res, error);
    }
};
