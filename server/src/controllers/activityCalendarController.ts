import { Request, Response } from 'express';
import { db } from '../db';
import { activityCalendar, academicYears } from '../db/schema';
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
        
        const [ay] = await db.select({ isLocked: academicYears.isLocked }).top(1).from(academicYears).where(eq(academicYears.id, ayId));
        if (ay?.isLocked) return res.status(403).json({ success: false, message: 'Cannot add activity to a locked academic year.' });

        const { month, tentativeDate, activity, type } = req.body;
        
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
        const activityId = Number(req.params.id);
        
        const [act] = await db.select({ academicYearId: activityCalendar.academicYearId }).top(1).from(activityCalendar).where(eq(activityCalendar.id, activityId));
        if (!act) return res.status(404).json({ success: false, message: 'Activity not found.' });

        const [ay] = await db.select({ isLocked: academicYears.isLocked }).top(1).from(academicYears).where(eq(academicYears.id, act.academicYearId));
        if (ay?.isLocked) return res.status(403).json({ success: false, message: 'Cannot update activity in a locked academic year.' });

        const { month, tentativeDate, activity, type } = req.body;
        
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
        const activityId = Number(req.params.id);

        const [act] = await db.select({ academicYearId: activityCalendar.academicYearId }).top(1).from(activityCalendar).where(eq(activityCalendar.id, activityId));
        if (!act) return res.status(404).json({ success: false, message: 'Activity not found.' });

        const [ay] = await db.select({ isLocked: academicYears.isLocked }).top(1).from(academicYears).where(eq(academicYears.id, act.academicYearId));
        if (ay?.isLocked) return res.status(403).json({ success: false, message: 'Cannot delete activity in a locked academic year.' });

        await db.delete(activityCalendar).where(eq(activityCalendar.id, activityId));
        ok(res, null, 'Activity removed from calendar.');
    } catch (err) { handleError(res, err); }
};
