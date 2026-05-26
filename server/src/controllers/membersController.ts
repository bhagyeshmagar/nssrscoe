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
import { coreTeamAssignments, coreTeamRoles, academicYears, volunteers } from '../db/schema';
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

        const volunteerMap: Record<number, { name: string }> = {};
        if (volunteerIds.length > 0) {
            const vols = await db
                .select({ id: volunteers.id, name: volunteers.name })
                .from(volunteers)
                .where(eq(volunteers.academicYearId, currentAY.id));
            vols.forEach(v => { volunteerMap[v.id] = { name: v.name }; });
        }

        const members = assignments.map(a => ({
            id: a.id,
            name: a.volunteerId
                ? (volunteerMap[a.volunteerId]?.name ?? a.displayName ?? 'Unknown')
                : (a.displayName ?? 'Unknown'),
            role: a.roleName,
            photoUrl: a.displayPhotoUrl ?? null,
            year: currentAY.label,
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
        const { coreTeamRoleId, volunteerId, displayName, displayPhotoUrl } = req.body;

        const [currentAY] = await db
            .select({ id: academicYears.id })
            .from(academicYears)
            .where(eq(academicYears.isCurrent, true))
            .limit(1);

        if (!currentAY) {
            return res.status(400).json({ message: 'No active academic year is set. Create and activate an academic year first.' });
        }

        const [newAssignment] = await db.insert(coreTeamAssignments).values({
            academicYearId: currentAY.id,
            coreTeamRoleId: parseInt(coreTeamRoleId),
            volunteerId: volunteerId ? parseInt(volunteerId) : null,
            displayName: displayName ?? null,
            displayPhotoUrl: displayPhotoUrl ?? null,
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
        const { volunteerId, displayName, displayPhotoUrl, displayOrder } = req.body;
        const [updated] = await db
            .update(coreTeamAssignments)
            .set({
                volunteerId: volunteerId !== undefined ? parseInt(volunteerId) : undefined,
                displayName: displayName ?? undefined,
                displayPhotoUrl: displayPhotoUrl ?? undefined,
                displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : undefined,
            })
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
