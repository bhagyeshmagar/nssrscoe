import { eq, ne, and, count, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import {
    academicYears,
    volunteers,
    coreTeamAssignments,
    specialCamps,
    events,
    admins,
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
    regularActivityReportUrl?: string;
    specialCampReportUrl?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the AY or throws 404 */
const findAY = async (id: number, tx: any = db) => {
    const [ay] = await tx.select().top(1).from(academicYears).where(eq(academicYears.id, id));
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

    try {
        return await db.transaction(async (tx) => {
            const [ay] = await tx.insert(academicYears).output().values({
                label: input.label,
                startDate: new Date(input.startDate),
                endDate: new Date(input.endDate),
                volunteerCap: input.volunteerCap ?? 100,
                isCurrent: false,
                isLocked: false,
                isArchived: false,
            });

            await logAudit({
                action: 'academic_year.create',
                entityType: 'academic_year',
                entityId: ay.id,
                performedById: adminId,
                academicYearId: ay.id,
                details: { label: ay.label },
            }, tx);

            return ay;
        });
    } catch (err: any) {
        if (err?.number === 2627 || err?.number === 2601 || String(err).includes('UNIQUE KEY')) {
            throw new ConflictError(`Academic year "${input.label}" already exists.`);
        }
        throw err;
    }
};

export const getAllAcademicYears = async () =>
    db.select().from(academicYears).orderBy(academicYears.label);

export const getAcademicYearById = async (id: number) => findAY(id);

export const getCurrentAcademicYear = async () => {
    const [ay] = await db
        .select()
        .top(1).from(academicYears)
        .where(eq(academicYears.isCurrent, true))
        ;
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

    try {
        return await db.transaction(async (tx) => {
            const [updated] = await tx
                .update(academicYears)
                .set({
                    ...(input.label && { label: input.label }),
                    ...(input.startDate && { startDate: new Date(input.startDate) }),
                    ...(input.endDate && { endDate: new Date(input.endDate) }),
                    ...(input.volunteerCap !== undefined && { volunteerCap: input.volunteerCap }),
                    ...(input.regularActivityReportUrl !== undefined && { regularActivityReportUrl: input.regularActivityReportUrl }),
                    ...(input.specialCampReportUrl !== undefined && { specialCampReportUrl: input.specialCampReportUrl }),
                })
                .where(eq(academicYears.id, id))
                .output();

            await logAudit({
                action: 'academic_year.update',
                entityType: 'academic_year',
                entityId: id,
                performedById: adminId,
                academicYearId: id,
                details: input as unknown as Record<string, unknown>,
            }, tx);

            return updated;
        });
    } catch (err: any) {
        if (err?.number === 2627 || err?.number === 2601 || String(err).includes('UNIQUE KEY')) {
            throw new ConflictError(`Academic year label already exists.`);
        }
        throw err;
    }
};

// ── State transitions ──────────────────────────────────────────────────────────

/**
 * Activate: set this AY as current. Only one can be active at a time.
 * Deactivates the currently active AY first (within a transaction).
 */
export const activateAcademicYear = async (id: number, adminId: number) => {
    try {
        return await db.transaction(async (tx) => {
            const ay = await findAY(id, tx);

            if (ay.isLocked)   throw new AYLockedError(ay.label);
            if (ay.isArchived) throw new ForbiddenError(`Academic year "${ay.label}" is archived and cannot be activated.`, 'AY_ARCHIVED');
            if (ay.isCurrent)  throw new ConflictError(`Academic year "${ay.label}" is already the current year.`);

            // Deactivate any existing current AY
            await tx
                .update(academicYears)
                .set({ isCurrent: false })
                .where(eq(academicYears.isCurrent, true));

            // Activate new AY
            const [updated] = await tx
                .update(academicYears)
                .set({ isCurrent: true })
                .where(eq(academicYears.id, id))
                .output();

            await logAudit({
                action: 'academic_year.activate',
                entityType: 'academic_year',
                entityId: id,
                performedById: adminId,
                academicYearId: id,
                details: { label: ay.label },
            }, tx);

            return updated;
        });
    } catch (err: any) {
        if (err?.number === 2601 || err?.number === 2627 || String(err).includes('unique index')) {
            throw new ConflictError('Another academic year was activated concurrently.');
        }
        throw err;
    }
};

/**
 * Lock: freeze all write operations scoped to this AY.
 * Automatically removes it as the current year.
 * This is irreversible.
 */
export const lockAcademicYear = async (id: number, adminId: number) => {
    return await db.transaction(async (tx) => {
        const ay = await findAY(id, tx);

        if (ay.isLocked)   throw new ConflictError(`Academic year "${ay.label}" is already locked.`);
        if (ay.isArchived) throw new ForbiddenError(`Academic year "${ay.label}" is archived.`, 'AY_ARCHIVED');

        const [locked] = await tx
            .update(academicYears)
            .set({
                isLocked: true,
                isCurrent: false,
                lockedAt: new Date(),
                lockedById: adminId,
            })
            .where(eq(academicYears.id, id))
            .output();

        await auditAYLock(id, adminId, ay.label, tx);

        return locked;
    });
};

export const unlockAcademicYear = async (id: number, passwordStr: string, adminId: number) => {
    return await db.transaction(async (tx) => {
        const ay = await findAY(id, tx);

        if (!ay.isLocked) throw new ConflictError(`Academic year "${ay.label}" is not locked.`);
        if (ay.isArchived) throw new ForbiddenError(`Academic year "${ay.label}" is archived and cannot be unlocked.`, 'AY_ARCHIVED');

        const [admin] = await tx.select().top(1).from(admins).where(eq(admins.id, adminId));
        if (!admin) throw new NotFoundError('Admin not found.');

        const isValid = await bcrypt.compare(passwordStr, admin.passwordHash);
        if (!isValid) throw new ForbiddenError('Invalid admin password.');

        const [unlocked] = await tx
            .update(academicYears)
            .set({
                isLocked: false,
                lockedAt: null,
                lockedById: null,
            })
            .where(eq(academicYears.id, id))
            .output();

        await logAudit({
            action: 'academic_year.unlock',
            entityType: 'academic_year',
            entityId: id,
            performedById: adminId,
            academicYearId: id,
            details: { label: ay.label },
        }, tx);

        return unlocked;
    });
};

/**
 * Archive: mark a locked AY as archived.
 * AY must be locked first. Archived AYs disappear from active management views
 * but remain fully queryable for historical reporting.
 */
export const archiveAcademicYear = async (id: number, adminId: number) => {
    return await db.transaction(async (tx) => {
        const ay = await findAY(id, tx);

        if (!ay.isLocked)  throw new ForbiddenError(`Academic year "${ay.label}" must be locked before archiving.`, 'AY_NOT_LOCKED');
        if (ay.isArchived) throw new ConflictError(`Academic year "${ay.label}" is already archived.`);

        const [archived] = await tx
            .update(academicYears)
            .set({ isArchived: true })
            .where(eq(academicYears.id, id))
            .output();

        await auditAYArchive(id, adminId, ay.label, tx);

        return archived;
    });
};

/**
 * Unarchive: transition an archived AY back to unarchived (still locked).
 */
export const unarchiveAcademicYear = async (id: number, adminId: number) => {
    return await db.transaction(async (tx) => {
        const ay = await findAY(id, tx);

        if (!ay.isLocked) throw new ForbiddenError(`Academic year "${ay.label}" must be locked before unarchiving.`, 'AY_NOT_LOCKED');
        if (!ay.isArchived) throw new ConflictError(`Academic year "${ay.label}" is not archived.`);

        const [unarchived] = await tx
            .update(academicYears)
            .set({ isArchived: false })
            .where(eq(academicYears.id, id))
            .output();

        await logAudit({
            action: 'academic_year.unarchive',
            entityType: 'academic_year',
            entityId: id,
            performedById: adminId,
            academicYearId: id,
            details: { label: ay.label },
        }, tx);

        return unarchived;
    });
};

export const deleteAcademicYear = async (id: number, adminId: number) => {
    try {
        await db.transaction(async (tx) => {
            const ay = await findAY(id, tx);
            if (ay.isCurrent) throw new ForbiddenError('Cannot delete the currently active academic year.');

            await tx.delete(academicYears).where(eq(academicYears.id, id));

            await logAudit({
                action: 'academic_year.delete',
                entityType: 'academic_year',
                entityId: id,
                performedById: adminId,
                academicYearId: id,
                details: { label: ay.label },
            }, tx);
        });
    } catch (err: any) {
        if (err?.number === 547 || String(err).includes('REFERENCE constraint')) {
            throw new ConflictError('Cannot delete this academic year because it has linked records (volunteers, events, etc).');
        }
        throw err;
    }
};

// ── Stats ──────────────────────────────────────────────────────────────────────

export const getAcademicYearStats = async (id: number) => {
    await findAY(id); // validates existence

    const [
        [totals],
        deptRows,
        [coreTeamCount],
        [campCount],
        [eventCount]
    ] = await Promise.all([
        db
            .select({
                total: count(),
                regular: sql<number>`SUM(CASE WHEN ${volunteers.status} = 'regular' THEN 1 ELSE 0 END)`,
                backup:  sql<number>`SUM(CASE WHEN ${volunteers.status} = 'backup'  THEN 1 ELSE 0 END)`,
                active:  sql<number>`SUM(CASE WHEN ${volunteers.isActive} = 1    THEN 1 ELSE 0 END)`,
            })
            .from(volunteers)
            .where(eq(volunteers.academicYearId, id)),
        db
            .select({
                department: volunteers.department,
                total:   sql<number>`COUNT(*)`,
                regular: sql<number>`SUM(CASE WHEN ${volunteers.status} = 'regular' THEN 1 ELSE 0 END)`,
            })
            .from(volunteers)
            .where(eq(volunteers.academicYearId, id))
            .groupBy(volunteers.department),
        db
            .select({ n: count() })
            .from(coreTeamAssignments)
            .where(eq(coreTeamAssignments.academicYearId, id)),
        db
            .select({ n: count() })
            .from(specialCamps)
            .where(eq(specialCamps.academicYearId, id)),
        db
            .select({ n: count() })
            .from(events)
            .where(eq(events.academicYearId, id)),
    ]);

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
