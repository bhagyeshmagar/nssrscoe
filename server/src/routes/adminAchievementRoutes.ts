import { Router } from 'express';
import * as controller from '../controllers/adminAchievementController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/',     controller.getAchievements);
router.post('/',    controller.createAchievement);
router.put('/:id',  controller.updateAchievement);
router.delete('/:id', controller.deleteAchievement);
router.put('/:id/restore', controller.restoreAchievement);

export default router;
