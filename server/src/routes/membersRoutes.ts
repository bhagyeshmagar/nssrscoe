import { Router } from 'express';
import { getMembers, createMember, updateMember, deleteMember } from '../controllers/membersController';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getMembers);
router.post('/', authenticateToken, requireSuperAdmin, createMember);
router.put('/:id', authenticateToken, requireSuperAdmin, updateMember);
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteMember);

export default router;
