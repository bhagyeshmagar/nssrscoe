import { eq, and, count, ne, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import {
    volunteers,
    volunteerProfiles,
    academicYears,
} from '../db/schema';
import {
    NotFoundError,
    ConflictError,
    ValidationError,
    ForbiddenError,
    AYLockedError,
    VolunteerCapExceededError,
} from '../lib/errors';
import { logAudit, auditVolunteerCreate } from './auditService';

// ── Types ─────────────────────────────────────────────────────────────────────

type Department =
    | 'Computer Engineering'
    | 'Computer Science and Business Systems'
    | 'Information Technology'
    | 'Electronics and Telecommunication'
    | 'Electrical Engineering'
    | 'Automation and Robotics'
    | 'Mechanical Engineering'
    | 'Civil Engineering'
    | 'Bachelor of Computer Applications';

export interface CreateVolunteerInput {
    name: string;
    email: string;
    password: string;
    department: Department;
    status?: 'regular' | 'backup';
}

export interface UpdateVolunteerInput {
    name?: string;
    email?: string;
    department?: Department;
}

export interface ListVolunteerFilters {
    department?: string;
    status?: 'regular' | 'backup';
    isActive?: boolean;
    search?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve AY and enforce it's not locked. Returns the AY record. */
const requireUnlockedAY = async (ayId: number) => {
    const [ay] = await db
        .select()
        .from(academicYears)
        .where(eq(academicYears.id, ayId))
        .limit(1);
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);
    if (ay.isLocked) throw new AYLockedError(ay.label);
    return ay;
};

/** Count regular volunteers in an AY (for cap enforcement). */
const countRegularVolunteers = async (ayId: number): Promise<number> => {
    const [row] = await db
        .select({ n: count() })
        .from(volunteers)
        .where(and(eq(volunteers.academicYearId, ayId), eq(volunteers.status, 'regular')));
    return Number(row.n);
};

const findVolunteer = async (id: number) => {
    const [v] = await db.select().from(volunteers).where(eq(volunteers.id, id)).limit(1);
    if (!v) throw new NotFoundError(`Volunteer ${id} not found.`);
    return v;
};

// ── List / Query ──────────────────────────────────────────────────────────────

export const listVolunteersForAY = async (ayId: number, filters: ListVolunteerFilters = {}) => {
    // Verify AY exists
    const [ay] = await db.select({ id: academicYears.id }).from(academicYears).where(eq(academicYears.id, ayId)).limit(1);
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);

    const conditions = [eq(volunteers.academicYearId, ayId)];

    if (filters.department) {
        conditions.push(eq(volunteers.department, filters.department as Department));
    }
    if (filters.status) {
        conditions.push(eq(volunteers.status, filters.status));
    }
    if (filters.isActive !== undefined) {
        conditions.push(eq(volunteers.isActive, filters.isActive));
    }

    const rows = await db
        .select({
            id: volunteers.id,
            name: volunteers.name,
            email: volunteers.email,
            department: volunteers.department,
            status: volunteers.status,
            isActive: volunteers.isActive,
            academicYearId: volunteers.academicYearId,
            createdAt: volunteers.createdAt,
            // Full profile needed by admin dashboard modal
            profile: volunteerProfiles,
        })
        .from(volunteers)
        .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
        .where(and(...conditions))
        .orderBy(volunteers.name);

    // Client-side search filter (across name, email, prnNo)
    if (filters.search) {
        const q = filters.search.toLowerCase();
        return rows.filter(
            r =>
                r.name.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                (r.profile?.prnNo ?? '').toLowerCase().includes(q),
        );
    }

    return rows;
};

export const getVolunteerById = async (id: number) => {
    const [row] = await db
        .select()
        .from(volunteers)
        .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
        .where(eq(volunteers.id, id))
        .limit(1);
    if (!row) throw new NotFoundError(`Volunteer ${id} not found.`);
    return { ...row.volunteers, profile: row.volunteer_profiles };
};

// ── Create ────────────────────────────────────────────────────────────────────

