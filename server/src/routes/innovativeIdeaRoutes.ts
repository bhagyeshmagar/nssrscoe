import { Router } from 'express';
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as controller from '../controllers/innovativeIdeaController';

// Larger body limit for routes that accept rich text (idea description, feedback text)
const richTextJson = express.json({ limit: '200kb' });


const router = Router();

// Public routes
router.get('/public', controller.getPublicIdeas);
router.get('/public/:id', controller.getPublicIdea);

// Protected volunteer routes
router.use(authenticateToken);
router.post('/', richTextJson, controller.submitIdea);
router.get('/me', controller.getMyIdeas);
router.patch('/:id/request-update', richTextJson, controller.requestUpdate);
router.patch('/:id/request-delete', controller.requestDelete);

export default router;
