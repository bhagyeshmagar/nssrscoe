import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as controller from '../controllers/innovativeIdeaController';

const router = Router();

// Public routes
router.get('/public', controller.getPublicIdeas);
router.get('/public/:id', controller.getPublicIdea);

// Protected volunteer routes
router.use(authenticateToken);
router.post('/', controller.submitIdea);
router.get('/me', controller.getMyIdeas);
router.patch('/:id/request-update', controller.requestUpdate);
router.patch('/:id/request-delete', controller.requestDelete);

export default router;
