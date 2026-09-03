import { Response } from 'express';
import { ok, created, handleError } from '../lib/response';
import * as meetingService from '../services/meetingService';
import * as auditService from '../services/auditService';
import { ForbiddenError, ValidationError } from '../lib/errors';
import { z } from 'zod';
import { AuthRequest, getAdminId } from '../middleware/auth';
import { positiveIntParam } from '../lib/schemas';

// Local schema for mark-attendance (not in shared lib since it's meeting-specific)
const markAttendanceSchema = z.object({
    status: z.enum(['present', 'absent', 'late']),
    notes:  z.string().trim().max(500).nullable().optional(),
});

const listMeetingsSchema = z.object({
    type: z.string().trim().optional(),
    status: z.string().trim().optional(),
});

// Removed parseId helper in favor of positiveIntParam

export const createMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const ayId = positiveIntParam.parse(req.params.ayId);
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
        const adminId = getAdminId(req);
        const meeting = await meetingService.createMeeting(ayId, parsed, adminId);
        await auditService.logAudit({
            adminId,
            action: 'CREATE_MEETING',
            entityType: 'meeting',
            entityId: meeting.id,
            academicYearId: ayId,
            details: { title: parsed.title, meetingType: parsed.meetingType },
        });
        created(res, meeting, 'Meeting created successfully.');
    } catch (err) { handleError(res, err); }
};

export const listMeetings = async (req: AuthRequest, res: Response) => {
    try {
        const ayId  = positiveIntParam.parse(req.params.ayId);
        const { type, status } = listMeetingsSchema.parse(req.query);
        const meetings = await meetingService.listMeetings(ayId, type, status);
        ok(res, meetings);
    } catch (err) { handleError(res, err); }
};

export const getMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const meetingId = positiveIntParam.parse(req.params.meetingId);
        const meeting = await meetingService.getMeeting(meetingId);
        ok(res, meeting);
    } catch (err) { handleError(res, err); }
};

export const updateMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const meetingId = positiveIntParam.parse(req.params.meetingId);
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

        const updated = await meetingService.updateMeeting(meetingId, updatePayload, getAdminId(req));
        ok(res, updated);
    } catch (err) { handleError(res, err); }
};

export const startMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const meetingId = positiveIntParam.parse(req.params.meetingId);
        const meeting = await meetingService.startMeeting(meetingId, getAdminId(req));
        ok(res, meeting);
    } catch (err) { handleError(res, err); }
};

export const endMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const meetingId = positiveIntParam.parse(req.params.meetingId);
        const meeting = await meetingService.endMeeting(meetingId, getAdminId(req));
        ok(res, meeting);
    } catch (err) { handleError(res, err); }
};

export const reopenMeeting = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user!.isSuperadmin) throw new ForbiddenError('Only superadmin can re-open meetings.');
        const meetingId = positiveIntParam.parse(req.params.meetingId);
        const meeting = await meetingService.reopenMeeting(meetingId, getAdminId(req));
        ok(res, meeting);
    } catch (err) { handleError(res, err); }
};

export const deleteMeeting = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user!.isSuperadmin) throw new ForbiddenError('Only superadmin can delete meetings.');
        const meetingId = positiveIntParam.parse(req.params.meetingId);
        await meetingService.deleteMeeting(meetingId, getAdminId(req));
        ok(res, null, 'Meeting deleted.');
    } catch (err) { handleError(res, err); }
};

export const getAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const meetingId = positiveIntParam.parse(req.params.meetingId);
        const [attendance, stats] = await Promise.all([
            meetingService.getMeetingAttendance(meetingId),
            meetingService.getMeetingAttendanceStats(meetingId),
        ]);
        ok(res, { attendance, stats });
    } catch (err) { handleError(res, err); }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const meetingId   = positiveIntParam.parse(req.params.meetingId);
        const volunteerId = positiveIntParam.parse(req.params.volunteerId);
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
            getAdminId(req),
        );
        ok(res, attendance);
    } catch (err) { handleError(res, err); }
};

export const getAttendanceStats = async (req: AuthRequest, res: Response) => {
    try {
        const meetingId = positiveIntParam.parse(req.params.meetingId);
        const stats = await meetingService.getMeetingAttendanceStats(meetingId);
        ok(res, stats);
    } catch (err) { handleError(res, err); }
};

export const exportAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const meetingId = positiveIntParam.parse(req.params.meetingId);
        const data = await meetingService.exportMeetingAttendance(meetingId);
        ok(res, data);
    } catch (err) { handleError(res, err); }
};
