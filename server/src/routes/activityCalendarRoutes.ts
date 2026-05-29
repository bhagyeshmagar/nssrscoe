import { Router } from 'express';
import * as activityCalendarController from '../controllers/activityCalendarController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/:ayId', activityCalendarController.getByAcademicYear);

router.post('/:ayId', authenticateToken, requireAdmin, activityCalendarController.createActivity);
router.put('/:id', authenticateToken, requireAdmin, activityCalendarController.updateActivity);
router.delete('/:id', authenticateToken, requireAdmin, activityCalendarController.deleteActivity);

export default router;
