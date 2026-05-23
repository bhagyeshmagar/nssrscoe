import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', getSettings);
router.put('/', authenticateToken, updateSettings);

export default router;
