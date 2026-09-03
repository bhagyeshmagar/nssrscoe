import { Request, Response } from 'express';
import { db } from '../db';
import { events, homeSliderImages, innovativeIdeas, gallery } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ok } from '../lib/response';
import { positiveIntParam } from '../lib/schemas';
import { getAdminId } from '../middleware/auth';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../lib/asyncHandler';

export const getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
    const [pendingEvents, pendingSliders, pendingIdeas, pendingGallery] = await Promise.all([
        db.select().top(100).from(events).where(eq(events.approvalStatus, 'pending')).orderBy(desc(events.createdAt)),
        db.select().top(100).from(homeSliderImages).where(eq(homeSliderImages.approvalStatus, 'pending')).orderBy(desc(homeSliderImages.createdAt)),
        db.select().top(100).from(innovativeIdeas).where(eq(innovativeIdeas.status, 'pending')).orderBy(desc(innovativeIdeas.createdAt)),
        db.select().top(100).from(gallery).where(eq(gallery.status, 'pending')).orderBy(desc(gallery.createdAt)),
    ]);

    ok(res, {
        events: pendingEvents,
        sliderImages: pendingSliders,
        innovativeIdeas: pendingIdeas,
        gallery: pendingGallery,
        totalPending: pendingEvents.length + pendingSliders.length + pendingIdeas.length + pendingGallery.length
    });
});

export const approveEvent = asyncHandler(async (req: Request, res: Response) => {
    const id = positiveIntParam.parse(req.params.id);
    const adminId = getAdminId(req);

    const [updated] = await db.update(events).set({
        approvalStatus: 'approved',
        approvedById: adminId,
        approvedAt: new Date()
    }).where(and(eq(events.id, id), eq(events.approvalStatus, 'pending'))).output();

    if (!updated) throw new AppError('Event not found or already reviewed', 409, 'CONFLICT');

    ok(res, null, 'Event approved.');
});

export const rejectEvent = asyncHandler(async (req: Request, res: Response) => {
    const id = positiveIntParam.parse(req.params.id);
    getAdminId(req); // Enforce auth

    const [updated] = await db.update(events).set({
        approvalStatus: 'rejected',
        approvedById: null,
        approvedAt: null
    }).where(and(eq(events.id, id), eq(events.approvalStatus, 'pending'))).output();

    if (!updated) throw new AppError('Event not found or already reviewed', 409, 'CONFLICT');

    ok(res, null, 'Event rejected.');
});

export const approveSlider = asyncHandler(async (req: Request, res: Response) => {
    const id = positiveIntParam.parse(req.params.id);
    const adminId = getAdminId(req);

    const [updated] = await db.update(homeSliderImages).set({
        approvalStatus: 'approved',
        approvedById: adminId,
        approvedAt: new Date()
    }).where(and(eq(homeSliderImages.id, id), eq(homeSliderImages.approvalStatus, 'pending'))).output();

    if (!updated) throw new AppError('Slider image not found or already reviewed', 409, 'CONFLICT');

    ok(res, null, 'Slider image approved.');
});

export const rejectSlider = asyncHandler(async (req: Request, res: Response) => {
    const id = positiveIntParam.parse(req.params.id);
    getAdminId(req);

    const [updated] = await db.update(homeSliderImages).set({
        approvalStatus: 'rejected',
        approvedById: null,
        approvedAt: null
    }).where(and(eq(homeSliderImages.id, id), eq(homeSliderImages.approvalStatus, 'pending'))).output();

    if (!updated) throw new AppError('Slider image not found or already reviewed', 409, 'CONFLICT');

    ok(res, null, 'Slider image rejected.');
});

export const approveInnovativeIdea = asyncHandler(async (req: Request, res: Response) => {
    const id = positiveIntParam.parse(req.params.id);
    const adminId = getAdminId(req);

    const [updated] = await db.update(innovativeIdeas).set({
        status: 'approved',
        approvedById: adminId,
        approvedAt: new Date()
    }).where(and(eq(innovativeIdeas.id, id), eq(innovativeIdeas.status, 'pending'))).output();

    if (!updated) throw new AppError('Innovative idea not found or already reviewed', 409, 'CONFLICT');

    ok(res, null, 'Innovative idea approved.');
});

export const rejectInnovativeIdea = asyncHandler(async (req: Request, res: Response) => {
    const id = positiveIntParam.parse(req.params.id);
    getAdminId(req);

    const [updated] = await db.update(innovativeIdeas).set({
        status: 'rejected',
        approvedById: null,
        approvedAt: null
    }).where(and(eq(innovativeIdeas.id, id), eq(innovativeIdeas.status, 'pending'))).output();

    if (!updated) throw new AppError('Innovative idea not found or already reviewed', 409, 'CONFLICT');

    ok(res, null, 'Innovative idea rejected.');
});

export const approveGallery = asyncHandler(async (req: Request, res: Response) => {
    const id = positiveIntParam.parse(req.params.id);
    const adminId = getAdminId(req);

    const [updated] = await db.update(gallery).set({
        status: 'approved',
        reviewedById: adminId
    }).where(and(eq(gallery.id, id), eq(gallery.status, 'pending'))).output();

    if (!updated) throw new AppError('Gallery item not found or already reviewed', 409, 'CONFLICT');

    ok(res, null, 'Gallery item approved.');
});

export const rejectGallery = asyncHandler(async (req: Request, res: Response) => {
    const id = positiveIntParam.parse(req.params.id);
    const adminId = getAdminId(req);

    const [updated] = await db.update(gallery).set({
        status: 'rejected',
        reviewedById: adminId
    }).where(and(eq(gallery.id, id), eq(gallery.status, 'pending'))).output();

    if (!updated) throw new AppError('Gallery item not found or already reviewed', 409, 'CONFLICT');

    ok(res, null, 'Gallery item rejected.');
});
