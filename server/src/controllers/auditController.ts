import { Request, Response } from 'express';
import { db } from '../db';
import { auditLogs } from '../db/schema';
import { handleError, paginated } from '../lib/response';
import { desc, count } from 'drizzle-orm';

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page as string)  || 1);
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
        const offset = (page - 1) * limit;

        const [totalCountResult] = await db.select({ value: count() }).from(auditLogs);
        const total = totalCountResult.value;

        const logs = await db.select()
            .from(auditLogs)
            .orderBy(desc(auditLogs.createdAt))
            .offset(offset).fetch(limit);

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
