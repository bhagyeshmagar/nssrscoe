import { Request, Response } from 'express';
import { db } from '../db';
import { auditLogs } from '../db/schema';
import { handleError, ok, paginated } from '../lib/response';
import { desc, count, SQL } from 'drizzle-orm';

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;

        const filters: SQL[] = [];

        // Count total
        const [totalCountResult] = await db.select({ value: count() }).from(auditLogs);
        const total = totalCountResult.value;

        // Fetch paginated
        const logs = await db.select()
            .from(auditLogs)
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit)
            .offset(offset);

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
