import { Router } from 'express';
import { getMembers, createMember, updateMember, deleteMember } from '../controllers/membersController';
import { requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getMembers);
router.post('/', requireSuperAdmin, createMember);
router.put('/:id', requireSuperAdmin, updateMember);
router.delete('/:id', requireSuperAdmin, deleteMember);

export default router;
