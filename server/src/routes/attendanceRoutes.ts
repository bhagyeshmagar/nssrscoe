import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { requireAYUnlocked } from '../middleware/ayLock';
import * as attCtrl from '../controllers/attendanceController';

// AY-scoped attendance router (mergeParams: true, mounted under /:ayId/attendance)
export const ayAttendanceRouter = Router({ mergeParams: true });

ayAttendanceRouter.get('/sessions',       authenticateToken, requireAdmin, attCtrl.listSessions);
ayAttendanceRouter.post('/sessions',      authenticateToken, requireAdmin, requireAYUnlocked, attCtrl.createSession);
ayAttendanceRouter.get('/summary',        authenticateToken, requireAdmin, attCtrl.getAYSummary);
ayAttendanceRouter.get('/volunteer/:volunteerId', authenticateToken, requireAdmin, attCtrl.getVolunteerAttendance);

ayAttendanceRouter.get('/events/:eventId/attendance', authenticateToken, requireAdmin, attCtrl.getEventAttendance);
ayAttendanceRouter.put('/events/:eventId/attendance', authenticateToken, requireAdmin, requireAYUnlocked, attCtrl.saveEventAttendance);

// Session-level routes (flat, mounted at /api/attendance)
const router = Router();
router.get('/sessions/:sessionId',                         authenticateToken, requireAdmin, attCtrl.getSession);
router.delete('/sessions/:sessionId',                      authenticateToken, requireAdmin, attCtrl.deleteSession);
router.post('/sessions/:sessionId/records',                authenticateToken, requireAdmin, attCtrl.markAttendance);

export default router;
