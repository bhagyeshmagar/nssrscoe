import { Response } from 'express';
import { ok, handleError } from '../lib/response';
import { ForbiddenError } from '../lib/errors';
import * as notificationService from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';

/** Only volunteers have notifications; reject if called by an admin. */
const requireVolunteerRole = (req: AuthRequest) => {
    if (req.user!.role !== 'volunteer') {
        throw new ForbiddenError('This endpoint is only available to volunteers.', 'FORBIDDEN');
    }
};

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
    try {
        requireVolunteerRole(req);
        const volunteerId = req.user!.id;

        // Clamp limit/offset to sane bounds
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit  as string) || 50));
        const offset = Math.max(0,               parseInt(req.query.offset as string) || 0);

        const notifications = await notificationService.getMyNotifications(volunteerId, limit, offset);
        ok(res, { notifications });
    } catch (err) {
        handleError(res, err);
    }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
        requireVolunteerRole(req);
        const count = await notificationService.getUnreadCount(req.user!.id);
        ok(res, { count });
    } catch (err) {
        handleError(res, err);
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        requireVolunteerRole(req);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid notification ID.' });

        const updated = await notificationService.markAsRead(id, req.user!.id);
        ok(res, { notification: updated });
    } catch (err) {
        handleError(res, err);
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        requireVolunteerRole(req);
        await notificationService.markAllAsRead(req.user!.id);
        ok(res, null, 'All notifications marked as read.');
    } catch (err) {
        handleError(res, err);
    }
};
