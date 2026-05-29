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
import { eq, desc, and } from 'drizzle-orm';

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
            .from(academicYears)
            .where(eq(academicYears.isCurrent, true))
            .limit(1);

        if (!currentAY) {
            // No current AY set — return empty list rather than error
            return res.json([]);
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
                .where(eq(volunteers.academicYearId, currentAY.id));
            vols.forEach(v => { volunteerMap[v.id] = { name: v.name, photoUrl: v.photoUrl }; });
        }

        const members = assignments.map(a => ({
            id: a.id,
            name: a.volunteerId
                ? (volunteerMap[a.volunteerId]?.name ?? a.displayName ?? 'Unknown')
                : (a.displayName ?? 'Unknown'),
            role: a.roleName,
            photoUrl: a.displayPhotoUrl ?? (a.volunteerId ? volunteerMap[a.volunteerId]?.photoUrl : null) ?? null,
            year: currentAY.label,
            order: a.roleDisplayOrder,
            createdAt: a.createdAt,
        }));

        res.json(members);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching members', error });
    }
};

/**
 * POST /api/members
 * Creates a new core team assignment for the current AY.
 * Body: { coreTeamRoleId, volunteerId?, displayName?, displayPhotoUrl? }
 */
export const createMember = async (req: Request, res: Response) => {
    try {
        const { coreTeamRoleId, volunteerId, displayName, displayPhotoUrl, name, role, photoUrl } = req.body;

        const [currentAY] = await db
            .select({ id: academicYears.id })
            .from(academicYears)
            .where(eq(academicYears.isCurrent, true))
            .limit(1);

        if (!currentAY) {
            return res.status(400).json({ message: 'No active academic year is set. Create and activate an academic year first.' });
        }

        let roleId = coreTeamRoleId ? parseInt(coreTeamRoleId) : null;
        
        // Legacy support: if 'role' is provided as string
        if (!roleId && role) {
            let coreRole = await db.select().from(coreTeamRoles).where(eq(coreTeamRoles.name, role)).limit(1).then(res => res[0]);
            if (!coreRole) {
                const code = role.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 50);
                const [newRole] = await db.insert(coreTeamRoles).values({
                    name: role,
                    code: code,
                    roleType: role.toLowerCase().includes('coordinator') || role.toLowerCase().includes('lead') || role.toLowerCase().includes('representative') ? 'student' : 'institution',
                }).returning();
                coreRole = newRole;
            }
            roleId = coreRole.id;
        }

        if (!roleId) return res.status(400).json({ message: 'Role is required' });

        const [newAssignment] = await db.insert(coreTeamAssignments).values({
            academicYearId: currentAY.id,
            coreTeamRoleId: roleId,
            volunteerId: volunteerId ? parseInt(volunteerId) : null,
            displayName: displayName ?? name ?? null,
            displayPhotoUrl: displayPhotoUrl ?? photoUrl ?? null,
        }).returning();

        res.json(newAssignment);
    } catch (error) {
        res.status(500).json({ message: 'Error creating member', error });
    }
};

/**
 * PUT /api/members/:id
 * Updates a core team assignment.
 */
export const updateMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { volunteerId, displayName, displayPhotoUrl, displayOrder, name, photoUrl, role } = req.body;
        
        let updateData: any = {
            volunteerId: volunteerId !== undefined ? parseInt(volunteerId) : undefined,
            displayName: displayName ?? name ?? undefined,
            displayPhotoUrl: displayPhotoUrl ?? photoUrl ?? undefined,
            displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : undefined,
        };

        if (role) {
            let coreRole = await db.select().from(coreTeamRoles).where(eq(coreTeamRoles.name, role)).limit(1).then(res => res[0]);
            if (!coreRole) {
                const code = role.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 50);
                const [newRole] = await db.insert(coreTeamRoles).values({
                    name: role,
                    code: code,
                    roleType: role.toLowerCase().includes('coordinator') || role.toLowerCase().includes('lead') || role.toLowerCase().includes('representative') ? 'student' : 'institution',
                }).returning();
                coreRole = newRole;
            }
            updateData.coreTeamRoleId = coreRole.id;
        }

        const [updated] = await db
            .update(coreTeamAssignments)
            .set(updateData)
            .where(eq(coreTeamAssignments.id, Number(id)))
            .returning();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error updating member', error });
    }
};

/**
 * DELETE /api/members/:id
 * Removes a core team assignment.
 */
export const deleteMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await db.delete(coreTeamAssignments).where(eq(coreTeamAssignments.id, Number(id)));
        res.json({ message: 'Member removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting member', error });
    }
};
