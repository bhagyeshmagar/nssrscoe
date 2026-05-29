import { Router } from 'express';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, getMe, updateMe } from '../controllers/adminController';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// All admins can view and edit their own profile
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);

// Only superadmins can manage other admins
router.use(authenticateToken, requireSuperAdmin);

router.get('/', getAdmins);
router.post('/', createAdmin);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

export default router;
