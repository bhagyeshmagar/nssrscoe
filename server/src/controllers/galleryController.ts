import { Request, Response } from 'express';
import { db } from '../db';
import { gallery } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { ok, created, noContent, handleError } from '../lib/response';
import { AuthRequest } from '../middleware/auth';

export const getGallery = async (req: Request, res: Response) => {
    try {
        const items = await db.select().from(gallery)
            .where(eq(gallery.status, 'approved'))
            .orderBy(desc(gallery.createdAt));
        ok(res, items);
    } catch (error) {
        handleError(res, error);
    }
};

export const getGalleryAdmin = async (req: Request, res: Response) => {
    try {
        const items = await db.select().from(gallery).orderBy(desc(gallery.createdAt));
        ok(res, items);
    } catch (error) {
        handleError(res, error);
    }
};

export const createGalleryItem = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const { title, description, url, type } = req.body;
        
        const isSuperadmin = authReq.user!.isSuperadmin;
        const status = isSuperadmin ? 'approved' : 'pending';

        const [item] = await db.insert(gallery).output().values({
            title,
            description,
            url,
            type,
            status,
            submittedById: authReq.user!.id,
        });

        created(res, item, status === 'pending' 
            ? 'Submitted for superadmin approval.' 
            : 'Gallery item published.');
    } catch (error) {
        handleError(res, error);
    }
};

export const updateGalleryItem = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const id = Number(req.params.id);

        // Whitelist updatable fields — never spread req.body directly
        const { title, description, url, type } = req.body;
        const updates: Partial<typeof gallery.$inferInsert> = {};
        if (title !== undefined)       updates.title = String(title).trim() || null;
        if (description !== undefined) updates.description = String(description);
        if (url !== undefined)         updates.url = String(url).trim();
        if (type !== undefined)        updates.type = type;

        if (!authReq.user!.isSuperadmin) {
            // Non-superadmin edits must go back to pending review
            updates.status = 'pending';
            updates.rejectionReason = null;
        }

        const [item] = await db.update(gallery)
            .set(updates)
            .where(eq(gallery.id, id))
            .output();

        ok(res, item);
    } catch (error) {
        handleError(res, error);
    }
};

export const deleteGalleryItem = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await db.delete(gallery).where(eq(gallery.id, Number(id)));
        noContent(res);
    } catch (error) {
        handleError(res, error);
    }
};

export const approveGalleryItem = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const id = Number(req.params.id);
        const [item] = await db.update(gallery)
            .set({ status: 'approved', reviewedById: authReq.user!.id, rejectionReason: null })
            .where(eq(gallery.id, id))
            .output();
        ok(res, item, 'Item approved and published.');
    } catch (error) {
        handleError(res, error);
    }
};

export const rejectGalleryItem = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const id = Number(req.params.id);
        const { reason } = req.body;
        const [item] = await db.update(gallery)
            .set({ status: 'rejected', reviewedById: authReq.user!.id, rejectionReason: reason || null })
            .where(eq(gallery.id, id))
            .output();
        ok(res, item, 'Item rejected.');
    } catch (error) {
        handleError(res, error);
    }
};
