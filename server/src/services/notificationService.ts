import { eq, and, desc, count, sql } from 'drizzle-orm';
import { db } from '../db';
import { notifications, volunteers } from '../db/schema';
import { NotFoundError } from '../lib/errors';
import { emitToVolunteer } from './socketService';

export interface CreateNotificationInput {
    volunteerId: number;
    type: string;
    title: string;
    body: string;
    referenceType?: string;
    referenceId?: number;
}

export const createNotification = async (input: CreateNotificationInput) => {
    const [notification] = await db.insert(notifications).output().values({
        volunteerId: input.volunteerId,
        type: input.type,
        title: input.title,
        body: input.body,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
    });
    
    // Emit via WebSocket
    emitToVolunteer(input.volunteerId, 'new_notification', notification);
    
    return notification;
};

export const createBulkNotifications = async (inputs: CreateNotificationInput[]) => {
    if (inputs.length === 0) return [];
    const created = await db.insert(notifications).output().values(inputs);

    // Defer Socket.IO emits so the bulk INSERT result is returned to the caller
    // immediately. The emits run in the next event loop iteration — this prevents
    // a 500-notification loop from blocking other requests during the cron tick.
    setImmediate(() => {
        for (const notif of created) {
            emitToVolunteer(notif.volunteerId, 'new_notification', notif);
        }
    });

    return created;
};

export const getMyNotifications = async (volunteerId: number, limit = 50, offset = 0) => {
    return await db.select()
        .from(notifications)
        .where(eq(notifications.volunteerId, volunteerId))
        .orderBy(desc(notifications.createdAt))
        .offset(offset).fetch(limit);
};

export const getUnreadCount = async (volunteerId: number) => {
    const [row] = await db.select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.volunteerId, volunteerId), eq(notifications.isRead, false)));
    return row.count;
};

export const markAsRead = async (id: number, volunteerId: number) => {
    const [updated] = await db.update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, id), eq(notifications.volunteerId, volunteerId)))
        .output();
    if (!updated) throw new NotFoundError('Notification not found');
    return updated;
};

export const markAllAsRead = async (volunteerId: number) => {
    await db.update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.volunteerId, volunteerId), eq(notifications.isRead, false)));
};
