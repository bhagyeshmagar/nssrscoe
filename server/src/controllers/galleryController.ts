import { Request, Response } from 'express';
import { db } from '../db';
import { gallery } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const getGallery = async (req: Request, res: Response) => {
    try {
        const items = await db.select().from(gallery).orderBy(desc(gallery.createdAt));
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching gallery', error });
    }
};

export const createGalleryItem = async (req: Request, res: Response) => {
    try {
        const newItem = await db.insert(gallery).values({
            ...req.body
        }).returning();
        res.json(newItem[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error creating gallery item', error });
    }
};

export const updateGalleryItem = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const updated = await db.update(gallery).set(req.body).where(eq(gallery.id, Number(id))).returning();
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating gallery item', error });
    }
};

export const deleteGalleryItem = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await db.delete(gallery).where(eq(gallery.id, Number(id)));
        res.json({ message: 'Gallery item deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting gallery item', error });
    }
};
