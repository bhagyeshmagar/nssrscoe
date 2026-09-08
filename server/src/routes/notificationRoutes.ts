import { Router } from 'express';
import { authenticateToken, requireVolunteer } from '../middleware/auth';
import { catchAsync } from '../lib/errors';
import * as notificationController from '../controllers/notificationController';

const router = Router({ mergeParams: true });

// requireVolunteer enforces: role === 'volunteer', isActive, AY not locked/archived.
router.get('/volunteers/me/notifications',           authenticateToken, requireVolunteer, catchAsync(notificationController.getMyNotifications));
router.get('/volunteers/me/notifications/count',     authenticateToken, requireVolunteer, catchAsync(notificationController.getUnreadCount));
router.put('/volunteers/me/notifications/read-all',  authenticateToken, requireVolunteer, catchAsync(notificationController.markAllAsRead));
router.put('/volunteers/me/notifications/:id/read',  authenticateToken, requireVolunteer, catchAsync(notificationController.markAsRead));

export default router;
