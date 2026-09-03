import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { db } from '../db';
import { eventRegistrations, events } from '../db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { ok, created, paginated } from '../lib/response';
import { AuthRequest, getAdminId } from '../middleware/auth';
import { asyncHandler } from '../lib/asyncHandler';
import { ConflictError, NotFoundError, UnauthorizedError, AppError, ValidationError } from '../lib/errors';
import { sendVolunteeringPassEmail } from '../services/emailService';
import { z } from 'zod';

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

const registrationSchema = z.object({
    eventId: z.coerce.number().int().positive(),
    name: z.string().trim().min(1, 'Name is required.'),
    email: z.string().trim().toLowerCase().email('Invalid email address.'),
    phone: z.string().trim().min(1, 'Phone is required.'),
    department: z.string().trim().min(1, 'Department is required.'),
    year: z.string().trim().min(1, 'Year is required.'),
});

export const createRegistration = asyncHandler(async (req: Request, res: Response) => {
    const data = registrationSchema.parse(req.body);

    // Proactive check for the common case (duplicate registration) so we can
    // return a clean 409 without relying on parsing driver error strings.
    // Note: this check is itself subject to a narrow TOCTOU race — the unique
    // DB constraint on (eventId, email) remains the real backstop. Worst case
    // on a genuine race is a less-friendly 500 instead of a clean 409, not a
    // data-integrity problem.
    const [existingReg] = await db
        .select({ id: eventRegistrations.id })
        .top(1).from(eventRegistrations)
        .where(and(eq(eventRegistrations.eventId, data.eventId), eq(eventRegistrations.email, data.email)));

    if (existingReg) {
        throw new ConflictError('You have already registered for this event.');
    }

    // Generate a unique visitor pass ID (retry up to 5 times on collision — extremely rare
    // given the 16M-combination space; a collision on attempt 5 is treated as a genuine failure).
    let visitorPassId = generateVisitorPassId();
    let inserted: typeof eventRegistrations.$inferSelect | undefined;

    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            [inserted] = await db
                .insert(eventRegistrations)
                .output().values({
                    eventId: data.eventId,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    department: data.department,
                    year: data.year,
                    visitorPassId,
                    status: 'pending',
                });
            break;
        } catch (error: any) {
            // MSSQL unique constraint violation. Since we already checked
            // (eventId, email) above, a 2627 here almost certainly means a
            // visitorPassId collision — retry with a freshly generated ID.
            if (error.number === 2627 && attempt < 4) {
                visitorPassId = generateVisitorPassId();
                continue;
            }
            throw error;
        }
    }

    if (!inserted) {
        throw new ConflictError('Could not generate a unique visitor pass. Please try again.');
    }

    created(res, inserted, 'Registration submitted successfully. Awaiting admin approval.');
});

// ── Public: look up pass by visitor ID ───────────────────────────────────────

export const getRegistrationByVisitorId = asyncHandler(async (req: Request, res: Response) => {
    const { visitorId } = req.params;

    if (!visitorId || typeof visitorId !== 'string') {
        throw new ValidationError('Visitor ID is required.');
    }

    // Projection intentionally excludes email/phone — this route is
    // unauthenticated and the pass ID space (16M combinations) is
    // brute-forceable, so PII must never be exposed here.
    const [result] = await db
        .select({
            name: eventRegistrations.name,
            department: eventRegistrations.department,
            year: eventRegistrations.year,
            status: eventRegistrations.status,
            visitorPassId: eventRegistrations.visitorPassId,
            eventTitle: events.title,
            eventDate: events.date,
            eventLocation: events.location,
        })
        .from(eventRegistrations)
        .leftJoin(events, eq(eventRegistrations.eventId, events.id))
        .where(eq(eventRegistrations.visitorPassId, visitorId));

    if (!result) {
        throw new NotFoundError('Registration not found.');
    }

    ok(res, result);
});

// ── Admin: list registrations for an event (paginated) ────────────────────────

const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
});

