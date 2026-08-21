import { Request, Response } from 'express';
import { db } from '../db';
import { eventImages } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { ok, created, noContent, handleError } from '../lib/response';
import { NotFoundError } from '../lib/errors';

// Get all images for an event
export const getEventImages = async (req: Request, res: Response) => {
    try {
        const eventId = parseInt(req.params.eventId);
        if (isNaN(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID.' });

        const images = await db.select().from(eventImages)
            .where(eq(eventImages.eventId, eventId))
            .orderBy(eventImages.isMaster);
        ok(res, images);
    } catch (error) {
        handleError(res, error);
    }
};

// Add images to an event (validated via schema middleware in route)
export const addEventImages = async (req: Request, res: Response) => {
    try {
        const eventId = parseInt(req.params.eventId);
        if (isNaN(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID.' });

        const { images } = req.body as { images: Array<{ url: string; isMaster?: boolean; caption?: string | null }> };

        // If any new image is master, clear all existing masters first
        if (images.some(img => img.isMaster)) {
            await db.update(eventImages)
                .set({ isMaster: false })
                .where(eq(eventImages.eventId, eventId));
        }

        const insertData = images.map(img => ({
            eventId,
            url:      String(img.url).trim(),
            isMaster: img.isMaster ?? false,
            caption:  img.caption ? String(img.caption).trim() : null,
        }));

        const result = await db.insert(eventImages).output().values(insertData);
        created(res, result);
    } catch (error) {
        handleError(res, error);
    }
};

// Set an image as master — scoped to eventId so cross-event tampering is prevented
export const setMasterImage = async (req: Request, res: Response) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const imageId = parseInt(req.params.imageId);
        if (isNaN(eventId) || isNaN(imageId)) {
            return res.status(400).json({ success: false, message: 'Invalid ID.' });
        }

        // Verify the image belongs to this event
        const [img] = await db.select({ id: eventImages.id })
            .top(1).from(eventImages)
            .where(and(eq(eventImages.id, imageId), eq(eventImages.eventId, eventId)));
        if (!img) throw new NotFoundError('Image not found for this event.');

        // Unset all masters, then set the requested one
        await db.update(eventImages)
            .set({ isMaster: false })
            .where(eq(eventImages.eventId, eventId));

        await db.update(eventImages)
            .set({ isMaster: true })
            .where(eq(eventImages.id, imageId));

        ok(res, null, 'Master image updated.');
    } catch (error) {
        handleError(res, error);
    }
};

// Delete an event image
export const deleteEventImage = async (req: Request, res: Response) => {
    try {
        const imageId = parseInt(req.params.imageId);
        if (isNaN(imageId)) return res.status(400).json({ success: false, message: 'Invalid image ID.' });

        await db.delete(eventImages).where(eq(eventImages.id, imageId));
        noContent(res);
    } catch (error) {
        handleError(res, error);
    }
};

// Update image caption / master flag (validated via schema middleware in route)
export const updateEventImage = async (req: Request, res: Response) => {
    try {
        const imageId = parseInt(req.params.imageId);
        if (isNaN(imageId)) return res.status(400).json({ success: false, message: 'Invalid image ID.' });

        const { caption, isMaster } = req.body as { caption?: string | null; isMaster?: boolean };

        const updateData: Partial<typeof eventImages.$inferInsert> = {};
        if (caption !== undefined)  updateData.caption  = caption ? String(caption).trim() : null;
        if (isMaster !== undefined) updateData.isMaster = isMaster;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'Nothing to update.' });
        }

        await db.update(eventImages)
            .set(updateData)
            .where(eq(eventImages.id, imageId));

        ok(res, null, 'Image updated.');
    } catch (error) {
        handleError(res, error);
    }
};
