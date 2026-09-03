import { Request, Response } from 'express';
import { db } from '../db';
import { activityCalendar, academicYears } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { ok, created, handleError } from '../lib/response';
import { z } from 'zod';
import { ForbiddenError, NotFoundError } from '../lib/errors';
import { positiveIntParam } from '../lib/schemas';

const activitySchema = z.object({
    month: z.string().trim().min(1, 'Month is required.'),
    tentativeDate: z.string().trim().min(1, 'Tentative date is required.'),
    activity: z.string().trim().min(1, 'Activity name is required.'),
    type: z.string().trim().min(1, 'Type is required.'),
});

export const getByAcademicYear = async (req: Request, res: Response) => {
    try {
        const ayId = positiveIntParam.parse(req.params.ayId);
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
        const ayId = positiveIntParam.parse(req.params.ayId);
        
        const [ay] = await db.select({ isLocked: academicYears.isLocked }).top(1).from(academicYears).where(eq(academicYears.id, ayId));
        if (ay?.isLocked) throw new ForbiddenError('Cannot add activity to a locked academic year.');

        const { month, tentativeDate, activity, type } = activitySchema.parse(req.body);
        
        const [newItem] = await db.insert(activityCalendar).output().values({
            academicYearId: ayId,
            month,
            tentativeDate,
            activity,
            type
        });
        
        created(res, newItem, 'Activity added to calendar.');
    } catch (err) { handleError(res, err); }
};

export const updateActivity = async (req: Request, res: Response) => {
    try {
        const activityId = positiveIntParam.parse(req.params.id);
        
        const [act] = await db.select({ academicYearId: activityCalendar.academicYearId }).top(1).from(activityCalendar).where(eq(activityCalendar.id, activityId));
        if (!act) throw new NotFoundError('Activity not found.');

        const [ay] = await db.select({ isLocked: academicYears.isLocked }).top(1).from(academicYears).where(eq(academicYears.id, act.academicYearId));
        if (ay?.isLocked) throw new ForbiddenError('Cannot update activity in a locked academic year.');

        const { month, tentativeDate, activity, type } = activitySchema.parse(req.body);
        
        const [updatedItem] = await db.update(activityCalendar).set({
            month,
            tentativeDate,
            activity,
            type
        }).where(eq(activityCalendar.id, activityId)).output();
        
        ok(res, updatedItem, 'Activity updated.');
    } catch (err) { handleError(res, err); }
};

export const deleteActivity = async (req: Request, res: Response) => {
    try {
        const activityId = positiveIntParam.parse(req.params.id);

        const [act] = await db.select({ academicYearId: activityCalendar.academicYearId }).top(1).from(activityCalendar).where(eq(activityCalendar.id, activityId));
        if (!act) throw new NotFoundError('Activity not found.');

        const [ay] = await db.select({ isLocked: academicYears.isLocked }).top(1).from(academicYears).where(eq(academicYears.id, act.academicYearId));
        if (ay?.isLocked) throw new ForbiddenError('Cannot delete activity in a locked academic year.');

        await db.delete(activityCalendar).where(eq(activityCalendar.id, activityId));
        ok(res, null, 'Activity removed from calendar.');
    } catch (err) { handleError(res, err); }
};
