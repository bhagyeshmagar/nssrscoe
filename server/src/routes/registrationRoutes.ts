import { Router } from 'express';
import {
    createRegistration,
    getRegistrationByVisitorId,
    getRegistrationsByEventId,
    approveRegistration,
    rejectRegistration,
} from '../controllers/registrationController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/', createRegistration);
router.get('/visitor/:visitorId', getRegistrationByVisitorId);

// Protected routes for admins
router.get('/event/:eventId', authenticateToken, getRegistrationsByEventId);

// Admin approval workflow
router.patch('/:id/approve', authenticateToken, requireAdmin, approveRegistration);
router.patch('/:id/reject',  authenticateToken, requireAdmin, rejectRegistration);

export default router;
