import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { academicYears, coreTeamAssignments, coreTeamRoles } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { UnauthorizedError } from '../lib/errors';
import { AuthRequest } from './auth';

export interface CoreTeamAuthRequest extends AuthRequest {
    coreTeam?: {
        assignmentId: number;
        roleCode: string;
        roleName: string;
        department?: string;
        academicYearId: number;
    };
}

export const requireCoreTeamRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as CoreTeamAuthRequest;
        if (!authReq.user || authReq.user.role !== 'volunteer') {
            throw new UnauthorizedError('Authentication required');
        }

        // Find current AY
        const [currentAy] = await db.select().from(academicYears).where(eq(academicYears.isCurrent, true)).limit(1);
        if (!currentAy) {
            throw new UnauthorizedError('No active academic year found');
        }

        // Check if user is in core team for current AY
        const [assignment] = await db.select({
            id: coreTeamAssignments.id,
            department: coreTeamAssignments.department,
            roleCode: coreTeamRoles.code,
            roleName: coreTeamRoles.name,
        })
        .from(coreTeamAssignments)
        .innerJoin(coreTeamRoles, eq(coreTeamAssignments.coreTeamRoleId, coreTeamRoles.id))
        .where(and(
            eq(coreTeamAssignments.volunteerId, authReq.user.id),
            eq(coreTeamAssignments.academicYearId, currentAy.id)
        ))
        .limit(1);

        if (!assignment) {
            throw new UnauthorizedError('Access denied. You are not assigned to the core team for the current academic year.');
        }

        // Attach core team info to user
        authReq.coreTeam = {
            assignmentId: assignment.id,
            roleCode: assignment.roleCode,
            roleName: assignment.roleName,
            department: assignment.department || undefined,
            academicYearId: currentAy.id
        };

        next();
    } catch (err) {
        next(err);
    }
};
