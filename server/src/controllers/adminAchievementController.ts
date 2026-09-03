import { Response, Request } from 'express';
import { db } from '../db';
import { achievements, academicYears, admins } from '../db/schema';
import { eq, desc, isNull, and, count } from 'drizzle-orm';
import { ok, created, noContent, handleError, paginated } from '../lib/response';
import { AppError } from '../lib/errors';
import { z } from 'zod';
import { AuthRequest, getAdminId } from '../middleware/auth';
import { positiveIntParam } from '../lib/schemas';
import { deleteUploadedFile } from '../lib/fileUtils';

const achievementSchema = z.object({
    title:          z.string().min(1).max(255),
    description:    z.string().min(1),
    imageUrl:       z.string().min(1),
    date:           z.string().refine(v => !isNaN(Date.parse(v)), 'Invalid date'),
    academicYearId: z.number().int().optional().nullable(),
});

const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    academicYearId: z.union([positiveIntParam, z.literal('all')]).optional(),
});

const selectFields = {
    id:              achievements.id,
    title:           achievements.title,
    description:     achievements.description,
    imageUrl:        achievements.imageUrl,
    date:            achievements.date,
    academicYearId:  achievements.academicYearId,
    createdAt:       achievements.createdAt,
    updatedAt:       achievements.updatedAt,
    updatedById:     achievements.updatedById,
    deletedAt:       achievements.deletedAt,
    deletedById:     achievements.deletedById,
    academicYearLabel: academicYears.label,
};

export const getAchievements = async (req: Request, res: Response) => {
    try {
        const { page, limit, academicYearId } = paginationSchema.parse(req.query);
        const offset = (page - 1) * limit;

        let baseQuery = db
            .select(selectFields)
            .from(achievements)
            .leftJoin(academicYears, eq(achievements.academicYearId, academicYears.id))
            .$dynamic();
            
        let countQuery = db.select({ count: count() }).from(achievements).$dynamic();

        if (academicYearId && academicYearId !== 'all') {
            baseQuery = baseQuery.where(eq(achievements.academicYearId, Number(academicYearId)));
            countQuery = countQuery.where(eq(achievements.academicYearId, Number(academicYearId)));
        }

        const [totalRes] = await countQuery;
        const total = totalRes.count;

        const rows = await baseQuery
            .orderBy(desc(achievements.date))
            .offset(offset)
            .fetch(limit);

        const totalPages = Math.ceil(total / limit);
        return paginated(res, rows, { page, limit, total, totalPages });
    } catch (e) {
        return handleError(res, e);
    }
};

export const createAchievement = async (req: AuthRequest, res: Response) => {
    try {
        const body = achievementSchema.parse(req.body);
        const adminId = req.user?.id;

        const [row] = await db.insert(achievements).output({ id: achievements.id }).values({
            title:          body.title,
            description:    body.description,
            imageUrl:       body.imageUrl,
            date:           new Date(body.date),
            academicYearId: body.academicYearId ?? null,
            createdById:    adminId ?? null,
        });

        const [newRecord] = await db
            .select(selectFields)
            .from(achievements)
            .leftJoin(academicYears, eq(achievements.academicYearId, academicYears.id))
            .where(eq(achievements.id, row.id));

        return created(res, newRecord);
    } catch (e) {
        return handleError(res, e);
    }
};

export const updateAchievement = async (req: AuthRequest, res: Response) => {
    try {
        const id = positiveIntParam.parse(req.params.id);
        const body = achievementSchema.parse(req.body);

        const adminId = req.user?.id;

        const [existing] = await db.select({ id: achievements.id, imageUrl: achievements.imageUrl })
            .from(achievements)
            .where(and(eq(achievements.id, id), isNull(achievements.deletedAt)));
        if (!existing) throw new AppError('Achievement not found', 404, 'NOT_FOUND');

        // Note: Old image cleanup is handled client-side via a separate delete call when the URL changes.
        // We don't delete `existing.imageUrl` here to avoid double-delete races with the frontend.
        await db.update(achievements).set({
            title:          body.title,
            description:    body.description,
            imageUrl:       body.imageUrl,
            date:           new Date(body.date),
            academicYearId: body.academicYearId ?? null,
            updatedAt:      new Date(),
            updatedById:    adminId ?? null,
        }).where(eq(achievements.id, id));

        const [updated] = await db
            .select(selectFields)
            .from(achievements)
            .leftJoin(academicYears, eq(achievements.academicYearId, academicYears.id))
            .where(eq(achievements.id, id));

        return ok(res, updated);
    } catch (e) {
        return handleError(res, e);
    }
};

export const deleteAchievement = async (req: AuthRequest, res: Response) => {
    try {
        const id = positiveIntParam.parse(req.params.id);
        const adminId = req.user?.id;

        const [existing] = await db.select({ id: achievements.id, imageUrl: achievements.imageUrl })
            .from(achievements)
            .where(and(eq(achievements.id, id), isNull(achievements.deletedAt)));
        if (!existing) throw new AppError('Achievement not found', 404, 'NOT_FOUND');

        await db.update(achievements).set({
            deletedAt: new Date(),
            deletedById: adminId ?? null,
        }).where(eq(achievements.id, id));

        if (existing.imageUrl) {
            await deleteUploadedFile(existing.imageUrl);
        }
        return noContent(res);
    } catch (e) {
        return handleError(res, e);
    }
};

export const restoreAchievement = async (req: AuthRequest, res: Response) => {
    try {
        const id = positiveIntParam.parse(req.params.id);

        const [existing] = await db.select({ id: achievements.id, deletedAt: achievements.deletedAt })
            .from(achievements)
            .where(eq(achievements.id, id));
            
        if (!existing) throw new AppError('Achievement not found', 404, 'NOT_FOUND');
        if (!existing.deletedAt) throw new AppError('Achievement is not deleted', 400, 'BAD_REQUEST');

        await db.update(achievements).set({
            deletedAt: null,
            deletedById: null,
            updatedAt: new Date(),
            updatedById: getAdminId(req),
        }).where(eq(achievements.id, id));

        const [updated] = await db
            .select(selectFields)
            .from(achievements)
            .leftJoin(academicYears, eq(achievements.academicYearId, academicYears.id))
            .where(eq(achievements.id, id));

        return ok(res, updated);
    } catch (e) {
        return handleError(res, e);
    }
};
