import { Router } from 'express';
import * as controller from '../controllers/adminInnovativeIdeaController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/', controller.getAllIdeas);
router.patch('/:id/approve', controller.approveIdea);
router.patch('/:id/reject', controller.rejectIdea);
router.delete('/:id', controller.deleteIdea);
router.put('/:id/restore', controller.restoreIdea);

export default router;
