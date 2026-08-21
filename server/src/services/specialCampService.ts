import { eq, and, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import {
    specialCamps,
    specialCampParticipants,
    volunteers,
    volunteerProfiles,
    academicYears,
    admins,
} from '../db/schema';
import {
    NotFoundError,
    ConflictError,
    ForbiddenError,
    AYLockedError,
    ValidationError,
} from '../lib/errors';
import { logAudit, auditCampFinalize } from './auditService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const requireUnlockedAY = async (ayId: number) => {
    const [ay] = await db.select().top(1).from(academicYears).where(eq(academicYears.id, ayId));
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);
    if (ay.isLocked) throw new AYLockedError(ay.label);
    return ay;
};

const findCamp = async (campId: number) => {
    const [camp] = await db.select().top(1).from(specialCamps).where(eq(specialCamps.id, campId));
    if (!camp) throw new NotFoundError(`Special camp ${campId} not found.`);
    return camp;
};

const requireEditableCamp = async (campId: number) => {
    const camp = await findCamp(campId);
    if (camp.isFinalized) throw new ForbiddenError('This camp has been finalized and cannot be modified.', 'CAMP_FINALIZED');
    await requireUnlockedAY(camp.academicYearId);
    return camp;
};

// ── List / Query ──────────────────────────────────────────────────────────────

export const listCamps = async (ayId: number) => {
    const [ay] = await db.select({ id: academicYears.id }).top(1).from(academicYears).where(eq(academicYears.id, ayId));
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);
    return db.select().from(specialCamps).where(eq(specialCamps.academicYearId, ayId)).orderBy(specialCamps.startDate);
};

export const getCamp = async (campId: number) => {
    const camp = await findCamp(campId);
    const participants = await db
        .select({
            id: specialCampParticipants.id,
            volunteerId: specialCampParticipants.volunteerId,
            snapName: specialCampParticipants.snapName,
            snapPrnNo: specialCampParticipants.snapPrnNo,
            snapDepartment: specialCampParticipants.snapDepartment,
            snapNssYear: specialCampParticipants.snapNssYear,
            snapCgpa: specialCampParticipants.snapCgpa,
            snapFinalizedAt: specialCampParticipants.snapFinalizedAt,
            // Live volunteer name (may differ from snapshot if updated after finalization)
            currentName: volunteers.name,
            currentDept: volunteers.department,
            collegeYear: volunteerProfiles.collegeYearAtEnrollment,
            nssYear: volunteerProfiles.nssYear,
        })
        .from(specialCampParticipants)
        .leftJoin(volunteers, eq(specialCampParticipants.volunteerId, volunteers.id))
        .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
        .where(eq(specialCampParticipants.specialCampId, campId))
        .orderBy(specialCampParticipants.snapName);

    return { ...camp, participants };
};

// ── Create ────────────────────────────────────────────────────────────────────

export const createCamp = async (
    ayId: number,
    input: { name: string; location: string; startDate: string; endDate: string; description?: string; volunteerCap?: number },
    adminId: number,
) => {
    await requireUnlockedAY(ayId);

    const [camp] = await db.insert(specialCamps).output().values({
        academicYearId: ayId,
        name: input.name,
        location: input.location,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        description: input.description ?? null,
        volunteerCap: input.volunteerCap ?? 50,
        isFinalized: false,
    });

    await logAudit({ action: 'special_camp.create', entityType: 'special_camp', entityId: camp.id, performedById: adminId, academicYearId: ayId });

    return camp;
};

