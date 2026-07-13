import { Response } from 'express';
import { ok, created } from '../lib/response';
import * as meetingService from '../services/meetingService';
import * as auditService from '../services/auditService';
import { ForbiddenError, ValidationError } from '../lib/errors';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const createMeetingSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    meetingType: z.enum(['regular', 'core_team', 'special_camp']),
    scheduledDate: z.string().transform(str => new Date(str)),
    location: z.string().min(1),
    sendEmail: z.boolean().optional().default(false),
    specialCampId: z.number().optional(),
});

const markAttendanceSchema = z.object({
    status: z.enum(['present', 'absent', 'late']),
    notes: z.string().nullable().optional(),
});

export const createMeeting = async (req: AuthRequest, res: Response) => {
    const ayId = parseInt(req.params.ayId);
    const parsed = createMeetingSchema.parse(req.body);
    const meeting = await meetingService.createMeeting(ayId, parsed, req.user!.id);
    await auditService.logAudit({
        adminId: req.user!.id,
        action: 'CREATE_MEETING',
        entityType: 'meeting',
        entityId: meeting.id,
        academicYearId: ayId,
        details: { title: parsed.title, meetingType: parsed.meetingType },
    });
    created(res, meeting, 'Meeting created successfully');
};

export const listMeetings = async (req: AuthRequest, res: Response) => {
    const ayId = parseInt(req.params.ayId);
    const type = req.query.type as string;
    const status = req.query.status as string;
    const meetings = await meetingService.listMeetings(ayId, type, status);
    ok(res, meetings);
};

export const getMeeting = async (req: AuthRequest, res: Response) => {
    const meetingId = parseInt(req.params.meetingId);
    const meeting = await meetingService.getMeeting(meetingId);
    ok(res, meeting);
};

export const updateMeeting = async (req: AuthRequest, res: Response) => {
    const meetingId = parseInt(req.params.meetingId);
    // Only superadmin can edit ended meetings, checked in frontend, but backend will just check
    const meeting = await meetingService.getMeeting(meetingId);
    if (meeting.status === 'ended' && !req.user!.isSuperadmin) {
        throw new ForbiddenError('Only superadmin can edit ended meetings');
    }
    const updated = await meetingService.updateMeeting(meetingId, req.body, req.user!.id);
    ok(res, updated);
};

export const startMeeting = async (req: AuthRequest, res: Response) => {
    const meetingId = parseInt(req.params.meetingId);
    const meeting = await meetingService.startMeeting(meetingId, req.user!.id);
    ok(res, meeting);
};

export const endMeeting = async (req: AuthRequest, res: Response) => {
    const meetingId = parseInt(req.params.meetingId);
    const meeting = await meetingService.endMeeting(meetingId, req.user!.id);
    ok(res, meeting);
};

export const reopenMeeting = async (req: AuthRequest, res: Response) => {
    if (!req.user!.isSuperadmin) throw new ForbiddenError('Only superadmin can re-open meetings');
    const meetingId = parseInt(req.params.meetingId);
    const meeting = await meetingService.reopenMeeting(meetingId, req.user!.id);
    ok(res, meeting);
};

export const deleteMeeting = async (req: AuthRequest, res: Response) => {
    if (!req.user!.isSuperadmin) throw new ForbiddenError('Only superadmin can delete meetings');
    const meetingId = parseInt(req.params.meetingId);
    await meetingService.deleteMeeting(meetingId, req.user!.id);
    ok(res, null, 'Meeting deleted successfully');
};

export const getAttendance = async (req: AuthRequest, res: Response) => {
    const meetingId = parseInt(req.params.meetingId);
    const attendance = await meetingService.getMeetingAttendance(meetingId);
    const stats = await meetingService.getMeetingAttendanceStats(meetingId);
    ok(res, { attendance, stats });
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
    const meetingId = parseInt(req.params.meetingId);
    const volunteerId = parseInt(req.params.volunteerId);
    const parsed = markAttendanceSchema.parse(req.body);

    const meeting = await meetingService.getMeeting(meetingId);
    if (meeting.status !== 'active' && !req.user!.isSuperadmin) {
        throw new ForbiddenError('Only superadmin can modify attendance of an inactive meeting');
    }

    const attendance = await meetingService.markMeetingAttendance(meetingId, volunteerId, parsed.status, parsed.notes || null, req.user!.id);
    ok(res, attendance);
};

export const getAttendanceStats = async (req: AuthRequest, res: Response) => {
    const meetingId = parseInt(req.params.meetingId);
    const stats = await meetingService.getMeetingAttendanceStats(meetingId);
    ok(res, stats);
};

export const exportAttendance = async (req: AuthRequest, res: Response) => {
    const meetingId = parseInt(req.params.meetingId);
    const data = await meetingService.exportMeetingAttendance(meetingId);
    ok(res, data);
};
