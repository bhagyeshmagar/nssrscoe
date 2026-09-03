/**
 * Members Controller
 *
 * NOTE: The old `coreMembers` flat table has been replaced by `core_team_roles`
 * + `core_team_assignments` in the new schema. This controller is retained as a
 * thin compatibility shim that reads from `core_team_assignments` joined with
 * `core_team_roles` and returns data in the same shape the /members page expects.
 *
 * Full CRUD for the new structure will live in coreTeamController.ts once
 * the admin UI is updated. For now, write operations (POST/PUT/DELETE) remain
 * on the legacy endpoint so the existing admin dashboard keeps working.
 */
import { Request, Response } from 'express';
import { db } from '../db';
import { coreTeamAssignments, coreTeamRoles, academicYears, volunteers, volunteerProfiles } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { ok, created, noContent, handleError } from '../lib/response';
import { ValidationError } from '../lib/errors';
import { positiveIntParam } from '../lib/schemas';
import { z } from 'zod';

const createMemberSchema = z.object({
    coreTeamRoleId: z.coerce.number().int().positive().optional(),
    volunteerId: z.coerce.number().int().positive().nullish(),
    displayName: z.string().trim().nullish(),
    displayPhotoUrl: z.string().trim().nullish(),
    name: z.string().trim().nullish(),
    role: z.string().trim().nullish(),
    photoUrl: z.string().trim().nullish(),
    order: z.coerce.number().int().nullish(),
});

const updateMemberSchema = z.object({
    volunteerId: z.coerce.number().int().positive().nullish(),
    displayName: z.string().trim().nullish(),
    displayPhotoUrl: z.string().trim().nullish(),
    displayOrder: z.coerce.number().int().nullish(),
    name: z.string().trim().nullish(),
    photoUrl: z.string().trim().nullish(),
    role: z.string().trim().nullish(),
    order: z.coerce.number().int().nullish(),
});

/**
 * GET /api/members
 * Returns core team members for the current academic year, shaped as:
 *   { id, name, role, photoUrl, year, createdAt }
 */
