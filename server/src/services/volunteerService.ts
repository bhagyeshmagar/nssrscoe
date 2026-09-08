import { eq, and, count, ne, sql, like, or, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db';
import {
    volunteers,
    volunteerProfiles,
    academicYears,
    attendanceRecords,
    attendanceSessions,
    events,
    meetingAttendance,
    meetings,
    coreTeamAssignments,
    admins,
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
import { sendVolunteerWelcomeEmail, sendVolunteerBackupEmail, sendVolunteerRegularEmail } from './emailService';

// ── Types ─────────────────────────────────────────────────────────────────────

export const VALID_DEPARTMENTS = [
    'Computer Engineering',
    'Computer Science and Business Systems',
    'Information Technology',
    'Electronics and Telecommunication',
    'Electrical Engineering',
    'Automation and Robotics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Bachelor of Computer Applications'
] as const;

export type Department = typeof VALID_DEPARTMENTS[number];

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
    sortBy?: 'name' | 'department';
    page?: number;
    limit?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateSecurePassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let password = '';
    // Ensure at least one of each type
    password += 'abcdefghijklmnopqrstuvwxyz'[crypto.randomInt(26)];
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[crypto.randomInt(26)];
    password += '0123456789'[crypto.randomInt(10)];
    password += '!@#$%^&*()_+~`|}{[]:;?><,./-='[crypto.randomInt(29)];
    
    for (let i = 4; i < length; i++) {
        password += charset[crypto.randomInt(charset.length)];
    }
    
    const chars = password.split('');
    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
};

/** Resolve AY and enforce it's not locked. Returns the AY record. */
const requireUnlockedAY = async (ayId: number) => {
    const [ay] = await db
        .select()
        .top(1).from(academicYears)
        .where(eq(academicYears.id, ayId))
        ;
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);
    if (ay.isLocked) throw new AYLockedError(ay.label);
    return ay;
};

const findVolunteer = async (id: number) => {
    const [v] = await db.select().top(1).from(volunteers).where(eq(volunteers.id, id));
    if (!v) throw new NotFoundError(`Volunteer ${id} not found.`);
    return v;
};

// ── List / Query ──────────────────────────────────────────────────────────────

