import { Request, Response } from 'express';
import { db } from '../db';
import { gallery } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { ok, created, noContent, handleError } from '../lib/response';
import { AuthRequest, getAdminId } from '../middleware/auth';
import { ForbiddenError, NotFoundError } from '../lib/errors';
import { positiveIntParam } from '../lib/schemas';
import { z } from 'zod';

const galleryItemSchema = z.object({
    title: z.string().trim().max(255).optional().nullable(),
    description: z.string().trim().optional().default(''),
    url: z.string().trim().min(1, 'URL cannot be empty.'),
    type: z.enum(['image', 'video']),
});

const updateGalleryItemSchema = galleryItemSchema.partial();

const rejectGallerySchema = z.object({
    reason: z.string().trim().min(1, 'Rejection reason is required.'),
});

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
        const { title, description, url, type } = galleryItemSchema.parse(req.body);
        
        const isSuperadmin = authReq.user!.isSuperadmin;
        const status = isSuperadmin ? 'approved' : 'pending';

        const [item] = await db.insert(gallery).output().values({
            title,
            description,
            url,
            type,
            status,
            submittedById: getAdminId(authReq),
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
        const id = positiveIntParam.parse(req.params.id);
        const adminId = getAdminId(authReq);

        const [existing] = await db.select({ submittedById: gallery.submittedById }).top(1).from(gallery).where(eq(gallery.id, id));
        if (!existing) throw new NotFoundError('Gallery item not found.');

        if (!authReq.user!.isSuperadmin && existing.submittedById !== adminId) {
            throw new ForbiddenError('You can only update your own gallery items.');
        }

        const parsed = updateGalleryItemSchema.parse(req.body);
        const updates: Partial<typeof gallery.$inferInsert> = {};
        if (parsed.title !== undefined) updates.title = parsed.title;
        if (parsed.description !== undefined) updates.description = parsed.description;
        if (parsed.url !== undefined) updates.url = parsed.url;
        if (parsed.type !== undefined) updates.type = parsed.type;

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
    try {
        const authReq = req as AuthRequest;
        const id = positiveIntParam.parse(req.params.id);
        const adminId = getAdminId(authReq);

        const [existing] = await db.select({ submittedById: gallery.submittedById }).top(1).from(gallery).where(eq(gallery.id, id));
        if (!existing) throw new NotFoundError('Gallery item not found.');

        if (!authReq.user!.isSuperadmin && existing.submittedById !== adminId) {
            throw new ForbiddenError('You can only delete your own gallery items.');
        }

        await db.delete(gallery).where(eq(gallery.id, id));
        noContent(res);
    } catch (error) {
        handleError(res, error);
    }
};

export const approveGalleryItem = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const id = positiveIntParam.parse(req.params.id);
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
        const id = positiveIntParam.parse(req.params.id);
        const { reason } = rejectGallerySchema.parse(req.body);
        const [item] = await db.update(gallery)
            .set({ status: 'rejected', reviewedById: authReq.user!.id, rejectionReason: reason || null })
            .where(eq(gallery.id, id))
            .output();
        ok(res, item, 'Item rejected.');
    } catch (error) {
        handleError(res, error);
    }
};
