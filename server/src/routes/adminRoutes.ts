import { Router } from 'express';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, getMe, updateMe } from '../controllers/adminController';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createAdminSchema, updateAdminSchema } from '../lib/schemas/index';

const router = Router();

// All admins can view and edit their own profile
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);

// Only superadmins can manage other admins
router.use(authenticateToken, requireSuperAdmin);

router.get('/',     getAdmins);
router.post('/',    validateRequest(createAdminSchema), createAdmin);
router.put('/:id',  validateRequest(updateAdminSchema), updateAdmin);
router.delete('/:id', deleteAdmin);

export default router;
