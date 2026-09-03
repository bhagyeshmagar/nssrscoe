import { Router } from 'express';
import * as activityCalendarController from '../controllers/activityCalendarController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { catchAsync } from '../lib/errors';

const router = Router();

router.get('/:ayId', catchAsync(activityCalendarController.getByAcademicYear));

router.post('/:ayId', authenticateToken, requireAdmin, catchAsync(activityCalendarController.createActivity));
router.put('/:id', authenticateToken, requireAdmin, catchAsync(activityCalendarController.updateActivity));
router.delete('/:id', authenticateToken, requireAdmin, catchAsync(activityCalendarController.deleteActivity));

export default router;
