import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { updateSettingsSchema } from '../lib/schemas/index';

const router = Router();

// Public read — anyone can see the site settings (hero text, stats, etc.)
router.get('/', getSettings);

// Only authenticated superadmins can change settings
router.put('/', authenticateToken, requireSuperAdmin, validateRequest(updateSettingsSchema), updateSettings);

export default router;
