import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import * as emailLogService from '../services/emailLogService';
import * as hodService from '../services/hodService';
import * as emailService from '../services/emailService';
import { db } from '../db';
import { attendanceSessions, attendanceRecords, volunteers, academicYears, volunteerProfiles, events } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { ok, handleError } from '../lib/response';

const router = Router();

// ── Email Logs ─────────────────────────────────────────────────────────────────

// GET /api/email-logs — paginated list (any admin)
router.get(
    '/logs',
    authenticateToken, requireAdmin,
    async (req: Request, res: Response) => {
        try {
            const { emailType, status, page, limit } = req.query;
            const data = await emailLogService.getEmailLogs({
                emailType: emailType as string | undefined,
                status: status as 'sent' | 'failed' | undefined,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            });
            ok(res, data);
        } catch (err) { handleError(res, err); }
    }
);

// GET /api/email-logs/stats — overview stats (any admin)
router.get(
    '/logs/stats',
    authenticateToken, requireAdmin,
    async (req: Request, res: Response) => {
        try {
            const data = await emailLogService.getEmailStats();
            ok(res, data);
        } catch (err) { handleError(res, err); }
    }
);

// ── HOD Attendance Report ──────────────────────────────────────────────────────

// POST /api/email/send-attendance-report
// Body: { ayId: number, eventId: number }
router.post(
    '/send-attendance-report',
    authenticateToken, requireAdmin,
    async (req: Request, res: Response) => {
        try {
            const adminId = (req as AuthRequest).user!.id;
            const { ayId, eventId } = req.body;

            if (!ayId || !eventId) {
                return res.status(400).json({ success: false, message: 'ayId and eventId are required.' });
            }

            // 1. Fetch event details
            const [event] = await db.select().from(events).where(eq(events.id, eventId));
            if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

            // 2. Fetch AY details
            const [ay] = await db.select().from(academicYears).where(eq(academicYears.id, ayId));
            if (!ay) return res.status(404).json({ success: false, message: 'Academic year not found.' });

            // 3. Find or null the attendance session for this event
            const [session] = await db
                .select()
                .from(attendanceSessions)
                .where(and(eq(attendanceSessions.academicYearId, ayId), eq(attendanceSessions.eventId, eventId)));

            let attendanceRows: emailService.VolunteerAttendanceRow[] = [];

            if (session) {
                // 4. Fetch attendance records joined with volunteer info
                const records = await db
                    .select({
                        volunteerId: attendanceRecords.volunteerId,
                        status: attendanceRecords.status,
                        name: volunteers.name,
                        department: volunteers.department,
                        prnNo: volunteerProfiles.prnNo,
                    })
                    .from(attendanceRecords)
                    .leftJoin(volunteers, eq(attendanceRecords.volunteerId, volunteers.id))
                    .leftJoin(volunteerProfiles, eq(volunteerProfiles.volunteerId, volunteers.id))
                    .where(eq(attendanceRecords.sessionId, session.id));

                attendanceRows = records.map(r => ({
                    prnNo: r.prnNo ?? 'N/A',
                    name: r.name ?? 'Unknown',
                    department: r.department ?? 'Unknown',
                    status: r.status ?? 'absent',
                }));
            } else {
                // No session yet — still build list with everyone absent
                const allVols = await db
                    .select({
                        name: volunteers.name,
                        department: volunteers.department,
                        prnNo: volunteerProfiles.prnNo,
                    })
                    .from(volunteers)
                    .leftJoin(volunteerProfiles, eq(volunteerProfiles.volunteerId, volunteers.id))
                    .where(and(eq(volunteers.academicYearId, ayId), eq(volunteers.isActive, true)));

                attendanceRows = allVols.map(v => ({
                    prnNo: v.prnNo ?? 'N/A',
                    name: v.name,
                    department: v.department,
                    status: 'absent',
                }));
            }

            // 5. Fetch active HOD contacts
            const hods = await hodService.listHods();
            const activeHods = hods.filter(h => h.isActive);

            if (activeHods.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No active HOD contacts found. Please add HOD contacts in the Email Service tab.',
                });
            }

            // 6. Send reports
            const result = await emailService.sendHodAttendanceReport(
                {
                    ayLabel: ay.label,
                    eventTitle: event.title,
                    eventDate: typeof event.date === 'string' ? event.date : (event.date as Date).toISOString(),
                    eventLocation: event.location ?? 'N/A',
                    sessionId: session?.id ?? 0,
                    eventId: event.id,
                    volunteers: attendanceRows,
                },
                activeHods.map(h => ({ name: h.name, email: h.email, department: h.department })),
                adminId,
            );

            ok(res, result, `Reports sent: ${result.sent} sent, ${result.failed} failed.`);
        } catch (err) { handleError(res, err); }
    }
);

export default router;
