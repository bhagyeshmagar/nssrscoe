import { Request, Response } from 'express';
import { db } from '../db';
import { eventImages } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { ok, created } from '../lib/response';

// Get all images for an event
export const getEventImages = async (req: Request, res: Response) => {
    const { eventId } = req.params;
    try {
        const images = await db.select().from(eventImages)
            .where(eq(eventImages.eventId, parseInt(eventId)))
            .orderBy(eventImages.isMaster);
        ok(res, images);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event images', error });
    }
};

// Add images to an event
export const addEventImages = async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { images } = req.body; // Array of { url, isMaster, caption }

    try {
        // If setting a new master, unset existing masters
        const hasMaster = images.some((img: any) => img.isMaster);
        if (hasMaster) {
            await db.update(eventImages)
                .set({ isMaster: false })
                .where(eq(eventImages.eventId, parseInt(eventId)));
        }

        const insertData = images.map((img: any) => ({
            eventId: parseInt(eventId),
            url: img.url,
            isMaster: img.isMaster || false,
            caption: img.caption || null,
        }));

        const result = await db.insert(eventImages).values(insertData).returning();
        created(res, result);
    } catch (error) {
        res.status(500).json({ message: 'Error adding event images', error });
    }
};

// Set an image as master
export const setMasterImage = async (req: Request, res: Response) => {
    const { eventId, imageId } = req.params;

    try {
        // Unset all masters for this event
        await db.update(eventImages)
            .set({ isMaster: false })
            .where(eq(eventImages.eventId, parseInt(eventId)));

        // Set new master
        await db.update(eventImages)
            .set({ isMaster: true })
            .where(and(
                eq(eventImages.id, parseInt(imageId)),
                eq(eventImages.eventId, parseInt(eventId))
            ));

        ok(res, { message: 'Master image updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error setting master image', error });
    }
};

// Delete an event image
export const deleteEventImage = async (req: Request, res: Response) => {
    const { imageId } = req.params;
    try {
        await db.delete(eventImages).where(eq(eventImages.id, parseInt(imageId)));
        ok(res, { message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting image', error });
    }
};

// Update image caption
export const updateEventImage = async (req: Request, res: Response) => {
    const { imageId } = req.params;
    const { caption, isMaster } = req.body;

    try {
        const updateData: any = {};
        if (caption !== undefined) updateData.caption = caption;
        if (isMaster !== undefined) updateData.isMaster = isMaster;

        await db.update(eventImages)
            .set(updateData)
            .where(eq(eventImages.id, parseInt(imageId)));

        ok(res, { message: 'Image updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating image', error });
    }
};
