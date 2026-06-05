import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireCoreTeamRole } from '../middleware/coreTeamAuth';
import { catchAsync } from '../lib/errors';
import * as controller from '../controllers/coreTeamDashboardController';

const router = Router();

// All routes require authentication and core team role in current AY
router.use(authenticateToken);
router.use(catchAsync(requireCoreTeamRole));

router.get('/dashboard', catchAsync(controller.getDashboardData));

export default router;
