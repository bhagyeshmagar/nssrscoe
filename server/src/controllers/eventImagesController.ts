import { Request, Response } from 'express';
import { db } from '../db';
import { eventImages } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { ok, created, noContent, handleError } from '../lib/response';
import { NotFoundError, ValidationError } from '../lib/errors';
import { positiveIntParam } from '../lib/schemas';

// Get all images for an event
export const getEventImages = async (req: Request, res: Response) => {
    try {
        const eventId = positiveIntParam.parse(req.params.eventId);

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
        const eventId = positiveIntParam.parse(req.params.eventId);

        const { images } = req.body as { images: Array<{ url: string; isMaster?: boolean; caption?: string | null }> };
        if (!Array.isArray(images) || images.length === 0) {
            throw new ValidationError('images must be a non-empty array.');
        }

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
        const eventId = positiveIntParam.parse(req.params.eventId);
        const imageId = positiveIntParam.parse(req.params.imageId);

        // Verify the image belongs to this event
        const [img] = await db.select({ id: eventImages.id })
            .top(1).from(eventImages)
            .where(and(eq(eventImages.id, imageId), eq(eventImages.eventId, eventId)));
        if (!img) throw new NotFoundError('Image not found for this event.');

        // Unset all masters, then set the requested one transactionally
        await db.transaction(async (tx) => {
            await tx.update(eventImages)
                .set({ isMaster: false })
                .where(eq(eventImages.eventId, eventId));

            await tx.update(eventImages)
                .set({ isMaster: true })
                .where(eq(eventImages.id, imageId));
        });

        ok(res, null, 'Master image updated.');
    } catch (error) {
        handleError(res, error);
    }
};

// Delete an event image
export const deleteEventImage = async (req: Request, res: Response) => {
    try {
        const eventId = positiveIntParam.parse(req.params.eventId);
        const imageId = positiveIntParam.parse(req.params.imageId);

        const [existing] = await db.select({ id: eventImages.id }).top(1).from(eventImages)
            .where(and(eq(eventImages.id, imageId), eq(eventImages.eventId, eventId)));
        if (!existing) throw new NotFoundError('Image not found for this event.');

        await db.delete(eventImages).where(eq(eventImages.id, imageId));
        noContent(res);
    } catch (error) {
        handleError(res, error);
    }
};

// Update image caption / master flag (validated via schema middleware in route)
export const updateEventImage = async (req: Request, res: Response) => {
    try {
        const eventId = positiveIntParam.parse(req.params.eventId);
        const imageId = positiveIntParam.parse(req.params.imageId);

        const [existing] = await db.select({ id: eventImages.id }).top(1).from(eventImages)
            .where(and(eq(eventImages.id, imageId), eq(eventImages.eventId, eventId)));
        if (!existing) throw new NotFoundError('Image not found for this event.');

        const { caption, isMaster } = req.body as { caption?: string | null; isMaster?: boolean };

        const updateData: Partial<typeof eventImages.$inferInsert> = {};
        if (caption !== undefined)  updateData.caption  = caption ? String(caption).trim() : null;
        if (isMaster !== undefined) updateData.isMaster = isMaster;

        if (Object.keys(updateData).length === 0) {
            throw new ValidationError('Nothing to update.');
        }

        await db.update(eventImages)
            .set(updateData)
            .where(eq(eventImages.id, imageId));

        ok(res, null, 'Image updated.');
    } catch (error) {
        handleError(res, error);
    }
};
