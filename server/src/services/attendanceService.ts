import { eq, and, count, sql } from 'drizzle-orm';
import { db } from '../db';
import { attendanceSessions, attendanceRecords, volunteers, academicYears, events } from '../db/schema';
import { NotFoundError, AYLockedError, ValidationError } from '../lib/errors';
import { logAudit } from './auditService';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateSessionInput {
    title: string;
    date: string;
    eventId?: number;
    description?: string;
}

export interface AttendanceRecord {
    volunteerId: number;
    status: 'present' | 'absent' | 'late';
    notes?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const requireUnlockedAY = async (ayId: number, tx: Tx | typeof db = db) => {
    const [ay] = await tx.select().top(1).from(academicYears).where(eq(academicYears.id, ayId));
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);
    if (ay.isLocked) throw new AYLockedError(ay.label);
    return ay;
};

const findSession = async (sessionId: number, tx: Tx | typeof db = db) => {
    const [session] = await tx
        .select()
        .top(1).from(attendanceSessions)
        .where(eq(attendanceSessions.id, sessionId));
    if (!session) throw new NotFoundError(`Attendance session ${sessionId} not found.`);
    return session;
};

// ── Sessions ──────────────────────────────────────────────────────────────────

export const listSessions = async (ayId: number, filters: { eventId?: number } = {}) => {
    const [ay] = await db.select({ id: academicYears.id }).top(1).from(academicYears).where(eq(academicYears.id, ayId));
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);

    const conditions = [eq(attendanceSessions.academicYearId, ayId)];
    if (filters.eventId) conditions.push(eq(attendanceSessions.eventId, filters.eventId));

    return db.select().from(attendanceSessions).where(and(...conditions)).orderBy(attendanceSessions.date);
};

export const createSession = async (ayId: number, input: CreateSessionInput, adminId: number) => {
    return await db.transaction(async (tx) => {
        await requireUnlockedAY(ayId, tx);

        if (input.eventId) {
            const [event] = await tx.select().top(1).from(events).where(eq(events.id, input.eventId));
            if (!event) throw new NotFoundError(`Event ${input.eventId} not found.`);
        }

        const [session] = await tx.insert(attendanceSessions).output().values({
            academicYearId: ayId,
            title: input.title,
            date: new Date(input.date),
            description: input.description,
            eventId: input.eventId,
            createdById: adminId,
        });

        await logAudit({
            action: 'attendance.session_create',
            entityType: 'attendance_session',
            entityId: session.id,
            performedById: adminId,
            academicYearId: ayId,
        }, tx);

        return session;
    });
};

export const getSession = async (sessionId: number, tx: Tx | typeof db = db) => {
    const session = await findSession(sessionId, tx);
    const records = await tx
        .select({
            id: attendanceRecords.id,
            volunteerId: attendanceRecords.volunteerId,
            status: attendanceRecords.status,
            notes: attendanceRecords.notes,
            volunteerName: volunteers.name,
            department: volunteers.department,
        })
        .from(attendanceRecords)
        .leftJoin(volunteers, eq(attendanceRecords.volunteerId, volunteers.id))
        .where(eq(attendanceRecords.sessionId, sessionId))
        .orderBy(volunteers.name);

    return { ...session, records };
};

export const deleteSession = async (sessionId: number, adminId: number) => {
    await db.transaction(async (tx) => {
        const session = await findSession(sessionId, tx);
        await requireUnlockedAY(session.academicYearId, tx);

        // Delete child records first in case there is no ON DELETE CASCADE
        await tx.delete(attendanceRecords).where(eq(attendanceRecords.sessionId, sessionId));
        await tx.delete(attendanceSessions).where(eq(attendanceSessions.id, sessionId));

        await logAudit({
            action: 'attendance.session_delete',
            entityType: 'attendance_session',
            entityId: sessionId,
            performedById: adminId,
            academicYearId: session.academicYearId,
        }, tx);
    });
};

// ── Mark attendance (bulk) ────────────────────────────────────────────────────

// ── Private helper: core upsert logic, runs inside an existing tx ─────────────

