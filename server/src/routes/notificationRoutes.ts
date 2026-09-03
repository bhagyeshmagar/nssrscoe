import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { catchAsync } from '../lib/errors';
import * as notificationController from '../controllers/notificationController';

const router = Router({ mergeParams: true });

router.get('/volunteers/me/notifications', authenticateToken, catchAsync(notificationController.getMyNotifications));
router.get('/volunteers/me/notifications/count', authenticateToken, catchAsync(notificationController.getUnreadCount));
router.put('/volunteers/me/notifications/read-all', authenticateToken, catchAsync(notificationController.markAllAsRead));
router.put('/volunteers/me/notifications/:id/read', authenticateToken, catchAsync(notificationController.markAsRead));

export default router;