export const createVolunteer = async (
    ayId: number,
    input: CreateVolunteerInput,
    adminId: number,
) => {
    const ay = await requireUnlockedAY(ayId);
    const status = input.status ?? 'regular';

    // Enforce cap: 100 regular volunteers per AY
    if (status === 'regular') {
        const current = await countRegularVolunteers(ayId);
        if (current >= ay.volunteerCap) {
            throw new VolunteerCapExceededError(ay.volunteerCap);
        }
    }

    if (input.password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters.');
    }

    // Email uniqueness across entire system
    const [existing] = await db
        .select({ id: volunteers.id })
        .from(volunteers)
        .where(eq(volunteers.email, input.email.toLowerCase().trim()))
        .limit(1);
    if (existing) throw new ConflictError(`Email "${input.email}" is already registered.`);

    const passwordHash = await bcrypt.hash(input.password, 10);

    const [newVol] = await db.insert(volunteers).values({
        academicYearId: ayId,
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        passwordHash,
        department: input.department,
        status,
        isActive: true,
        createdById: adminId,
    }).returning();

    // Create empty profile
    await db.insert(volunteerProfiles).values({ volunteerId: newVol.id });

    await auditVolunteerCreate(newVol.id, adminId, ayId, newVol.name);

    return newVol;
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateVolunteer = async (id: number, input: UpdateVolunteerInput, adminId: number) => {
    const vol = await findVolunteer(id);
    await requireUnlockedAY(vol.academicYearId);

    if (input.email && input.email !== vol.email) {
        const [dup] = await db
            .select({ id: volunteers.id })
            .from(volunteers)
            .where(and(eq(volunteers.email, input.email), ne(volunteers.id, id)))
            .limit(1);
        if (dup) throw new ConflictError(`Email "${input.email}" is already registered.`);
    }

    const [updated] = await db
        .update(volunteers)
        .set({
            ...(input.name && { name: input.name.trim() }),
            ...(input.email && { email: input.email.toLowerCase().trim() }),
            ...(input.department && { department: input.department }),
            updatedAt: new Date(),
        })
        .where(eq(volunteers.id, id))
        .returning();

    await logAudit({ action: 'volunteer.update', entityType: 'volunteer', entityId: id, performedById: adminId, academicYearId: vol.academicYearId, details: input as unknown as Record<string, unknown> });

    return updated;
};

/** Update the volunteer's own profile fields (not auth fields). */
export const updateVolunteerProfile = async (volunteerId: number, profileData: Record<string, unknown>) => {
    const vol = await findVolunteer(volunteerId);
    const ay = await db.select({ isLocked: academicYears.isLocked, label: academicYears.label }).from(academicYears).where(eq(academicYears.id, vol.academicYearId)).limit(1);
    if (ay[0]?.isLocked) throw new AYLockedError(ay[0]?.label);

    const allowedFields = [
        'fullName', 'prnNo', 'collegeYearAtEnrollment', 'nssYear', 'marksheetUrl',
        'cgpa', 'eligibilityNo', 'religion', 'caste', 'casteCategory',
        'phoneNo', 'emailId', 'profilePhotoUrl', 'experienceText',
    ];

    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of allowedFields) {
        if (field in profileData) update[field] = profileData[field];
    }

    if (profileData.department) {
        update.department = profileData.department;
        await db
            .update(volunteers)
            .set({ department: profileData.department as any })
            .where(eq(volunteers.id, volunteerId));
    }

    const [updated] = await db
        .update(volunteerProfiles)
        .set(update)
        .where(eq(volunteerProfiles.volunteerId, volunteerId))
        .returning();

    if (!updated) {
        // Profile row doesn't exist yet — create it
        const [newProfile] = await db
            .insert(volunteerProfiles)
            .values({ volunteerId, ...update })
            .returning();
        return { ...newProfile, department: profileData.department };
    }

    return { ...updated, department: profileData.department };
};

// ── Status changes ────────────────────────────────────────────────────────────

export const changeVolunteerStatus = async (
    id: number,
    newStatus: 'regular' | 'backup',
    adminId: number,
) => {
    const vol = await findVolunteer(id);
    const ay = await requireUnlockedAY(vol.academicYearId);

    if (vol.status === newStatus) {
        throw new ConflictError(`Volunteer is already "${newStatus}".`);
    }

    // Moving to regular: check cap
    if (newStatus === 'regular') {
        const current = await countRegularVolunteers(vol.academicYearId);
        if (current >= ay.volunteerCap) {
            throw new VolunteerCapExceededError(ay.volunteerCap);
        }
    }

    const [updated] = await db
        .update(volunteers)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(volunteers.id, id))
        .returning();

    await logAudit({ action: 'volunteer.status_change', entityType: 'volunteer', entityId: id, performedById: adminId, academicYearId: vol.academicYearId, details: { from: vol.status, to: newStatus } });

    return updated;
};

