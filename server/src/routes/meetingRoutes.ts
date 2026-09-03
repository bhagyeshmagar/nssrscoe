import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { requireAYUnlocked } from '../middleware/ayLock';
import { validateRequest } from '../middleware/validate';
import { createMeetingSchema, updateMeetingSchema } from '../lib/schemas/meeting.schema';
import { catchAsync } from '../lib/errors';
import * as meetingController from '../controllers/meetingController';

const router = Router({ mergeParams: true });

// ── Admin Routes ─────────────────────────────────────────────────────────────
// (requireAdmin applied per-route below to not block volunteer attendance endpoints)

// ── AY-Scoped Meeting Endpoints ────────────────────────────────────────────────
router.post('/academic-years/:ayId/meetings', authenticateToken, requireAdmin, requireAYUnlocked, validateRequest(createMeetingSchema), catchAsync(meetingController.createMeeting));
router.get('/academic-years/:ayId/meetings', authenticateToken, requireAdmin, catchAsync(meetingController.listMeetings));

// ── Meeting-Specific Endpoints ─────────────────────────────────────────────────
router.get('/meetings/:meetingId', authenticateToken, requireAdmin, catchAsync(meetingController.getMeeting));
router.put('/meetings/:meetingId', authenticateToken, requireAdmin, validateRequest(updateMeetingSchema), catchAsync(meetingController.updateMeeting));
router.delete('/meetings/:meetingId', authenticateToken, requireAdmin, catchAsync(meetingController.deleteMeeting));

// Lifecycle actions
router.post('/meetings/:meetingId/start', authenticateToken, requireAdmin, catchAsync(meetingController.startMeeting));
router.post('/meetings/:meetingId/end', authenticateToken, requireAdmin, catchAsync(meetingController.endMeeting));
router.post('/meetings/:meetingId/reopen', authenticateToken, requireAdmin, catchAsync(meetingController.reopenMeeting));

// Attendance
router.get('/meetings/:meetingId/attendance', authenticateToken, requireAdmin, catchAsync(meetingController.getAttendance));
router.post('/meetings/:meetingId/attendance/volunteers/:volunteerId', authenticateToken, requireAdmin, catchAsync(meetingController.markAttendance));
router.get('/meetings/:meetingId/attendance/stats', authenticateToken, requireAdmin, catchAsync(meetingController.getAttendanceStats));
router.get('/meetings/:meetingId/attendance/export', authenticateToken, requireAdmin, catchAsync(meetingController.exportAttendance));

export default router;
