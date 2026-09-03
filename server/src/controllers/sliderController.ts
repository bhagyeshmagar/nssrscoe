import { Request, Response } from 'express';
import { db } from '../db';
import { homeSliderImages } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { ok, created, noContent, handleError } from '../lib/response';
import { ForbiddenError, NotFoundError } from '../lib/errors';
import { AuthRequest, getAdminId } from '../middleware/auth';
import { positiveIntParam } from '../lib/schemas';

const sliderImageSchema = z.object({
    url: z.string().trim().min(1, 'URL cannot be empty.'),
    description: z.string().trim().optional().default(''),
    eventId: z.coerce.number().int().positive().nullable().optional(),
});

const updateSliderImageSchema = z.object({
    description: z.string().trim().optional(),
    eventId: z.coerce.number().int().positive().nullable().optional(),
    approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const getSliderImages = async (req: Request, res: Response) => {
    try {
        let query = db.select().from(homeSliderImages);
        
        // If public request (no token or not superadmin), only show approved
        const user = (req as any).user;
        if (!user || user.role === 'volunteer') {
            query = query.where(eq(homeSliderImages.approvalStatus, 'approved')) as typeof query;
        }

        const images = await query.orderBy(desc(homeSliderImages.createdAt));
        ok(res, images);
    } catch (e) {
        handleError(res, e);
    }
};

export const addSliderImage = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const { url, description, eventId } = sliderImageSchema.parse(req.body);
        const user = authReq.user!;

        const approvalStatus = user.isSuperadmin ? 'approved' : 'pending';
        const approvedById = user.isSuperadmin ? getAdminId(authReq) : null;
        const approvedAt = user.isSuperadmin ? new Date() : null;

        const [newImage] = await db.insert(homeSliderImages).output().values({
            url,
            description,
            eventId: eventId || null,
            approvalStatus,
            approvedById,
            approvedAt
        });

        created(res, newImage, 'Slider image added successfully.');
    } catch (e) {
        handleError(res, e);
    }
};

export const updateSliderImage = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const id = positiveIntParam.parse(req.params.id);
        const parsed = updateSliderImageSchema.parse(req.body);
        const { description, eventId, approvalStatus } = parsed;
        const user = authReq.user!;

        const updateData: Partial<typeof homeSliderImages.$inferInsert> = {};
        if (description !== undefined) updateData.description = description;
        if (eventId !== undefined) updateData.eventId = eventId ? eventId : null;

        if (approvalStatus) {
            if (!user.isSuperadmin) {
                throw new ForbiddenError('Only superadmin can change approval status.');
            }
            updateData.approvalStatus = approvalStatus;
            updateData.approvedById = approvalStatus === 'approved' ? getAdminId(authReq) : null;
            updateData.approvedAt = approvalStatus === 'approved' ? new Date() : null;
        }

        const [updated] = await db.update(homeSliderImages).set(updateData).where(eq(homeSliderImages.id, id)).output();
        if (!updated) throw new NotFoundError('Slider image not found.');

        ok(res, updated, 'Updated successfully.');
    } catch (e) {
        handleError(res, e);
    }
};

export const deleteSliderImage = async (req: Request, res: Response) => {
    try {
        const id = positiveIntParam.parse(req.params.id);
        const [deleted] = await db.delete(homeSliderImages).where(eq(homeSliderImages.id, id)).output();
        if (!deleted) throw new NotFoundError('Slider image not found.');
        noContent(res);
    } catch (e) {
        handleError(res, e);
    }
};
