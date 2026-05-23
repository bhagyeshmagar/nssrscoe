import { Router } from 'express';
import { createRegistration, getRegistrationByVisitorId, getRegistrationsByEventId } from '../controllers/registrationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes for registrations
router.post('/', createRegistration);
router.get('/visitor/:visitorId', getRegistrationByVisitorId);

// Protected routes for admins
router.get('/event/:eventId', authenticateToken, getRegistrationsByEventId);

export default router;