export const getRegistrationsByEventId = asyncHandler(async (req: Request, res: Response) => {
    const eventId = z.coerce.number().int().positive().parse(req.params.eventId);
    const { page, limit } = paginationSchema.parse(req.query);
    const offset = (page - 1) * limit;

    // Admin-only route returns full PII. Confirmed via middleware in registrationRoutes.ts.
    const [countResult] = await db
        .select({ count: count() })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, eventId));
    
    const total = Number(countResult?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    const results = await db
        .select()
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, eventId))
        .orderBy(eventRegistrations.id)
        .offset(offset)
        .fetch(limit);

    paginated(res, results, { page, limit, total, totalPages });
});

// ── Admin: approve a registration ────────────────────────────────────────────

export const approveRegistration = asyncHandler(async (req: Request, res: Response) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const adminId = getAdminId(req);

    // Atomic state transition: only rows currently 'pending' are updated.
    // If output() comes back empty, either the id doesn't exist or the row
    // wasn't pending (double-submit / already actioned) — collapsed into a
    // single 409 deliberately, since distinguishing the two would require a
    // second read and reintroduce the TOCTOU window we're closing here.
    const [updated] = await db
        .update(eventRegistrations)
        .set({ status: 'approved', approvedAt: new Date(), approvedById: adminId })
        .where(and(eq(eventRegistrations.id, id), eq(eventRegistrations.status, 'pending')))
        .output();

    if (!updated) {
        throw new ConflictError('Registration not found or not in a pending state.');
    }

    if (!updated.visitorPassId) {
        // Should be unreachable (assigned at insert time) — guard instead of
        // a non-null assertion so a data anomaly surfaces as a clear error.
        throw new AppError(`Registration ${updated.id} is missing a visitorPassId.`, 500);
    }

    const [event] = await db
        .select()
        .top(1).from(events)
        .where(eq(events.id, updated.eventId));

    if (!event) throw new NotFoundError('Associated event not found.');

    const clientOrigin = getClientOrigin(req);
    const passDownloadUrl = `${clientOrigin}/events/pass/${updated.visitorPassId}`;

    // Fire-and-forget — don't let email failure block the response. Message
    // below reflects that delivery isn't confirmed synchronously.
    sendVolunteeringPassEmail({
        name: updated.name,
        email: updated.email,
        visitorPassId: updated.visitorPassId,
        eventTitle: event.title,
        eventDate: (event.date instanceof Date ? event.date : new Date(event.date as string)).toISOString(),
        eventLocation: event.location,
        department: updated.department,
        year: updated.year,
        passDownloadUrl,
    }).catch(err => console.error('[approveRegistration] Failed to send pass email:', err));

    ok(res, updated, 'Registration approved. Pass email queued for delivery.');
});

// ── Admin: reject a registration ─────────────────────────────────────────────

export const rejectRegistration = asyncHandler(async (req: Request, res: Response) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);

    // Same atomic-transition pattern as approve: only a 'pending' row can be
    // rejected, so an already-approved (pass emailed) registration can't be
    // silently flipped to rejected out from under an admin race.
    const [updated] = await db
        .update(eventRegistrations)
        .set({ status: 'rejected' })
        .where(and(eq(eventRegistrations.id, id), eq(eventRegistrations.status, 'pending')))
        .output();

    if (!updated) {
        throw new ConflictError('Registration not found or not in a pending state.');
    }

    ok(res, updated, 'Registration rejected.');
});

// ── Admin: toggle attendance ───────────────────────────────────────────────────

const attendanceSchema = z.object({
    hasAttended: z.boolean(),
});

export const toggleAttendance = asyncHandler(async (req: Request, res: Response) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const { hasAttended } = attendanceSchema.parse(req.body);

    // Atomic: only an 'approved' registration can have attendance toggled.
    const [updated] = await db
        .update(eventRegistrations)
        .set({ hasAttended })
        .where(and(eq(eventRegistrations.id, id), eq(eventRegistrations.status, 'approved')))
        .output();

    if (!updated) {
        throw new ConflictError('Registration not found or not approved (attendance can only be set for approved registrations).');
    }

    ok(res, updated, 'Attendance status updated.');
});