export const updateCamp = async (
    campId: number,
    input: Partial<{ name: string; location: string; startDate: string; endDate: string; description: string; volunteerCap: number }>,
    adminId: number,
) => {
    const camp = await requireEditableCamp(campId);

    const updateData: Partial<typeof specialCamps.$inferInsert> = {
        name: input.name,
        location: input.location,
        description: input.description,
        volunteerCap: input.volunteerCap,
    };
    if (input.startDate) updateData.startDate = new Date(input.startDate);
    if (input.endDate) updateData.endDate = new Date(input.endDate);

    const [updated] = await db
        .update(specialCamps)
        .set(updateData)
        .where(eq(specialCamps.id, campId))
        .output();

    await logAudit({ action: 'special_camp.update', entityType: 'special_camp', entityId: campId, performedById: adminId, academicYearId: camp.academicYearId });

    return updated;
};

export const deleteCamp = async (campId: number, adminId: number) => {
    const camp = await requireEditableCamp(campId);
    await db.delete(specialCamps).where(eq(specialCamps.id, campId));
    await logAudit({ action: 'special_camp.delete', entityType: 'special_camp', entityId: campId, performedById: adminId, academicYearId: camp.academicYearId });
};

// ── Participants ──────────────────────────────────────────────────────────────

export const addParticipant = async (campId: number, volunteerId: number, adminId: number) => {
    const camp = await requireEditableCamp(campId);

    // Volunteer must be regular + active + same AY
    const [vol] = await db
        .select()
        .top(1).from(volunteers)
        .where(and(eq(volunteers.id, volunteerId), eq(volunteers.academicYearId, camp.academicYearId)))
        ;

    if (!vol) throw new NotFoundError(`Volunteer ${volunteerId} is not a member of this academic year's camp.`);
    if (!vol.isActive) throw new ForbiddenError('Inactive volunteers cannot be added to special camps.', 'VOLUNTEER_INACTIVE');
    if (vol.status !== 'regular') throw new ForbiddenError('Only regular volunteers can be added to special camps.', 'NOT_REGULAR');

    // Duplicate check
    const [dup] = await db
        .select({ id: specialCampParticipants.id })
        .top(1).from(specialCampParticipants)
        .where(and(
            eq(specialCampParticipants.specialCampId, campId),
            eq(specialCampParticipants.volunteerId, volunteerId),
        ))
        ;
    if (dup) throw new ConflictError('This volunteer is already added to the camp.');

    // Fetch profile for pre-filling (snapshot written at finalization, not now)
    const [profile] = await db
        .select()
        .top(1).from(volunteerProfiles)
        .where(eq(volunteerProfiles.volunteerId, volunteerId))
        ;

    const [participant] = await db.insert(specialCampParticipants).output().values({
        specialCampId: campId,
        volunteerId,
        // Pre-fill name for display; snapshot columns finalized later
        snapName: profile?.fullName ?? vol.name,
    });

    await logAudit({ action: 'special_camp.add_participant', entityType: 'special_camp', entityId: campId, performedById: adminId, academicYearId: camp.academicYearId, details: { volunteerId } });

    return participant;
};

export const removeParticipant = async (campId: number, participantId: number, adminId: number) => {
    const camp = await requireEditableCamp(campId);
    await db.delete(specialCampParticipants).where(eq(specialCampParticipants.id, participantId));
    await logAudit({ action: 'special_camp.remove_participant', entityType: 'special_camp', entityId: campId, performedById: adminId, academicYearId: camp.academicYearId, details: { participantId } });
};

