import { eq, and, count, sql } from 'drizzle-orm';
import { db } from '../db';
import { attendanceSessions, attendanceRecords, volunteers, academicYears } from '../db/schema';
import { NotFoundError, ConflictError, AYLockedError, ValidationError } from '../lib/errors';
import { events } from '../db/schema';
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

const requireUnlockedAY = async (ayId: number) => {
    const [ay] = await db.select().from(academicYears).where(eq(academicYears.id, ayId)).limit(1);
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);
    if (ay.isLocked) throw new AYLockedError(ay.label);
    return ay;
};

const findSession = async (sessionId: number) => {
    const [session] = await db
        .select()
        .from(attendanceSessions)
        .where(eq(attendanceSessions.id, sessionId))
        .limit(1);
    if (!session) throw new NotFoundError(`Attendance session ${sessionId} not found.`);
    return session;
};

// ── Sessions ──────────────────────────────────────────────────────────────────

export const listSessions = async (ayId: number, filters: { eventId?: number } = {}) => {
    const [ay] = await db.select({ id: academicYears.id }).from(academicYears).where(eq(academicYears.id, ayId)).limit(1);
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);

    const conditions = [eq(attendanceSessions.academicYearId, ayId)];
    if (filters.eventId) conditions.push(eq(attendanceSessions.eventId, filters.eventId));

    return db.select().from(attendanceSessions).where(and(...conditions)).orderBy(attendanceSessions.date);
};

export const createSession = async (ayId: number, input: CreateSessionInput, adminId: number) => {
    await requireUnlockedAY(ayId);

    const [session] = await db.insert(attendanceSessions).values({
        academicYearId: ayId,
        title: input.title,
        date: input.date,
        eventId: input.eventId ?? null,
        description: input.description ?? null,
        createdById: adminId,
    }).returning();

    await logAudit({ action: 'attendance.session_create', entityType: 'attendance_session', entityId: session.id, performedById: adminId, academicYearId: ayId });

    return session;
};

export const getSession = async (sessionId: number) => {
    const session = await findSession(sessionId);
    const records = await db
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
    const session = await findSession(sessionId);
    await requireUnlockedAY(session.academicYearId);
    await db.delete(attendanceSessions).where(eq(attendanceSessions.id, sessionId));
    await logAudit({ action: 'attendance.session_delete', entityType: 'attendance_session', entityId: sessionId, performedById: adminId, academicYearId: session.academicYearId });
};

// ── Mark attendance (bulk) ────────────────────────────────────────────────────

export const markAttendance = async (
    sessionId: number,
    records: AttendanceRecord[],
    adminId: number,
) => {
    const session = await findSession(sessionId);
    await requireUnlockedAY(session.academicYearId);

    if (!records.length) throw new ValidationError('At least one attendance record is required.');

    // Validate all volunteers belong to this AY
    const volIds = [...new Set(records.map(r => r.volunteerId))];
    const volRows = await db
        .select({ id: volunteers.id })
        .from(volunteers)
        .where(and(
            eq(volunteers.academicYearId, session.academicYearId),
            eq(volunteers.status, 'regular'),
        ));
    const validIds = new Set(volRows.map(v => v.id));
    const invalid = volIds.filter(id => !validIds.has(id));
    if (invalid.length) {
        throw new ValidationError(`Volunteers [${invalid.join(', ')}] are not regular members of this academic year.`);
    }

    // Upsert each record
    for (const rec of records) {
        await db.insert(attendanceRecords).values({
            sessionId,
            volunteerId: rec.volunteerId,
            status: rec.status,
            notes: rec.notes ?? null,
            recordedById: adminId,
        }).onConflictDoUpdate({
            target: [attendanceRecords.sessionId, attendanceRecords.volunteerId],
            set: { status: rec.status, notes: rec.notes ?? null, recordedById: adminId },
        });
    }

    await logAudit({ action: 'attendance.mark', entityType: 'attendance_session', entityId: sessionId, performedById: adminId, academicYearId: session.academicYearId, details: { count: records.length } });

    return getSession(sessionId);
};

// ── Event Attendance ──────────────────────────────────────────────────────────

export const getEventAttendance = async (ayId: number, eventId: number) => {
    // 1. Ensure event exists
    const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event) throw new NotFoundError(`Event ${eventId} not found.`);

    // 2. Find associated session for this event in this AY
    const [session] = await db
        .select()
        .from(attendanceSessions)
        .where(and(eq(attendanceSessions.academicYearId, ayId), eq(attendanceSessions.eventId, eventId)))
        .limit(1);

    if (!session) {
        // No session exists yet, return empty records
        return { event, session: null, records: [] };
    }

    // 3. Return session with records
    const sessionData = await getSession(session.id);
    return { event, session: sessionData, records: sessionData.records };
};

export const saveEventAttendance = async (ayId: number, eventId: number, records: AttendanceRecord[], adminId: number) => {
    await requireUnlockedAY(ayId);

    const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event) throw new NotFoundError(`Event ${eventId} not found.`);

    // Find or create session
    let [session] = await db
        .select()
        .from(attendanceSessions)
        .where(and(eq(attendanceSessions.academicYearId, ayId), eq(attendanceSessions.eventId, eventId)))
        .limit(1);

    if (!session) {
        // Create session
        [session] = await db.insert(attendanceSessions).values({
            academicYearId: ayId,
            eventId: eventId,
            title: event.title,
            date: event.date.toISOString().split('T')[0], // Store date part
            description: `Auto-created session for event: ${event.title}`,
            createdById: adminId,
        }).returning();
    }

    // Use markAttendance which handles the upsert logic
    return markAttendance(session.id, records, adminId);
};

// ── Summary ───────────────────────────────────────────────────────────────────

export const getAYAttendanceSummary = async (ayId: number) => {
    const [ay] = await db.select({ id: academicYears.id }).from(academicYears).where(eq(academicYears.id, ayId)).limit(1);
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
            attendanceRate: r.total > 0 ? Math.round((Number(r.present) / Number(r.total)) * 100) : 0,
        })),
    };
};

export const getVolunteerAttendance = async (ayId: number, volunteerId: number) => {
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
