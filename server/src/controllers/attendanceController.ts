import { Request, Response } from 'express';
import * as attService from '../services/attendanceService';
import { ok, created, noContent, handleError } from '../lib/response';
import { AuthRequest } from '../middleware/auth';

export const listSessions = async (req: Request, res: Response) => {
    try {
        const data = await attService.listSessions(Number(req.params.ayId), {
            eventId: req.query.eventId ? Number(req.query.eventId) : undefined,
        });
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const createSession = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const session = await attService.createSession(Number(req.params.ayId), req.body, adminId);
        created(res, session, 'Attendance session created.');
    } catch (err) { handleError(res, err); }
};

export const getSession = async (req: Request, res: Response) => {
    try {
        const data = await attService.getSession(Number(req.params.sessionId));
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const deleteSession = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        await attService.deleteSession(Number(req.params.sessionId), adminId);
        noContent(res);
    } catch (err) { handleError(res, err); }
};

export const markAttendance = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const { records } = req.body;
        const data = await attService.markAttendance(Number(req.params.sessionId), records, adminId);
        ok(res, data, 'Attendance recorded.');
    } catch (err) { handleError(res, err); }
};

export const getAYSummary = async (req: Request, res: Response) => {
    try {
        const data = await attService.getAYAttendanceSummary(Number(req.params.ayId));
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const getVolunteerAttendance = async (req: Request, res: Response) => {
    try {
        const data = await attService.getVolunteerAttendance(
            Number(req.params.ayId),
            Number(req.params.volunteerId),
        );
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const getEventAttendance = async (req: Request, res: Response) => {
    try {
        const data = await attService.getEventAttendance(
            Number(req.params.ayId),
            Number(req.params.eventId)
        );
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const saveEventAttendance = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const { records } = req.body;
        const data = await attService.saveEventAttendance(
            Number(req.params.ayId),
            Number(req.params.eventId),
            records,
            adminId
        );
        ok(res, data, 'Event attendance recorded.');
    } catch (err) { handleError(res, err); }
};
