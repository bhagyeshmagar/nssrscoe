import { Request, Response } from 'express';
import { ok } from '../lib/response';
import * as notificationService from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
    const volunteerId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const notifications = await notificationService.getMyNotifications(volunteerId, limit, offset);
    ok(res, { notifications });
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
    const volunteerId = req.user!.id;
    const count = await notificationService.getUnreadCount(volunteerId);
    ok(res, { count });
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    const volunteerId = req.user!.id;
    const id = parseInt(req.params.id);
    const updated = await notificationService.markAsRead(id, volunteerId);
    ok(res, { notification: updated });
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    const volunteerId = req.user!.id;
    await notificationService.markAllAsRead(volunteerId);
    ok(res, null, 'All notifications marked as read');
};
