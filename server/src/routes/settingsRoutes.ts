import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getSettings);
router.put('/', requireSuperAdmin, updateSettings);

export default router;
