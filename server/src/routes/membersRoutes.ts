import { Router } from 'express';
import { getMembers, createMember, updateMember, deleteMember } from '../controllers/membersController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', getMembers);
router.post('/', authenticateToken, createMember);
router.put('/:id', authenticateToken, updateMember);
router.delete('/:id', authenticateToken, deleteMember);

export default router;