export const getMembers = async (req: Request, res: Response) => {
    try {
        // Find the current AY
        const [currentAY] = await db
            .select({ id: academicYears.id, label: academicYears.label })
            .top(1).from(academicYears)
            .where(eq(academicYears.isCurrent, true))
            ;

        if (!currentAY) {
            // No current AY set — return empty list rather than error
            return ok(res, []);
        }

        // Fetch assignments for the current AY, joined with role metadata
        const assignments = await db
            .select({
                id: coreTeamAssignments.id,
                displayName: coreTeamAssignments.displayName,
                displayPhotoUrl: coreTeamAssignments.displayPhotoUrl,
                displayOrder: coreTeamAssignments.displayOrder,
                volunteerId: coreTeamAssignments.volunteerId,
                roleName: coreTeamRoles.name,
                roleCategory: coreTeamRoles.category,
                roleDisplayOrder: coreTeamRoles.displayOrder,
                createdAt: coreTeamAssignments.createdAt,
            })
            .from(coreTeamAssignments)
            .innerJoin(coreTeamRoles, eq(coreTeamAssignments.coreTeamRoleId, coreTeamRoles.id))
            .where(eq(coreTeamAssignments.academicYearId, currentAY.id))
            .orderBy(coreTeamRoles.displayOrder);

        // Fetch volunteer names for student roles
        const volunteerIds = assignments
            .map(a => a.volunteerId)
            .filter((v): v is number => v !== null);

        const volunteerMap: Record<number, { name: string, photoUrl: string | null }> = {};
        if (volunteerIds.length > 0) {
            const vols = await db
                .select({ id: volunteers.id, name: volunteers.name, photoUrl: volunteerProfiles.profilePhotoUrl })
                .from(volunteers)
                .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
                .where(inArray(volunteers.id, volunteerIds));
            vols.forEach(v => { volunteerMap[v.id] = { name: v.name, photoUrl: v.photoUrl }; });
        }

        const members = assignments.map(a => ({
            id: a.id,
            name: a.volunteerId
                ? (volunteerMap[a.volunteerId]?.name ?? a.displayName ?? 'Unknown')
                : (a.displayName ?? 'Unknown'),
            role: a.roleName,
            category: a.roleCategory,
            photoUrl: a.displayPhotoUrl ?? (a.volunteerId ? volunteerMap[a.volunteerId]?.photoUrl : null) ?? null,
            year: currentAY.label,
            order: a.displayOrder || a.roleDisplayOrder,
            createdAt: a.createdAt,
        }));

        ok(res, members);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * POST /api/members
 * Creates a new core team assignment for the current AY.
 * Body: { coreTeamRoleId, volunteerId?, displayName?, displayPhotoUrl? }
 */
export const createMember = async (req: Request, res: Response) => {
    try {
        const parsed = createMemberSchema.parse(req.body);
        const { coreTeamRoleId, volunteerId, displayName, displayPhotoUrl, name, role, photoUrl, order } = parsed;

        const [currentAY] = await db
            .select({ id: academicYears.id })
            .top(1).from(academicYears)
            .where(eq(academicYears.isCurrent, true))
            ;

        if (!currentAY) {
            throw new ValidationError('No active academic year is set. Create and activate an academic year first.');
        }

        let roleId = coreTeamRoleId ? coreTeamRoleId : null;
        
        // Legacy support: if 'role' is provided as string
        if (!roleId && role) {
            const coreRole = await db.select({ id: coreTeamRoles.id }).top(1).from(coreTeamRoles).where(eq(coreTeamRoles.name, role)).then(res => res[0]);
            if (!coreRole) {
                throw new ValidationError(`Role "${role}" does not exist. Please provide a valid role ID or existing role name.`);
            }
            roleId = coreRole.id;
        }

        if (!roleId) throw new ValidationError('Role is required');

        const [newAssignment] = await db.insert(coreTeamAssignments).output().values({
            academicYearId: currentAY.id,
            coreTeamRoleId: roleId,
            volunteerId: volunteerId ? volunteerId : null,
            displayName: displayName ?? name ?? null,
            displayPhotoUrl: displayPhotoUrl ?? photoUrl ?? null,
            displayOrder: order ?? 0,
        });

        created(res, newAssignment);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * PUT /api/members/:id
 * Updates a core team assignment.
 */
export const updateMember = async (req: Request, res: Response) => {
    try {
        const id = positiveIntParam.parse(req.params.id);
        const parsed = updateMemberSchema.parse(req.body);
        const { volunteerId, displayName, displayPhotoUrl, displayOrder, name, photoUrl, role, order } = parsed;
        
        let updateData: Partial<typeof coreTeamAssignments.$inferInsert> = {
            volunteerId: volunteerId !== undefined ? (volunteerId ? volunteerId : null) : undefined,
            displayName: displayName !== undefined ? displayName : (name ?? undefined),
            displayPhotoUrl: displayPhotoUrl !== undefined ? displayPhotoUrl : (photoUrl ?? undefined),
            displayOrder: displayOrder !== undefined ? displayOrder : (order !== undefined ? order : undefined),
        };

        if (role) {
            const coreRole = await db.select({ id: coreTeamRoles.id }).top(1).from(coreTeamRoles).where(eq(coreTeamRoles.name, role)).then(res => res[0]);
            if (!coreRole) {
                throw new ValidationError(`Role "${role}" does not exist.`);
            }
            updateData.coreTeamRoleId = coreRole.id;
        }

        const [updated] = await db
            .update(coreTeamAssignments)
            .set(updateData)
            .where(eq(coreTeamAssignments.id, id))
            .output();
        ok(res, updated);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * DELETE /api/members/:id
 * Removes a core team assignment.
 */
export const deleteMember = async (req: Request, res: Response) => {
    try {
        const id = positiveIntParam.parse(req.params.id);
        await db.delete(coreTeamAssignments).where(eq(coreTeamAssignments.id, id));
        noContent(res);
    } catch (error) {
        handleError(res, error);
    }
};
