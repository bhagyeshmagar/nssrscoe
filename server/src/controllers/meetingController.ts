import { Response } from 'express';
import { ok, created } from '../lib/response';
import * as meetingService from '../services/meetingService';
import * as auditService from '../services/auditService';
import { ForbiddenError, ValidationError } from '../lib/errors';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

// Local schema for mark-attendance (not in shared lib since it's meeting-specific)
const markAttendanceSchema = z.object({
    status: z.enum(['present', 'absent', 'late']),
    notes:  z.string().trim().max(500).nullable().optional(),
});

/** Parse an integer from a route param; throws ValidationError on NaN. */
const parseId = (raw: string, label = 'ID'): number => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n <= 0) throw new ValidationError(`Invalid ${label}.`);
    return n;
};

export const createMeeting = async (req: AuthRequest, res: Response) => {
    const ayId = parseId(req.params.ayId, 'academic year ID');
    // Body already validated by middleware (createMeetingSchema from lib/schemas)
    const { title, description, meetingType, scheduledDate, location, sendEmail, specialCampId } = req.body;
    const parsed = {
        title,
        description,
        meetingType,
        scheduledDate: new Date(scheduledDate),
        location,
        sendEmail: !!sendEmail,
        specialCampId,
    };
    const meeting = await meetingService.createMeeting(ayId, parsed, req.user!.id);
    await auditService.logAudit({
        adminId: req.user!.id,
        action: 'CREATE_MEETING',
        entityType: 'meeting',
        entityId: meeting.id,
        academicYearId: ayId,
        details: { title: parsed.title, meetingType: parsed.meetingType },
    });
    created(res, meeting, 'Meeting created successfully.');
};

export const listMeetings = async (req: AuthRequest, res: Response) => {
    const ayId  = parseId(req.params.ayId, 'academic year ID');
    const type   = typeof req.query.type   === 'string' ? req.query.type   : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const meetings = await meetingService.listMeetings(ayId, type, status);
    ok(res, meetings);
};

export const getMeeting = async (req: AuthRequest, res: Response) => {
    const meetingId = parseId(req.params.meetingId, 'meeting ID');
    const meeting = await meetingService.getMeeting(meetingId);
    ok(res, meeting);
};

export const updateMeeting = async (req: AuthRequest, res: Response) => {
    const meetingId = parseId(req.params.meetingId, 'meeting ID');
    const meeting = await meetingService.getMeeting(meetingId);
    if (meeting.status === 'ended' && !req.user!.isSuperadmin) {
        throw new ForbiddenError('Only superadmin can edit ended meetings.');
    }
    // Whitelist updatable fields
    const { title, description, meetingType, scheduledDate, location, specialCampId } = req.body;
    const updatePayload: Partial<meetingService.CreateMeetingInput> = {};
    if (title !== undefined)       updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (meetingType !== undefined)  updatePayload.meetingType = meetingType;
    if (scheduledDate !== undefined) updatePayload.scheduledDate = new Date(scheduledDate);
    if (location !== undefined)    updatePayload.location = location;
    if (specialCampId !== undefined) updatePayload.specialCampId = specialCampId;

    const updated = await meetingService.updateMeeting(meetingId, updatePayload, req.user!.id);
    ok(res, updated);
};

export const startMeeting = async (req: AuthRequest, res: Response) => {
    const meetingId = parseId(req.params.meetingId, 'meeting ID');
    const meeting = await meetingService.startMeeting(meetingId, req.user!.id);
    ok(res, meeting);
};

export const endMeeting = async (req: AuthRequest, res: Response) => {
    const meetingId = parseId(req.params.meetingId, 'meeting ID');
    const meeting = await meetingService.endMeeting(meetingId, req.user!.id);
    ok(res, meeting);
};

export const reopenMeeting = async (req: AuthRequest, res: Response) => {
    if (!req.user!.isSuperadmin) throw new ForbiddenError('Only superadmin can re-open meetings.');
    const meetingId = parseId(req.params.meetingId, 'meeting ID');
    const meeting = await meetingService.reopenMeeting(meetingId, req.user!.id);
    ok(res, meeting);
};

export const deleteMeeting = async (req: AuthRequest, res: Response) => {
    if (!req.user!.isSuperadmin) throw new ForbiddenError('Only superadmin can delete meetings.');
    const meetingId = parseId(req.params.meetingId, 'meeting ID');
    await meetingService.deleteMeeting(meetingId, req.user!.id);
    ok(res, null, 'Meeting deleted.');
};

export const getAttendance = async (req: AuthRequest, res: Response) => {
    const meetingId = parseId(req.params.meetingId, 'meeting ID');
    const [attendance, stats] = await Promise.all([
        meetingService.getMeetingAttendance(meetingId),
        meetingService.getMeetingAttendanceStats(meetingId),
    ]);
    ok(res, { attendance, stats });
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
    const meetingId   = parseId(req.params.meetingId,  'meeting ID');
    const volunteerId = parseId(req.params.volunteerId, 'volunteer ID');
    const parsed = markAttendanceSchema.parse(req.body);

    const meeting = await meetingService.getMeeting(meetingId);
    if (meeting.status !== 'active' && !req.user!.isSuperadmin) {
        throw new ForbiddenError('Only superadmin can modify attendance of an inactive meeting.');
    }

    const attendance = await meetingService.markMeetingAttendance(
        meetingId,
        volunteerId,
        parsed.status,
        parsed.notes ?? null,
        req.user!.id,
    );
    ok(res, attendance);
};

export const getAttendanceStats = async (req: AuthRequest, res: Response) => {
    const meetingId = parseId(req.params.meetingId, 'meeting ID');
    const stats = await meetingService.getMeetingAttendanceStats(meetingId);
    ok(res, stats);
};

export const exportAttendance = async (req: AuthRequest, res: Response) => {
    const meetingId = parseId(req.params.meetingId, 'meeting ID');
    const data = await meetingService.exportMeetingAttendance(meetingId);
    ok(res, data);
};
