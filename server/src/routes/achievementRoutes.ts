import { Router } from 'express';
import { getPublicAchievements } from '../controllers/achievementController';

const router = Router();

router.get('/', getPublicAchievements);

export default router;
