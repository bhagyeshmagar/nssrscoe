import { Request, Response } from 'express';
import { db } from '../db';
import { activityCalendar } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { ok, created, handleError } from '../lib/response';

export const getByAcademicYear = async (req: Request, res: Response) => {
    try {
        const ayId = Number(req.params.ayId);
        const data = await db
            .select()
            .from(activityCalendar)
            .where(eq(activityCalendar.academicYearId, ayId))
            .orderBy(asc(activityCalendar.id));
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const createActivity = async (req: Request, res: Response) => {
    try {
        const ayId = Number(req.params.ayId);
        const { month, tentativeDate, activity, type } = req.body;
        
        const [newItem] = await db.insert(activityCalendar).values({
            academicYearId: ayId,
            month,
            tentativeDate,
            activity,
            type
        }).returning();
        
        created(res, newItem, 'Activity added to calendar.');
    } catch (err) { handleError(res, err); }
};

export const updateActivity = async (req: Request, res: Response) => {
    try {
        const activityId = Number(req.params.id);
        const { month, tentativeDate, activity, type } = req.body;
        
        const [updatedItem] = await db.update(activityCalendar).set({
            month,
            tentativeDate,
            activity,
            type
        }).where(eq(activityCalendar.id, activityId)).returning();
        
        ok(res, updatedItem, 'Activity updated.');
    } catch (err) { handleError(res, err); }
};

export const deleteActivity = async (req: Request, res: Response) => {
    try {
        const activityId = Number(req.params.id);
        await db.delete(activityCalendar).where(eq(activityCalendar.id, activityId));
        ok(res, null, 'Activity removed from calendar.');
    } catch (err) { handleError(res, err); }
};