export const setParticipantsBulk = async (campId: number, volunteerIds: number[], adminId: number) => {
    const camp = await requireEditableCamp(campId);

    if (volunteerIds.length !== camp.volunteerCap) {
        throw new ValidationError(`Exactly ${camp.volunteerCap} volunteers must be selected for this camp.`);
    }

    // Clear existing participants
    await db.delete(specialCampParticipants).where(eq(specialCampParticipants.specialCampId, campId));

    if (volunteerIds.length > 0) {
        // Fetch all selected volunteers to ensure they are regular, active, and from the same AY
        const selectedVols = await db
            .select()
            .from(volunteers)
            .where(
                and(
                    inArray(volunteers.id, volunteerIds),
                    eq(volunteers.academicYearId, camp.academicYearId),
                    eq(volunteers.isActive, true),
                    eq(volunteers.status, 'regular')
                )
            );

        if (selectedVols.length !== volunteerIds.length) {
            throw new ForbiddenError('One or more volunteers are invalid, inactive, or not regular.', 'INVALID_VOLUNTEERS');
        }

        // Fetch profiles for snapName
        const profiles = await db
            .select()
            .from(volunteerProfiles)
            .where(inArray(volunteerProfiles.volunteerId, volunteerIds));
        const profileMap = new Map(profiles.map(p => [p.volunteerId, p]));

        const values = selectedVols.map(vol => ({
            specialCampId: campId,
            volunteerId: vol.id,
            snapName: profileMap.get(vol.id)?.fullName ?? vol.name,
        }));

        await db.insert(specialCampParticipants).output().values(values);
    }

    await logAudit({ action: 'special_camp.set_participants_bulk', entityType: 'special_camp', entityId: campId, performedById: adminId, academicYearId: camp.academicYearId, details: { count: volunteerIds.length } });
};

// ── Finalize (seal snapshot) ──────────────────────────────────────────────────

export const finalizeCamp = async (campId: number, adminId: number) => {
    const camp = await requireEditableCamp(campId);
    const now = new Date();

    // Load all participants with their live volunteer + profile data
    const rows = await db
        .select({
            participantId: specialCampParticipants.id,
            volunteerId: specialCampParticipants.volunteerId,
            volName: volunteers.name,
            prnNo: volunteerProfiles.prnNo,
            department: volunteers.department,
            collegeYear: volunteerProfiles.collegeYearAtEnrollment,
            nssYear: volunteerProfiles.nssYear,
            cgpa: volunteerProfiles.cgpa,
            phoneNo: volunteerProfiles.phoneNo,
        })
        .from(specialCampParticipants)
        .leftJoin(volunteers, eq(specialCampParticipants.volunteerId, volunteers.id))
        .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
        .where(eq(specialCampParticipants.specialCampId, campId));

    // Write snapshot data to each participant record
    for (const row of rows) {
        await db
            .update(specialCampParticipants)
            .set({
                snapName: row.volName ?? 'Unknown',
                snapPrnNo: row.prnNo ?? null,
                snapDepartment: row.department ?? null,
                snapCollegeYearAtEnrollment: row.collegeYear ?? null,
                snapNssYear: row.nssYear ?? null,
                snapCgpa: row.cgpa ?? null,
                snapPhoneNo: row.phoneNo ?? null,
                snapFinalizedAt: now,
            })
            .where(eq(specialCampParticipants.id, row.participantId));
    }

    // Seal the camp
    const [updated] = await db
        .update(specialCamps)
        .set({ isFinalized: true, finalizedAt: now, finalizedById: adminId })
        .where(eq(specialCamps.id, campId)).output();

    await auditCampFinalize(campId, adminId, camp.academicYearId);

    return updated;
};

export const unlockCamp = async (campId: number, passwordStr: string, adminId: number) => {
    const camp = await findCamp(campId);
    if (!camp.isFinalized) throw new ConflictError('Camp is not locked.');
    await requireUnlockedAY(camp.academicYearId);

    const [admin] = await db.select().top(1).from(admins).where(eq(admins.id, adminId));
    if (!admin) throw new NotFoundError('Admin not found.');

    const isValid = await bcrypt.compare(passwordStr, admin.passwordHash);
    if (!isValid) throw new ForbiddenError('Invalid admin password.');

    const [updated] = await db
        .update(specialCamps)
        .set({ isFinalized: false, finalizedAt: null, finalizedById: null })
        .where(eq(specialCamps.id, campId))
        .output();

    await logAudit({ action: 'special_camp.unlock', entityType: 'special_camp', entityId: campId, performedById: adminId, academicYearId: camp.academicYearId });

    return updated;
};
