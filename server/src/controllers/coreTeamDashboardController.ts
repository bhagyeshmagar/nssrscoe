import { Response } from 'express';
import { CoreTeamAuthRequest } from '../middleware/coreTeamAuth';
import { ok } from '../lib/response';
import * as service from '../services/coreTeamDashboardService';

export const getDashboardData = async (req: CoreTeamAuthRequest, res: Response) => {
    const { department, roleName, academicYearId } = req.coreTeam!;
    
    let volunteers: any[] = [];
    if (department) {
        volunteers = await service.getDepartmentVolunteers(academicYearId, department);
    } else {
        // Find volunteers who selected this portfolio
        // Using roleName to match portfolio choice string. E.g. 'Technical Secretary' -> 'Technical'
        const keyword = roleName.split(' ')[0]; 
        volunteers = await service.getPortfolioVolunteers(academicYearId, keyword);
    }
    
    ok(res, { volunteers });
};
