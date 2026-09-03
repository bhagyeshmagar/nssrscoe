import { Router } from 'express';
import {
    createRegistration,
    getRegistrationByVisitorId,
    getRegistrationsByEventId,
    approveRegistration,
    rejectRegistration,
    toggleAttendance,
} from '../controllers/registrationController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createRegistrationSchema } from '../lib/schemas/index';

const router = Router();

// Public routes
router.post('/', validateRequest(createRegistrationSchema), createRegistration);
router.get('/visitor/:visitorId', getRegistrationByVisitorId);

// Admin-only routes
router.get('/event/:eventId', authenticateToken, requireAdmin, getRegistrationsByEventId);
router.patch('/:id/approve',  authenticateToken, requireAdmin, approveRegistration);
router.patch('/:id/reject',   authenticateToken, requireAdmin, rejectRegistration);
router.patch('/:id/attendance', authenticateToken, requireAdmin, toggleAttendance);

export default router;