const _markAttendanceInTx = async (
    tx: Tx,
    sessionId: number,
    session: { academicYearId: number },
    records: AttendanceRecord[],
    adminId: number,
) => {
    // Deduplicate by volunteerId (last entry wins)
    const deduped = new Map<number, AttendanceRecord>();
    for (const rec of records) deduped.set(rec.volunteerId, rec);
    const uniqueRecords = [...deduped.values()];

    // Validate all volunteers belong to this AY
    const volIds = uniqueRecords.map(r => r.volunteerId);
    const volRows = await tx
        .select({ id: volunteers.id })
        .from(volunteers)
        .where(eq(volunteers.academicYearId, session.academicYearId));
    const validIds = new Set(volRows.map(v => v.id));
    const invalid = volIds.filter(id => !validIds.has(id));
    if (invalid.length) {
        throw new ValidationError(`Volunteers [${invalid.join(', ')}] do not belong to this academic year.`);
    }

    // Load existing records in one query
    const existingRecords = await tx
        .select({ id: attendanceRecords.id, volunteerId: attendanceRecords.volunteerId })
        .from(attendanceRecords)
        .where(eq(attendanceRecords.sessionId, sessionId));
    const existingMap = new Map(existingRecords.map(r => [r.volunteerId, r.id]));

    // Separate into updates and inserts
    const toUpdate: { id: number; rec: AttendanceRecord }[] = [];
    const toInsert: AttendanceRecord[] = [];
    for (const rec of uniqueRecords) {
        const existingId = existingMap.get(rec.volunteerId);
        if (existingId !== undefined) {
            toUpdate.push({ id: existingId, rec });
        } else {
            toInsert.push(rec);
        }
    }

    for (const { id, rec } of toUpdate) {
        await tx.update(attendanceRecords).set({
            status: rec.status,
            notes: rec.notes ?? null,
            recordedById: adminId,
        }).where(eq(attendanceRecords.id, id));
    }

    if (toInsert.length > 0) {
        await tx.insert(attendanceRecords).values(
            toInsert.map(rec => ({
                sessionId,
                volunteerId: rec.volunteerId,
                status: rec.status,
                notes: rec.notes ?? null,
                recordedById: adminId,
            }))
        );
    }

    await logAudit({
        action: 'attendance.mark',
        entityType: 'attendance_session',
        entityId: sessionId,
        performedById: adminId,
        academicYearId: session.academicYearId,
        details: { count: uniqueRecords.length },
    }, tx);

    return getSession(sessionId, tx);
};

// ── Mark attendance (bulk) ────────────────────────────────────────────────────

export const markAttendance = async (
    sessionId: number,
    records: AttendanceRecord[],
    adminId: number,
) => {
    if (!records.length) throw new ValidationError('At least one attendance record is required.');

    return await db.transaction(async (tx) => {
        const session = await findSession(sessionId, tx);
        await requireUnlockedAY(session.academicYearId, tx);
        return _markAttendanceInTx(tx, sessionId, session, records, adminId);
    });
};

// ── Event Attendance ──────────────────────────────────────────────────────────

export const getEventAttendance = async (ayId: number, eventId: number) => {
    // 1. Ensure event exists
    const [event] = await db.select().top(1).from(events).where(eq(events.id, eventId));
    if (!event) throw new NotFoundError(`Event ${eventId} not found.`);

    // 2. Find associated session for this event in this AY
    const [session] = await db
        .select()
        .top(1).from(attendanceSessions)
        .where(and(eq(attendanceSessions.academicYearId, ayId), eq(attendanceSessions.eventId, eventId)));

    if (!session) {
        return { event, session: null, records: [] };
    }

    // 3. Return session with records
    const sessionData = await getSession(session.id);
    return { event, session: sessionData, records: sessionData.records };
};

