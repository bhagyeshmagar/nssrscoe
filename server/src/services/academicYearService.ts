import { eq, ne, and, count, sql } from 'drizzle-orm';
import { db } from '../db';
import {
    academicYears,
    volunteers,
    coreTeamAssignments,
    specialCamps,
    events,
} from '../db/schema';
import {
    NotFoundError,
    ConflictError,
    ValidationError,
    ForbiddenError,
    AYLockedError,
} from '../lib/errors';
import { logAudit, auditAYLock, auditAYArchive } from './auditService';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateAYInput {
    label: string;
    startDate: string;
    endDate: string;
    volunteerCap?: number;
}

export interface UpdateAYInput {
    label?: string;
    startDate?: string;
    endDate?: string;
    volunteerCap?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the AY or throws 404 */
const findAY = async (id: number) => {
    const [ay] = await db.select().from(academicYears).where(eq(academicYears.id, id)).limit(1);
    if (!ay) throw new NotFoundError(`Academic year with id ${id} not found.`);
    return ay;
};

/** Validates the label is in "YYYY-YY" format, e.g. "2024-25" */
const validateLabel = (label: string) => {
    const pattern = /^\d{4}-\d{2}$/;
    if (!pattern.test(label)) {
        throw new ValidationError('Academic year label must be in "YYYY-YY" format (e.g. "2024-25").');
    }
};

// ── CRUD ──────────────────────────────────────────────────────────────────────

export const createAcademicYear = async (input: CreateAYInput, adminId: number) => {
    validateLabel(input.label);

    if (new Date(input.startDate) >= new Date(input.endDate)) {
        throw new ValidationError('start_date must be before end_date.');
    }

    const [existing] = await db
        .select({ id: academicYears.id })
        .from(academicYears)
        .where(eq(academicYears.label, input.label))
        .limit(1);
    if (existing) throw new ConflictError(`Academic year "${input.label}" already exists.`);

    const [ay] = await db.insert(academicYears).values({
        label: input.label,
        startDate: input.startDate,
        endDate: input.endDate,
        volunteerCap: input.volunteerCap ?? 100,
        isCurrent: false,
        isLocked: false,
        isArchived: false,
    }).returning();

    await logAudit({
        action: 'academic_year.create',
        entityType: 'academic_year',
        entityId: ay.id,
        performedById: adminId,
        academicYearId: ay.id,
        details: { label: ay.label },
    });

    return ay;
};

export const getAllAcademicYears = async () =>
    db.select().from(academicYears).orderBy(academicYears.label);

export const getAcademicYearById = async (id: number) => findAY(id);

export const getCurrentAcademicYear = async () => {
    const [ay] = await db
        .select()
        .from(academicYears)
        .where(eq(academicYears.isCurrent, true))
        .limit(1);
    return ay ?? null;
};

export const updateAcademicYear = async (id: number, input: UpdateAYInput, adminId: number) => {
    const ay = await findAY(id);

    if (ay.isLocked) throw new AYLockedError(ay.label);
    if (ay.isCurrent) {
        // Cap can be updated even on an active year; label/dates cannot change once active
        if (input.label || input.startDate || input.endDate) {
            throw new ForbiddenError(
                'Label, start_date, and end_date cannot be changed on the currently active academic year.',
                'AY_ACTIVE',
            );
        }
    }

    if (input.label) validateLabel(input.label);
    if (input.startDate && input.endDate && new Date(input.startDate) >= new Date(input.endDate)) {
        throw new ValidationError('start_date must be before end_date.');
    }

    const [updated] = await db
        .update(academicYears)
        .set({
            ...(input.label && { label: input.label }),
            ...(input.startDate && { startDate: input.startDate }),
            ...(input.endDate && { endDate: input.endDate }),
            ...(input.volunteerCap !== undefined && { volunteerCap: input.volunteerCap }),
        })
        .where(eq(academicYears.id, id))
        .returning();

    await logAudit({
        action: 'academic_year.update',
        entityType: 'academic_year',
        entityId: id,
        performedById: adminId,
        academicYearId: id,
        details: input as unknown as Record<string, unknown>,
    });

    return updated;
};

// ── State transitions ──────────────────────────────────────────────────────────

/**
 * Activate: set this AY as current. Only one can be active at a time.
 * Deactivates the currently active AY first (within a transaction).
 */
export const activateAcademicYear = async (id: number, adminId: number) => {
    const ay = await findAY(id);

    if (ay.isLocked)   throw new AYLockedError(ay.label);
    if (ay.isArchived) throw new ForbiddenError(`Academic year "${ay.label}" is archived and cannot be activated.`, 'AY_ARCHIVED');
    if (ay.isCurrent)  throw new ConflictError(`Academic year "${ay.label}" is already the current year.`);

    // Deactivate any existing current AY, then activate this one — in a transaction
    await db.transaction(async (tx) => {
        await tx
            .update(academicYears)
            .set({ isCurrent: false })
            .where(eq(academicYears.isCurrent, true));

        await tx
            .update(academicYears)
            .set({ isCurrent: true })
            .where(eq(academicYears.id, id));
    });

    await logAudit({
        action: 'academic_year.activate',
        entityType: 'academic_year',
        entityId: id,
        performedById: adminId,
        academicYearId: id,
        details: { label: ay.label },
    });

    return findAY(id);
};

/**
 * Lock: freeze all write operations scoped to this AY.
 * Automatically removes it as the current year.
 * This is irreversible.
 */
export const lockAcademicYear = async (id: number, adminId: number) => {
    const ay = await findAY(id);

    if (ay.isLocked)   throw new ConflictError(`Academic year "${ay.label}" is already locked.`);
    if (ay.isArchived) throw new ForbiddenError(`Academic year "${ay.label}" is archived.`, 'AY_ARCHIVED');

    await db
        .update(academicYears)
        .set({
            isLocked: true,
            isCurrent: false,
            lockedAt: new Date(),
            lockedById: adminId,
        })
        .where(eq(academicYears.id, id));

    await auditAYLock(id, adminId, ay.label);

    return findAY(id);
};

/**
 * Archive: mark a locked AY as archived.
 * AY must be locked first. Archived AYs disappear from active management views
 * but remain fully queryable for historical reporting.
 */
export const archiveAcademicYear = async (id: number, adminId: number) => {
    const ay = await findAY(id);

    if (!ay.isLocked)  throw new ForbiddenError(`Academic year "${ay.label}" must be locked before archiving.`, 'AY_NOT_LOCKED');
    if (ay.isArchived) throw new ConflictError(`Academic year "${ay.label}" is already archived.`);

    await db
        .update(academicYears)
        .set({ isArchived: true })
        .where(eq(academicYears.id, id));

    await auditAYArchive(id, adminId, ay.label);

    return findAY(id);
};

// ── Stats ──────────────────────────────────────────────────────────────────────

export const getAcademicYearStats = async (id: number) => {
    await findAY(id); // validates existence

    // Total volunteers, regular count, backup count
    const [totals] = await db
        .select({
            total: count(),
            regular: sql<number>`SUM(CASE WHEN ${volunteers.status} = 'regular' THEN 1 ELSE 0 END)`,
            backup:  sql<number>`SUM(CASE WHEN ${volunteers.status} = 'backup'  THEN 1 ELSE 0 END)`,
            active:  sql<number>`SUM(CASE WHEN ${volunteers.isActive} = true    THEN 1 ELSE 0 END)`,
        })
        .from(volunteers)
        .where(eq(volunteers.academicYearId, id));

    // Per-department breakdown
    const deptRows = await db
        .select({
            department: volunteers.department,
            total:   sql<number>`COUNT(*)`,
            regular: sql<number>`SUM(CASE WHEN ${volunteers.status} = 'regular' THEN 1 ELSE 0 END)`,
        })
        .from(volunteers)
        .where(eq(volunteers.academicYearId, id))
        .groupBy(volunteers.department);

    // Core team count
    const [coreTeamCount] = await db
        .select({ n: count() })
        .from(coreTeamAssignments)
        .where(eq(coreTeamAssignments.academicYearId, id));

    // Special camp count
    const [campCount] = await db
        .select({ n: count() })
        .from(specialCamps)
        .where(eq(specialCamps.academicYearId, id));

    // Event count (optional link)
    const [eventCount] = await db
        .select({ n: count() })
        .from(events)
        .where(eq(events.academicYearId, id));

    return {
        volunteers: {
            total: Number(totals.total),
            regular: Number(totals.regular ?? 0),
            backup: Number(totals.backup ?? 0),
            active: Number(totals.active ?? 0),
        },
        byDepartment: deptRows.map(r => ({
            department: r.department,
            total: Number(r.total),
            regular: Number(r.regular ?? 0),
        })),
        coreTeamAssignments: Number(coreTeamCount.n),
        specialCamps: Number(campCount.n),
        events: Number(eventCount.n),
    };
};