export const toggleVolunteerActive = async (id: number, adminId: number) => {
    const vol = await findVolunteer(id);
    await requireUnlockedAY(vol.academicYearId);

    const [updated] = await db
        .update(volunteers)
        .set({ isActive: !vol.isActive, updatedAt: new Date() })
        .where(eq(volunteers.id, id))
        .returning();

    await logAudit({ action: 'volunteer.toggle_active', entityType: 'volunteer', entityId: id, performedById: adminId, academicYearId: vol.academicYearId, details: { isActive: updated.isActive } });

    return updated;
};

export const deleteVolunteer = async (id: number, adminId: number) => {
    const vol = await findVolunteer(id);
    await requireUnlockedAY(vol.academicYearId);

    await db.delete(volunteers).where(eq(volunteers.id, id));

    await logAudit({ action: 'volunteer.delete', entityType: 'volunteer', entityId: id, performedById: adminId, academicYearId: vol.academicYearId, details: { name: vol.name, email: vol.email } });
};

// ── Import from previous AY ───────────────────────────────────────────────────

export interface ImportVolunteerInput {
    sourceVolunteerIds: number[];
    targetAyId: number;
    defaultStatus?: 'regular' | 'backup';
    resetPassword?: string; // if provided, all imported volunteers get this pw
}

export const importVolunteersFromAY = async (input: ImportVolunteerInput, adminId: number) => {
    const targetAy = await requireUnlockedAY(input.targetAyId);
    const defaultStatus = input.defaultStatus ?? 'regular';

    const results: { imported: string[]; skipped: string[]; errors: string[] } = {
        imported: [],
        skipped: [],
        errors: [],
    };

    for (const sourceId of input.sourceVolunteerIds) {
        try {
            const source = await getVolunteerById(sourceId);

            // Check cap before each regular import
            if (defaultStatus === 'regular') {
                const current = await countRegularVolunteers(input.targetAyId);
                if (current >= targetAy.volunteerCap) {
                    results.skipped.push(`${source.name} — cap reached`);
                    continue;
                }
            }

            // Check if this email already exists in target AY
            const [dup] = await db
                .select({ id: volunteers.id })
                .from(volunteers)
                .where(and(eq(volunteers.email, source.email), eq(volunteers.academicYearId, input.targetAyId)))
                .limit(1);

            if (dup) {
                results.skipped.push(`${source.name} — already in target AY`);
                continue;
            }

            const password = input.resetPassword ?? Math.random().toString(36).slice(-8);
            const passwordHash = await bcrypt.hash(password, 10);

            const [newVol] = await db.insert(volunteers).values({
                academicYearId: input.targetAyId,
                name: source.name,
                email: source.email,
                passwordHash,
                department: source.department,
                status: defaultStatus,
                isActive: true,
                createdById: adminId,
            }).returning();

            // Copy profile data
            if (source.profile) {
                const { volunteerId: _, id: __, updatedAt: ___, ...profileCopy } = source.profile as Record<string, unknown>;
                await db.insert(volunteerProfiles).values({
                    volunteerId: newVol.id,
                    ...(profileCopy as Partial<typeof volunteerProfiles.$inferInsert>),
                });
            } else {
                await db.insert(volunteerProfiles).values({ volunteerId: newVol.id });
            }

            results.imported.push(source.name);
        } catch (err) {
            results.errors.push(`Volunteer ${sourceId}: ${err instanceof Error ? err.message : 'unknown error'}`);
        }
    }

    await logAudit({ action: 'volunteer.import', entityType: 'academic_year', entityId: input.targetAyId, performedById: adminId, academicYearId: input.targetAyId, details: { count: results.imported.length, skipped: results.skipped.length } });

    return results;
};

// ── Password ──────────────────────────────────────────────────────────────────

export const changePassword = async (volunteerId: number, currentPassword: string, newPassword: string) => {
    const [vol] = await db.select().from(volunteers).where(eq(volunteers.id, volunteerId)).limit(1);
    if (!vol) throw new NotFoundError('Volunteer not found.');

    const valid = await bcrypt.compare(currentPassword, vol.passwordHash);
    if (!valid) throw new ValidationError('Current password is incorrect.');

    if (newPassword.length < 6) throw new ValidationError('New password must be at least 6 characters.');

    const hash = await bcrypt.hash(newPassword, 10);
    await db.update(volunteers).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(volunteers.id, volunteerId));
};