export const saveEventAttendance = async (ayId: number, eventId: number, records: AttendanceRecord[], adminId: number) => {
    return await db.transaction(async (tx) => {
        // Serialize concurrent requests to prevent duplicate sessions for the same event
        await tx.execute(sql`EXEC sp_getapplock @Resource=${'ATT_EVENT_' + ayId + '_' + eventId}, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=5000`);

        await requireUnlockedAY(ayId, tx);

        const [event] = await tx.select().top(1).from(events).where(eq(events.id, eventId));
        if (!event) throw new NotFoundError(`Event ${eventId} not found.`);

        // Find or create session (inside transaction to prevent TOCTOU)
        let [session] = await tx
            .select()
            .top(1).from(attendanceSessions)
            .where(and(eq(attendanceSessions.academicYearId, ayId), eq(attendanceSessions.eventId, eventId)));

        if (!session) {
            const eventDate = typeof event.date === 'string' ? new Date(event.date) : event.date;
            [session] = await tx.insert(attendanceSessions).output().values({
                academicYearId: ayId,
                eventId: eventId,
                title: event.title,
                date: eventDate,
                description: `Auto-created session for event: ${event.title}`,
                createdById: adminId,
            });

            await logAudit({
                action: 'attendance.session_create',
                entityType: 'attendance_session',
                entityId: session.id,
                performedById: adminId,
                academicYearId: ayId,
            }, tx);
        }

        // Use the shared inner helper directly — avoids opening a nested transaction
        return _markAttendanceInTx(tx, session.id, session, records, adminId);
    });
};

// ── Summary ───────────────────────────────────────────────────────────────────

export const getAYAttendanceSummary = async (ayId: number) => {
    const [ay] = await db.select({ id: academicYears.id }).top(1).from(academicYears).where(eq(academicYears.id, ayId));
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);

    const sessionCount = await db.select({ n: count() }).from(attendanceSessions).where(eq(attendanceSessions.academicYearId, ayId));

    // Per-volunteer summary
    const volSummary = await db
        .select({
            volunteerId: attendanceRecords.volunteerId,
            volunteerName: volunteers.name,
            department: volunteers.department,
            present: sql<number>`SUM(CASE WHEN ${attendanceRecords.status} = 'present' THEN 1 ELSE 0 END)`,
            absent: sql<number>`SUM(CASE WHEN ${attendanceRecords.status} = 'absent' THEN 1 ELSE 0 END)`,
            late: sql<number>`SUM(CASE WHEN ${attendanceRecords.status} = 'late' THEN 1 ELSE 0 END)`,
            total: count(),
        })
        .from(attendanceRecords)
        .innerJoin(attendanceSessions, eq(attendanceRecords.sessionId, attendanceSessions.id))
        .innerJoin(volunteers, eq(attendanceRecords.volunteerId, volunteers.id))
        .where(eq(attendanceSessions.academicYearId, ayId))
        .groupBy(attendanceRecords.volunteerId, volunteers.name, volunteers.department);

    return {
        totalSessions: Number(sessionCount[0].n),
        volunteers: volSummary.map(r => ({
            volunteerId: r.volunteerId,
            name: r.volunteerName,
            department: r.department,
            present: Number(r.present),
            absent: Number(r.absent),
            late: Number(r.late),
            total: Number(r.total),
            attendanceRate: Number(r.total) > 0 ? Math.round((Number(r.present) / Number(r.total)) * 100) : 0,
        })),
    };
};

export const getVolunteerAttendance = async (ayId: number, volunteerId: number) => {
    const [vol] = await db.select().top(1).from(volunteers).where(eq(volunteers.id, volunteerId));
    if (!vol) throw new NotFoundError(`Volunteer ${volunteerId} not found.`);

    return db
        .select({
            sessionId: attendanceSessions.id,
            sessionTitle: attendanceSessions.title,
            date: attendanceSessions.date,
            status: attendanceRecords.status,
            notes: attendanceRecords.notes,
        })
        .from(attendanceSessions)
        .leftJoin(
            attendanceRecords,
            and(
                eq(attendanceRecords.sessionId, attendanceSessions.id),
                eq(attendanceRecords.volunteerId, volunteerId),
            ),
        )
        .where(eq(attendanceSessions.academicYearId, ayId))
        .orderBy(attendanceSessions.date);
};
