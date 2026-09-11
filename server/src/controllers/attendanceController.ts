import { Request, Response } from 'express';
import * as attService from '../services/attendanceService';
import { ok, created, noContent, handleError } from '../lib/response';
import { AuthRequest, getAdminId } from '../middleware/auth';
import { z } from 'zod';
import { positiveIntParam } from '../lib/schemas';

const createSessionSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    date: z.string().datetime({ message: 'Must be a valid ISO date' }),
    eventId: positiveIntParam.optional(),
    description: z.string().max(1000).optional()
});

const markAttendanceSchema = z.object({
    records: z.array(z.object({
        volunteerId: z.coerce.number().int().positive(),
        status: z.enum(['present', 'absent', 'late']),
        notes: z.string().max(500).optional()
    })).min(1, 'At least one attendance record is required')
}).refine(data => {
    const ids = data.records.map(r => r.volunteerId);
    return new Set(ids).size === ids.length;
}, { message: 'Duplicate volunteer IDs in records array are not allowed' });

export const listSessions = async (req: Request, res: Response) => {
    try {
        const ayId = positiveIntParam.parse(req.params.ayId);
        const eventId = req.query.eventId ? positiveIntParam.parse(req.query.eventId) : undefined;
        
        const data = await attService.listSessions(ayId, { eventId });
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const createSession = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const ayId = positiveIntParam.parse(req.params.ayId);
        const body = createSessionSchema.parse(req.body);
        
        const session = await attService.createSession(ayId, body, adminId);
        created(res, session, 'Attendance session created.');
    } catch (err) { handleError(res, err); }
};

export const getSession = async (req: Request, res: Response) => {
    try {
        const sessionId = positiveIntParam.parse(req.params.sessionId);
        const data = await attService.getSession(sessionId);
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const deleteSession = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const sessionId = positiveIntParam.parse(req.params.sessionId);
        
        await attService.deleteSession(sessionId, adminId);
        noContent(res);
    } catch (err) { handleError(res, err); }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const sessionId = positiveIntParam.parse(req.params.sessionId);
        const { records } = markAttendanceSchema.parse(req.body);
        
        const data = await attService.markAttendance(sessionId, records, adminId);
        ok(res, data, 'Attendance recorded.');
    } catch (err) { handleError(res, err); }
};

export const getAYSummary = async (req: Request, res: Response) => {
    try {
        const ayId = positiveIntParam.parse(req.params.ayId);
        const data = await attService.getAYAttendanceSummary(ayId);
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const getVolunteerAttendance = async (req: Request, res: Response) => {
    try {
        const ayId = positiveIntParam.parse(req.params.ayId);
        const volunteerId = positiveIntParam.parse(req.params.volunteerId);
        
        const data = await attService.getVolunteerAttendance(ayId, volunteerId);
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const getEventAttendance = async (req: Request, res: Response) => {
    try {
        const ayId = positiveIntParam.parse(req.params.ayId);
        const eventId = positiveIntParam.parse(req.params.eventId);
        
        const data = await attService.getEventAttendance(ayId, eventId);
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const saveEventAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const ayId = positiveIntParam.parse(req.params.ayId);
        const eventId = positiveIntParam.parse(req.params.eventId);
        const { records } = markAttendanceSchema.parse(req.body);
        
        const data = await attService.saveEventAttendance(ayId, eventId, records, adminId);
        ok(res, data, 'Event attendance recorded.');
    } catch (err) { handleError(res, err); }
};
