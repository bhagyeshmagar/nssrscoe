import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { requireAYUnlocked } from '../middleware/ayLock';
import { validateRequest } from '../middleware/validate';
import { createMeetingSchema, updateMeetingSchema } from '../lib/schemas/meeting.schema';
import { catchAsync } from '../lib/errors';
import * as meetingController from '../controllers/meetingController';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticateToken);

// ── Admin Routes ─────────────────────────────────────────────────────────────
// (requireAdmin applied per-route below to not block volunteer attendance endpoints)

// ── AY-Scoped Meeting Endpoints ────────────────────────────────────────────────
router.post('/academic-years/:ayId/meetings', requireAdmin, requireAYUnlocked, validateRequest(createMeetingSchema), catchAsync(meetingController.createMeeting));
router.get('/academic-years/:ayId/meetings', requireAdmin, catchAsync(meetingController.listMeetings));

// ── Meeting-Specific Endpoints ─────────────────────────────────────────────────
router.get('/meetings/:meetingId', requireAdmin, catchAsync(meetingController.getMeeting));
router.put('/meetings/:meetingId', requireAdmin, validateRequest(updateMeetingSchema), catchAsync(meetingController.updateMeeting));
router.delete('/meetings/:meetingId', requireAdmin, catchAsync(meetingController.deleteMeeting));

// Lifecycle actions
router.post('/meetings/:meetingId/start', requireAdmin, catchAsync(meetingController.startMeeting));
router.post('/meetings/:meetingId/end', requireAdmin, catchAsync(meetingController.endMeeting));
router.post('/meetings/:meetingId/reopen', requireAdmin, catchAsync(meetingController.reopenMeeting));

// Attendance
router.get('/meetings/:meetingId/attendance', requireAdmin, catchAsync(meetingController.getAttendance));
router.post('/meetings/:meetingId/attendance/volunteers/:volunteerId', requireAdmin, catchAsync(meetingController.markAttendance));
router.get('/meetings/:meetingId/attendance/stats', requireAdmin, catchAsync(meetingController.getAttendanceStats));
router.get('/meetings/:meetingId/attendance/export', requireAdmin, catchAsync(meetingController.exportAttendance));

export default router;
