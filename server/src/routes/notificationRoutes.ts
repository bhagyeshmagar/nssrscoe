import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { catchAsync } from '../lib/errors';
import * as notificationController from '../controllers/notificationController';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticateToken);

router.get('/volunteers/me/notifications', catchAsync(notificationController.getMyNotifications));
router.get('/volunteers/me/notifications/count', catchAsync(notificationController.getUnreadCount));
router.put('/volunteers/me/notifications/read-all', catchAsync(notificationController.markAllAsRead));
router.put('/volunteers/me/notifications/:id/read', catchAsync(notificationController.markAsRead));

export default router;
