import { Response } from 'express';
import { CoreTeamAuthRequest } from '../middleware/coreTeamAuth';
import { ok, handleError } from '../lib/response';
import * as service from '../services/coreTeamDashboardService';

export const getDashboardData = async (req: CoreTeamAuthRequest, res: Response) => {
    try {
        const { department, roleName, academicYearId } = req.coreTeam!;

        let volunteers: any[] = [];
        if (department) {
            // Dept coordinator — show their department's volunteers
            volunteers = await service.getDepartmentVolunteers(academicYearId, department);
        } else {
            // Portfolio lead — match volunteers who selected this portfolio
            // Pass the full roleName; the service sanitises it
            volunteers = await service.getPortfolioVolunteers(academicYearId, roleName);
        }

        ok(res, { volunteers });
    } catch (err) {
        handleError(res, err);
    }
};
