import { Router } from 'express';
import {
    createVolunteer,
    getAllVolunteers,
    getVolunteerById,
    updateVolunteer,
    deleteVolunteer,
    toggleVolunteerStatus,
    getMyProfile,
    updateMyProfile,
    updatePassword,
    getExperiences,
    getAllPublicVolunteers,
} from '../controllers/volunteerController';
import { authenticateToken, requireAdmin, requireVolunteer } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/experiences', getExperiences);

// Admin routes - requires admin role
router.post('/', authenticateToken, requireAdmin, createVolunteer);
router.get('/', authenticateToken, requireAdmin, getAllVolunteers);
router.get('/admin/:id', authenticateToken, requireAdmin, getVolunteerById);
router.put('/admin/:id', authenticateToken, requireAdmin, updateVolunteer);
router.delete('/admin/:id', authenticateToken, requireAdmin, deleteVolunteer);
router.patch('/admin/:id/toggle-status', authenticateToken, requireAdmin, toggleVolunteerStatus);

// Volunteer self-service routes - requires volunteer role
router.get('/public', authenticateToken, requireVolunteer, getAllPublicVolunteers);
router.get('/me', authenticateToken, requireVolunteer, getMyProfile);
router.put('/me/profile', authenticateToken, requireVolunteer, updateMyProfile);
router.put('/me/password', authenticateToken, requireVolunteer, updatePassword);

export default router;
