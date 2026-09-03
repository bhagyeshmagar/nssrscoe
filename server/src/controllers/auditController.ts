import { Request, Response } from 'express';
import { db } from '../db';
import { auditLogs, admins } from '../db/schema';
import { handleError, paginated } from '../lib/response';
import { desc, count, eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(200).default(50),
    action: z.string().optional(),
    entityType: z.string().optional(),
    performedById: z.coerce.number().int().positive().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
}); 

const selectFields = {
    id:             auditLogs.id,
    action:         auditLogs.action,
    entityType:     auditLogs.entityType,
    entityId:       auditLogs.entityId,
    performedById:  auditLogs.performedById,
    performedByUsername: admins.username,
    academicYearId: auditLogs.academicYearId,
    details:        auditLogs.details,
    createdAt:      auditLogs.createdAt,
};

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const { page, limit, action, entityType, performedById, startDate, endDate } = paginationSchema.parse(req.query);
        const offset = (page - 1) * limit;

        const conditions = [];
        if (action) conditions.push(eq(auditLogs.action, action));
        if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
        if (performedById) conditions.push(eq(auditLogs.performedById, performedById));
        
        if (startDate) {
            const start = new Date(startDate);
            conditions.push(sql`${auditLogs.createdAt} >= ${start}`);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            conditions.push(sql`${auditLogs.createdAt} <= ${end}`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [totalCountResult] = await db
            .select({ value: count() })
            .from(auditLogs)
            .where(whereClause);
            
        const total = totalCountResult.value;

        const logs = await db
            .select(selectFields)
            .from(auditLogs)
            .leftJoin(admins, eq(auditLogs.performedById, admins.id))
            .where(whereClause)
            .orderBy(desc(auditLogs.createdAt))
            .offset(offset)
            .fetch(limit);

        paginated(res, logs, {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        handleError(res, error);
    }
};
