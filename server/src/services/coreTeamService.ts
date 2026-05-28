import { eq, and, count } from 'drizzle-orm';
import { db } from '../db';
import {
    coreTeamAssignments,
    coreTeamRoles,
    volunteers,
    volunteerProfiles,
    academicYears,
} from '../db/schema';
import {
    NotFoundError,
    ConflictError,
    ForbiddenError,
    ValidationError,
    RoleAssignmentError,
    AYLockedError,
} from '../lib/errors';
import { logAudit } from './auditService';

// ── Role codes (fixed constants matching core_team_roles.code) ────────────────

export const ROLE_CODES = {
    PRINCIPAL: 'principal',
    NSS_PO: 'nss_program_officer',
    BOYS_REP: 'boys_representative',
    GIRLS_REP: 'girls_representative',
    DEPT_COORDINATOR: 'department_coordinator',
} as const;

const INSTITUTION_ROLES = new Set<string>([ROLE_CODES.PRINCIPAL, ROLE_CODES.NSS_PO]);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AssignRoleInput {
    coreTeamRoleId: number;
    // Student roles
    volunteerId?: number;
    // Institution roles
    displayName?: string;
    displayPhotoUrl?: string;
    // Department coordinator only
    department?: string;
    displayOrder?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const requireUnlockedAY = async (ayId: number) => {
    const [ay] = await db.select().from(academicYears).where(eq(academicYears.id, ayId)).limit(1);
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);
    if (ay.isLocked) throw new AYLockedError(ay.label);
    return ay;
};

// ── Queries ───────────────────────────────────────────────────────────────────

export const getCoreTeamByAY = async (ayId: number) => {
    const [ay] = await db.select({ id: academicYears.id }).from(academicYears).where(eq(academicYears.id, ayId)).limit(1);
    if (!ay) throw new NotFoundError(`Academic year ${ayId} not found.`);

    const rows = await db
        .select({
            assignmentId: coreTeamAssignments.id,
            academicYearId: coreTeamAssignments.academicYearId,
            displayName: coreTeamAssignments.displayName,
            displayPhotoUrl: coreTeamAssignments.displayPhotoUrl,
            department: coreTeamAssignments.department,
            displayOrder: coreTeamAssignments.displayOrder,
            createdAt: coreTeamAssignments.createdAt,
            // Role
            roleId: coreTeamRoles.id,
            roleName: coreTeamRoles.name,
            roleCode: coreTeamRoles.code,
            roleType: coreTeamRoles.roleType,
            roleDisplayOrder: coreTeamRoles.displayOrder,
            // Volunteer (if student role)
            volunteerId: volunteers.id,
            volunteerName: volunteers.name,
            volunteerDepartment: volunteers.department,
            volunteerStatus: volunteers.status,
            // Profile
            profilePhotoUrl: volunteerProfiles.profilePhotoUrl,
            fullName: volunteerProfiles.fullName,
        })
        .from(coreTeamAssignments)
        .innerJoin(coreTeamRoles, eq(coreTeamAssignments.coreTeamRoleId, coreTeamRoles.id))
        .leftJoin(volunteers, eq(coreTeamAssignments.volunteerId, volunteers.id))
        .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
        .where(eq(coreTeamAssignments.academicYearId, ayId))
        .orderBy(coreTeamRoles.displayOrder, coreTeamAssignments.displayOrder);

    return rows.map(r => ({
        id: r.assignmentId,
        academicYearId: r.academicYearId,
        role: {
            id: r.roleId,
            name: r.roleName,
            code: r.roleCode,
            type: r.roleType,
            displayOrder: r.roleDisplayOrder,
        },
        volunteer: r.volunteerId ? {
            id: r.volunteerId,
            name: r.volunteerName,
            department: r.volunteerDepartment,
            status: r.volunteerStatus,
            photoUrl: r.profilePhotoUrl ?? null,
        } : null,
        displayName: r.displayName,
        displayPhotoUrl: r.displayPhotoUrl,
        department: r.department,
        displayOrder: r.displayOrder,
        createdAt: r.createdAt,
    }));
};

export const getAllRoles = async () =>
    db.select().from(coreTeamRoles).orderBy(coreTeamRoles.displayOrder);

// ── Assign ────────────────────────────────────────────────────────────────────

