import { Response } from 'express';
import { ok, handleError } from '../lib/response';
import { ForbiddenError } from '../lib/errors';
import * as notificationService from '../services/notificationService';
import { AuthRequest, getAdminId } from '../middleware/auth';
import { positiveIntParam } from '../lib/schemas';
import { z } from 'zod';

/** Only volunteers have notifications; reject if called by an admin. */
const requireVolunteerRole = (req: AuthRequest) => {
    if (req.user!.role !== 'volunteer') {
        throw new ForbiddenError('This endpoint is only available to volunteers.', 'FORBIDDEN');
    }
};

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
    try {
        requireVolunteerRole(req);
        const volunteerId = getAdminId(req);

        // Clamp limit/offset to sane bounds using zod
        const { limit, offset } = z.object({
            limit: z.coerce.number().int().min(1).max(100).default(50),
            offset: z.coerce.number().int().min(0).default(0)
        }).parse(req.query);

        const notifications = await notificationService.getMyNotifications(volunteerId, limit, offset);
        ok(res, { notifications });
    } catch (err) {
        handleError(res, err);
    }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
        requireVolunteerRole(req);
        const count = await notificationService.getUnreadCount(getAdminId(req));
        ok(res, { count });
    } catch (err) {
        handleError(res, err);
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        requireVolunteerRole(req);
        const id = positiveIntParam.parse(req.params.id);

        const updated = await notificationService.markAsRead(id, getAdminId(req));
        ok(res, { notification: updated });
    } catch (err) {
        handleError(res, err);
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        requireVolunteerRole(req);
        await notificationService.markAllAsRead(getAdminId(req));
        ok(res, null, 'All notifications marked as read.');
    } catch (err) {
        handleError(res, err);
    }
};