export const listVolunteersForAY = async (ayId: number, filters: ListVolunteerFilters = {}) => {
    // Verify AY exists
    const [ay] = await db.select({ id: academicYears.id }).top(1).from(academicYears).where(eq(academicYears.id, ayId));
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);

    const conditions = [eq(volunteers.academicYearId, ayId)];

    if (filters.department) {
        if (!VALID_DEPARTMENTS.includes(filters.department as Department)) {
            throw new ValidationError('Invalid department filter.');
        }
        conditions.push(eq(volunteers.department, filters.department as Department));
    }
    if (filters.status) {
        conditions.push(eq(volunteers.status, filters.status));
    }
    if (filters.isActive !== undefined) {
        conditions.push(eq(volunteers.isActive, filters.isActive));
    }

    if (filters.search) {
        const q = `%${filters.search}%`;
        const searchCondition = or(
            like(volunteers.name, q),
            like(volunteers.email, q),
            like(volunteerProfiles.prnNo, q)
        );
        if (searchCondition) conditions.push(searchCondition);
    }

    const cases = VALID_DEPARTMENTS.map((dept, idx) => `WHEN '${dept}' THEN ${idx + 1}`).join(' ');
    let orderClause: any[] = [volunteers.name];
    if (filters.sortBy === 'department') {
        orderClause = [
            sql.raw(`CASE volunteers.department ${cases} ELSE 99 END`),
            volunteers.name
        ];
    }

    const page = filters.page || 1;
    let limit = filters.limit || 50;
    if (limit > 1000) limit = 1000;

    const countQuery = db
        .select({ count: count() })
        .from(volunteers)
        .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
        .where(and(...conditions));

    const rowsQuery = db
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
            eventsAttendedCount: sql<number>`(
                SELECT count(*)
                FROM ${attendanceRecords}
                WHERE ${attendanceRecords.volunteerId} = ${volunteers.id}
                  AND ${attendanceRecords.status} = 'present'
            )`.as('events_attended_count'),
        })
        .from(volunteers)
        .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
        .where(and(...conditions))
        .orderBy(...orderClause)
        .offset((page - 1) * limit)
        .fetch(limit);

    const [[totalRow], rows] = await Promise.all([countQuery, rowsQuery]);
        
    const total = Number(totalRow.count);

    return {
        data: rows,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getVolunteerById = async (id: number) => {
    const [row] = await db
        .select({
            volunteers: volunteers,
            profile: volunteerProfiles,
            eventsAttendedCount: sql<number>`(
                SELECT count(*)
                FROM ${attendanceRecords}
                WHERE ${attendanceRecords.volunteerId} = ${volunteers.id}
                  AND ${attendanceRecords.status} = 'present'
            )`.as('events_attended_count'),
            isCoreTeam: sql<boolean>`CAST(CASE WHEN EXISTS (
                SELECT 1
                FROM ${coreTeamAssignments}
                WHERE core_team_assignments.volunteer_id = volunteers.id
            ) THEN 1 ELSE 0 END AS BIT)`.as('is_core_team'),
        })
        .top(1).from(volunteers)
        .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
        .where(eq(volunteers.id, id))
        ;
    if (!row) throw new NotFoundError(`Volunteer ${id} not found.`);
    return { ...row.volunteers, profile: row.profile, eventsAttendedCount: row.eventsAttendedCount, isCoreTeam: row.isCoreTeam };
};

export const getMyAttendance = async (volunteerId: number) => {
    const eventAtts = await db.select({
        id: attendanceRecords.id,
        status: attendanceRecords.status,
        date: attendanceSessions.date,
        eventId: events.id,
        title: events.title,
        type: sql<string>`'event'`.as('type'),
        location: events.location,
    }).from(attendanceRecords)
      .innerJoin(attendanceSessions, eq(attendanceRecords.sessionId, attendanceSessions.id))
      .leftJoin(events, eq(attendanceSessions.eventId, events.id))
      .where(eq(attendanceRecords.volunteerId, volunteerId));

    const meetingAtts = await db.select({
        id: meetingAttendance.id,
        status: meetingAttendance.status,
        date: meetings.scheduledDate,
        eventId: meetings.id,
        title: meetings.title,
        type: sql<string>`'meeting'`.as('type'),
        location: meetings.location,
    }).from(meetingAttendance)
      .innerJoin(meetings, eq(meetingAttendance.meetingId, meetings.id))
      .where(eq(meetingAttendance.volunteerId, volunteerId));

    return [...eventAtts, ...meetingAtts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// ── Create ────────────────────────────────────────────────────────────────────

export const createVolunteer = async (
    ayId: number,
    input: CreateVolunteerInput,
    adminId: number,
) => {
    const ay = await requireUnlockedAY(ayId);
    const status = input.status ?? 'regular';

    if (input.password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters.');
    }

    if (!VALID_DEPARTMENTS.includes(input.department)) {
        throw new ValidationError('Invalid department.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const newVol = await db.transaction(async (tx) => {
        // Enforce cap: 100 regular volunteers per AY
        if (status === 'regular') {
            await tx.execute(sql`EXEC sp_getapplock @Resource=${'AY_CAP_' + ayId}, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=5000`);
            const [row] = await tx.select({ n: count() }).from(volunteers).where(and(eq(volunteers.academicYearId, ayId), eq(volunteers.status, 'regular')));
            if (Number(row.n) >= ay.volunteerCap) {
                throw new VolunteerCapExceededError(ay.volunteerCap);
            }
        }

        try {
            const [inserted] = await tx.insert(volunteers).output().values({
                academicYearId: ayId,
                name: input.name.trim(),
                email: input.email.toLowerCase().trim(),
                passwordHash,
                department: input.department,
                status,
                isActive: true,
                createdById: adminId,
            });

            // Create empty profile
            await tx.insert(volunteerProfiles).values({ volunteerId: inserted.id });
            
            await auditVolunteerCreate(inserted.id, adminId, ayId, inserted.name, tx);

            return inserted;
        } catch (err: any) {
            if (err?.number === 2627 || err?.number === 2601) {
                throw new ConflictError(`Email "${input.email}" is already registered.`);
            }
            throw err;
        }
    });

    // Send welcome email with credentials (fire-and-forget, never blocks creation)
    sendVolunteerWelcomeEmail({
        name: newVol.name,
        email: newVol.email,
        password: input.password, // plaintext password before hashing
        department: newVol.department,
    }, adminId).catch(e => console.error('[createVolunteer] welcome email error:', e));

    return newVol;
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateVolunteer = async (id: number, input: UpdateVolunteerInput, adminId: number) => {
    const vol = await findVolunteer(id);
    await requireUnlockedAY(vol.academicYearId);

    try {
        return await db.transaction(async (tx) => {
            const [updated] = await tx
                .update(volunteers)
                .set({
                    ...(input.name && { name: input.name.trim() }),
                    ...(input.email && { email: input.email.toLowerCase().trim() }),
                    ...(input.department && { department: input.department }),
                    updatedAt: new Date(),
                })
                .where(eq(volunteers.id, id)).output();

            await logAudit({ action: 'volunteer.update', entityType: 'volunteer', entityId: id, performedById: adminId, academicYearId: vol.academicYearId, details: { ...input } }, tx);
            return updated;
        });
    } catch (err: any) {
        if (err?.number === 2627 || err?.number === 2601) {
            throw new ConflictError(`Email "${input.email}" is already registered.`);
        }
        throw err;
    }
};


/** Update the volunteer's own profile fields (not auth fields). */
export const updateVolunteerProfile = async (volunteerId: number, profileData: Record<string, unknown>) => {
    const vol = await findVolunteer(volunteerId);
    await requireUnlockedAY(vol.academicYearId);

    const allowedFields = [
        'fullName', 'prnNo', 'collegeYearAtEnrollment', 'nssYear', 'marksheetUrl',
        'cgpa', 'eligibilityNo', 'religion', 'caste', 'casteCategory',
        'phoneNo', 'emailId', 'profilePhotoUrl', 'experienceText',
    ];

    const [existingProfile] = await db
        .select()
        .from(volunteerProfiles)
        .where(eq(volunteerProfiles.volunteerId, volunteerId));

    const profileUpdate: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of allowedFields) {
        if (field in profileData) profileUpdate[field] = profileData[field];
    }

    if (
        profileData.experienceText !== undefined &&
        profileData.experienceText !== existingProfile?.experienceText
    ) {
        profileUpdate.isExperienceApproved = false;
    }

    return await db.transaction(async (tx) => {
        if (profileData.department) {
            profileUpdate.department = profileData.department;
            await tx
                .update(volunteers)
                .set({ department: profileData.department as Department })
                .where(eq(volunteers.id, volunteerId));
        }

        const [updated] = await tx
            .update(volunteerProfiles)
            .set(profileUpdate)
            .where(eq(volunteerProfiles.volunteerId, volunteerId))
            .output();
            
        let finalProfile;
        if (updated) {
            finalProfile = { ...updated, department: profileData.department };
        } else {
            const [newProfile] = await tx
                .insert(volunteerProfiles)
                .output().values({ volunteerId, ...profileUpdate });
            finalProfile = { ...newProfile, department: profileData.department };
        }

        await logAudit({
            action: 'volunteer.update_profile',
            entityType: 'volunteer',
            entityId: volunteerId,
            performedById: volunteerId, // usually done by self
            academicYearId: vol.academicYearId,
            details: profileData,
        }, tx);

        return finalProfile;
    });
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

    const updated = await db.transaction(async (tx) => {
        if (newStatus === 'regular') {
            await tx.execute(sql`EXEC sp_getapplock @Resource=${'AY_CAP_' + vol.academicYearId}, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=5000`);
            const [row] = await tx.select({ n: count() }).from(volunteers).where(and(eq(volunteers.academicYearId, vol.academicYearId), eq(volunteers.status, 'regular')));
            if (Number(row.n) >= ay.volunteerCap) {
                throw new VolunteerCapExceededError(ay.volunteerCap);
            }
        }

        const [res] = await tx
            .update(volunteers)
            .set({ status: newStatus, updatedAt: new Date() })
            .where(eq(volunteers.id, id))
            .output();
            
        await logAudit({ action: 'volunteer.status_change', entityType: 'volunteer', entityId: id, performedById: adminId, academicYearId: vol.academicYearId, details: { from: vol.status, to: newStatus } }, tx);
        
        return res;
    });

    // Notify the volunteer if they've been moved to backup status
    if (newStatus === 'backup') {
        sendVolunteerBackupEmail({
            name: vol.name,
            email: vol.email,
            department: vol.department,
        }, adminId).catch(e => console.error('[changeVolunteerStatus] backup email error:', e));
    } else if (newStatus === 'regular' && vol.status === 'backup') {
        sendVolunteerRegularEmail({
            name: vol.name,
            email: vol.email,
            department: vol.department,
        }, adminId).catch(e => console.error('[changeVolunteerStatus] regular email error:', e));
    }

    return updated;
};

export const toggleVolunteerActive = async (id: number, adminId: number) => {
    const vol = await findVolunteer(id);
    await requireUnlockedAY(vol.academicYearId);

    return await db.transaction(async (tx) => {
        const [updated] = await tx
            .update(volunteers)
            .set({ isActive: !vol.isActive, updatedAt: new Date() })
            .where(eq(volunteers.id, id))
            .output();

        await logAudit({ action: 'volunteer.toggle_active', entityType: 'volunteer', entityId: id, performedById: adminId, academicYearId: vol.academicYearId, details: { isActive: updated.isActive } }, tx);

        return updated;
    });
};

export const deleteVolunteer = async (id: number, adminId: number, passwordStr?: string) => {
    const vol = await findVolunteer(id);
    await requireUnlockedAY(vol.academicYearId);

    // Verify admin is superadmin and password is correct
    const [admin] = await db.select().top(1).from(admins).where(eq(admins.id, adminId));
    if (!admin) throw new NotFoundError('Admin not found.');
    if (!admin.isSuperadmin) {
        throw new ForbiddenError('Only superadmins can permanently delete volunteers.');
    }
    if (!passwordStr) {
        throw new ValidationError('Superadmin password is required for this action.');
    }
    const isValid = await bcrypt.compare(passwordStr, admin.passwordHash);
    if (!isValid) {
        throw new ForbiddenError('Invalid superadmin password.');
    }

    return await db.transaction(async (tx) => {
        // Since we are doing a hard delete, we delete from volunteer_profiles first (cascade should handle it, but just to be safe if cascade isn't set up on all related tables).
        // Actually, let's just delete the volunteer, and foreign keys with ON DELETE CASCADE will handle it, or we manually delete if needed.
        // Wait, schema.ts says volunteerId on volunteerProfiles has onDelete: 'cascade'.
        await tx.delete(volunteers).where(eq(volunteers.id, id));

        await logAudit({ action: 'volunteer.hard_delete', entityType: 'volunteer', entityId: id, performedById: adminId, academicYearId: vol.academicYearId }, tx);
    });
};

export const approveVolunteerExperience = async (volunteerId: number, adminId: number) => {
    const vol = await findVolunteer(volunteerId);
    await requireUnlockedAY(vol.academicYearId);
    
    return await db.transaction(async (tx) => {
        const [updatedProfile] = await tx
            .update(volunteerProfiles)
            .set({ isExperienceApproved: true, updatedAt: new Date() })
            .where(eq(volunteerProfiles.volunteerId, volunteerId))
            .output();
            
        await logAudit({ 
            action: 'volunteer.approve_experience', 
            entityType: 'volunteer', 
            entityId: volunteerId, 
            performedById: adminId, 
            academicYearId: vol.academicYearId 
        }, tx);

        return updatedProfile;
    });
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

    if (input.sourceVolunteerIds.length === 0) return results;

    await db.transaction(async (tx) => {
        if (defaultStatus === 'regular') {
            await tx.execute(sql`EXEC sp_getapplock @Resource=${'AY_CAP_' + input.targetAyId}, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=5000`);
        }
        
        let currentCap = 0;
        if (defaultStatus === 'regular') {
            const [row] = await tx.select({ n: count() }).from(volunteers).where(and(eq(volunteers.academicYearId, input.targetAyId), eq(volunteers.status, 'regular')));
            currentCap = Number(row.n);
        }

        const [existingEmailsData] = await Promise.all([
            tx.select({ email: volunteers.email }).from(volunteers).where(eq(volunteers.academicYearId, input.targetAyId))
        ]);
        const existingEmails = new Set(existingEmailsData.map(r => r.email));

        const sources = await tx.select({
            volunteers: volunteers,
            profile: volunteerProfiles,
        }).from(volunteers)
        .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
        .where(inArray(volunteers.id, input.sourceVolunteerIds));

        // Create a map to quickly look up missing sources
        const sourceIdsFound = new Set(sources.map(s => s.volunteers.id));
        input.sourceVolunteerIds.forEach(id => {
            if (!sourceIdsFound.has(id)) {
                results.errors.push(`Volunteer ${id}: not found`);
            }
        });

        const validSources = [];
        for (const s of sources) {
            if (existingEmails.has(s.volunteers.email)) {
                results.skipped.push(`${s.volunteers.name} — already in target AY`);
            } else {
                validSources.push(s);
            }
        }

        if (defaultStatus === 'regular' && validSources.length + currentCap > targetAy.volunteerCap) {
            const toKeep = Math.max(0, targetAy.volunteerCap - currentCap);
            validSources.slice(toKeep).forEach(s => results.skipped.push(`${s.volunteers.name} — cap reached`));
            validSources.splice(toKeep);
        }

        if (validSources.length > 0) {
            const volsToInsert = await Promise.all(validSources.map(async (s) => {
                const password = input.resetPassword ?? generateSecurePassword();
                const passwordHash = await bcrypt.hash(password, 10);
                return {
                    academicYearId: input.targetAyId,
                    name: s.volunteers.name,
                    email: s.volunteers.email,
                    passwordHash,
                    department: s.volunteers.department,
                    status: defaultStatus,
                    isActive: true,
                    createdById: adminId,
                };
            }));

            const insertedVols = await tx.insert(volunteers).output().values(volsToInsert);
            
            // Map inserted volunteers by email to attach profiles correctly
            const insertedMap = new Map(insertedVols.map((v: any) => [v.email, v.id]));
            
            const profilesToInsert = validSources.map(s => {
                const newVolId = insertedMap.get(s.volunteers.email)!;
                if (s.profile) {
                    const { volunteerId: _, id: __, updatedAt: ___, ...profileCopy } = s.profile as Record<string, unknown>;
                    return {
                        volunteerId: newVolId,
                        ...(profileCopy as Partial<typeof volunteerProfiles.$inferInsert>),
                    };
                } else {
                    return { volunteerId: newVolId };
                }
            });

            if (profilesToInsert.length > 0) {
                await tx.insert(volunteerProfiles).values(profilesToInsert);
            }

            results.imported.push(...validSources.map(s => s.volunteers.name));
        }

        await logAudit({ action: 'volunteer.import', entityType: 'academic_year', entityId: input.targetAyId, performedById: adminId, academicYearId: input.targetAyId, details: { count: results.imported.length, skipped: results.skipped.length } }, tx);
    });

    return results;
};

// ── Password ──────────────────────────────────────────────────────────────────

export const changePassword = async (volunteerId: number, currentPassword: string, newPassword: string) => {
    const [vol] = await db.select().top(1).from(volunteers).where(eq(volunteers.id, volunteerId));
    if (!vol) throw new NotFoundError('Volunteer not found.');

    const valid = await bcrypt.compare(currentPassword, vol.passwordHash);
    if (!valid) throw new ValidationError('Current password is incorrect.');

    if (newPassword.length < 8) throw new ValidationError('New password must be at least 8 characters.');

    const hash = await bcrypt.hash(newPassword, 10);
    await db.update(volunteers).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(volunteers.id, volunteerId));
};
