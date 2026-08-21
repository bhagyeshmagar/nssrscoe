import { Router } from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createEventSchema, updateEventSchema } from '../lib/schemas/index';

const router = Router();

// Public: anyone can list events
router.get('/', getEvents);

// Admin-only mutations
router.post('/',    authenticateToken, requireAdmin, validateRequest(createEventSchema), createEvent);
router.put('/:id',  authenticateToken, requireAdmin, validateRequest(updateEventSchema), updateEvent);
router.delete('/:id', authenticateToken, requireAdmin, deleteEvent);

export default router;