export const assignRole = async (ayId: number, input: AssignRoleInput, adminId: number) => {
    const ay = await requireUnlockedAY(ayId);

    // Resolve the role definition
    const [role] = await db
        .select()
        .from(coreTeamRoles)
        .where(eq(coreTeamRoles.id, input.coreTeamRoleId))
        .limit(1);
    if (!role) throw new NotFoundError(`Core team role ${input.coreTeamRoleId} not found.`);

    const isInstitution = INSTITUTION_ROLES.has(role.code);

    // ── Validate by role type ──────────────────────────────────────────────────

    if (isInstitution) {
        // Institution roles: no volunteer, displayName required
        if (input.volunteerId != null) {
            throw new RoleAssignmentError(`Role "${role.name}" is an institution role. Do not provide a volunteerId.`);
        }
        if (!input.displayName?.trim()) {
            throw new RoleAssignmentError(`displayName is required for institution role "${role.name}".`);
        }
    } else {
        // Student roles: volunteerId required
        if (!input.volunteerId) {
            throw new RoleAssignmentError(`volunteerId is required for role "${role.name}".`);
        }

        // Verify the volunteer belongs to this AY and is active
        const [vol] = await db
            .select()
            .from(volunteers)
            .where(and(eq(volunteers.id, input.volunteerId), eq(volunteers.academicYearId, ayId)))
            .limit(1);

        if (!vol) {
            throw new RoleAssignmentError(`Volunteer ${input.volunteerId} is not a member of academic year "${ay.label}".`);
        }
        if (!vol.isActive) {
            throw new RoleAssignmentError(`Volunteer "${vol.name}" is inactive and cannot be assigned to the core team.`);
        }
        if (vol.status !== 'regular') {
            throw new RoleAssignmentError(`Only regular volunteers can be assigned to the core team. "${vol.name}" is a backup volunteer.`);
        }

        // ── Department coordinator: extra constraints ─────────────────────────
        if (role.code === ROLE_CODES.DEPT_COORDINATOR) {
            if (!input.department) {
                throw new RoleAssignmentError('department is required when assigning a department_coordinator role.');
            }
            if (vol.department !== input.department) {
                throw new RoleAssignmentError(
                    `Volunteer "${vol.name}" belongs to "${vol.department}" but the coordinator position is for "${input.department}".`,
                );
            }
            // One coordinator per department per AY
            const [existing] = await db
                .select({ id: coreTeamAssignments.id })
                .from(coreTeamAssignments)
                .where(and(
                    eq(coreTeamAssignments.academicYearId, ayId),
                    eq(coreTeamAssignments.coreTeamRoleId, role.id),
                    eq(coreTeamAssignments.department, input.department),
                ))
                .limit(1);
            if (existing) {
                throw new ConflictError(`A department coordinator for "${input.department}" is already assigned in academic year "${ay.label}".`);
            }
        } else {
            // Non-coordinator student roles
            if (role.isUniquePerAy) {
                const [existing] = await db
                    .select({ id: coreTeamAssignments.id })
                    .from(coreTeamAssignments)
                    .where(and(
                        eq(coreTeamAssignments.academicYearId, ayId),
                        eq(coreTeamAssignments.coreTeamRoleId, role.id),
                    ))
                    .limit(1);
                if (existing) {
                    throw new ConflictError(`Role "${role.name}" is already assigned in academic year "${ay.label}".`);
                }
            }

            // A volunteer can only hold one role per AY
            const [alreadyAssigned] = await db
                .select({ id: coreTeamAssignments.id })
                .from(coreTeamAssignments)
                .where(and(
                    eq(coreTeamAssignments.academicYearId, ayId),
                    eq(coreTeamAssignments.volunteerId, input.volunteerId),
                ))
                .limit(1);
            if (alreadyAssigned) {
                throw new ConflictError(`This volunteer already holds a core team role in academic year "${ay.label}".`);
            }
        }
    }

    // ── Insert assignment ──────────────────────────────────────────────────────
    const [assignment] = await db.insert(coreTeamAssignments).values({
        academicYearId: ayId,
        coreTeamRoleId: role.id,
        volunteerId: input.volunteerId ?? null,
        displayName: input.displayName ?? null,
        displayPhotoUrl: input.displayPhotoUrl ?? null,
        department: input.department ?? null,
        displayOrder: input.displayOrder ?? 0,
    }).returning();

    await logAudit({
        action: 'core_team.assign',
        entityType: 'core_team_assignment',
        entityId: assignment.id,
        performedById: adminId,
        academicYearId: ayId,
        details: { roleCode: role.code, volunteerId: input.volunteerId, department: input.department },
    });

    return assignment;
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateAssignment = async (assignmentId: number, input: Partial<AssignRoleInput>, adminId: number) => {
    const [existing] = await db
        .select()
        .from(coreTeamAssignments)
        .where(eq(coreTeamAssignments.id, assignmentId))
        .limit(1);
    if (!existing) throw new NotFoundError(`Core team assignment ${assignmentId} not found.`);

    await requireUnlockedAY(existing.academicYearId);

    const [updated] = await db
        .update(coreTeamAssignments)
        .set({
            ...(input.displayName !== undefined && { displayName: input.displayName }),
            ...(input.displayPhotoUrl !== undefined && { displayPhotoUrl: input.displayPhotoUrl }),
            ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
        })
        .where(eq(coreTeamAssignments.id, assignmentId))
        .returning();

    await logAudit({ action: 'core_team.update', entityType: 'core_team_assignment', entityId: assignmentId, performedById: adminId, academicYearId: existing.academicYearId });

    return updated;
};

// ── Remove ────────────────────────────────────────────────────────────────────

export const removeAssignment = async (assignmentId: number, adminId: number) => {
    const [existing] = await db
        .select()
        .from(coreTeamAssignments)
        .where(eq(coreTeamAssignments.id, assignmentId))
        .limit(1);
    if (!existing) throw new NotFoundError(`Core team assignment ${assignmentId} not found.`);

    await requireUnlockedAY(existing.academicYearId);

    await db.delete(coreTeamAssignments).where(eq(coreTeamAssignments.id, assignmentId));

    await logAudit({ action: 'core_team.remove', entityType: 'core_team_assignment', entityId: assignmentId, performedById: adminId, academicYearId: existing.academicYearId });
};
