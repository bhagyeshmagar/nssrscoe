import { Response, Request } from 'express';
import { db } from '../db';
import { achievements, academicYears } from '../db/schema';
import { eq, desc, isNull, and } from 'drizzle-orm';
import { ok, handleError } from '../lib/response';

const selectFields = {
    id:               achievements.id,
    title:            achievements.title,
    description:      achievements.description,
    imageUrl:         achievements.imageUrl,
    date:             achievements.date,
    academicYearId:   achievements.academicYearId,
    createdAt:        achievements.createdAt,
    academicYearLabel: academicYears.label,
};

export const getPublicAchievements = async (req: Request, res: Response) => {
    try {
        const { academicYearId, limit } = req.query;
        // Default to a sane cap of 50 for this public endpoint, maximum 100
        // Note: limit=0 currently falls back to 50 (0 is falsy); fine since no caller needs zero rows.
        const parsedLimit = limit ? Math.min(Number(limit) || 50, 100) : 50;

        let query = db
            .select(selectFields)
            .from(achievements)
            .leftJoin(academicYears, eq(achievements.academicYearId, academicYears.id))
            .$dynamic();

        const conditions = [isNull(achievements.deletedAt)];

        if (academicYearId && academicYearId !== 'all') {
            conditions.push(eq(achievements.academicYearId, Number(academicYearId)));
        }

        query = query
            .where(and(...conditions))
            .orderBy(desc(achievements.date))
            .offset(0)
            .fetch(parsedLimit);

        const rows = await query;

        return ok(res, rows);
    } catch (e) {
        return handleError(res, e);
    }
};
