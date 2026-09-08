import cron from 'node-cron';
import { eq, and, gt, lt } from 'drizzle-orm';
import { db } from '../db';
import { meetings, volunteers, coreTeamAssignments, specialCampParticipants } from '../db/schema';
import { createBulkNotifications } from './notificationService';
import { sendMeetingNotificationEmail } from './emailService';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Fetch volunteer IDs + emails for a single meeting based on its type */
const getTargets = async (meeting: typeof meetings.$inferSelect) => {
    if (meeting.meetingType === 'regular') {
        const rows = await db
            .select({ id: volunteers.id, email: volunteers.email })
            .from(volunteers)
            .where(and(eq(volunteers.academicYearId, meeting.academicYearId), eq(volunteers.isActive, true)));
        return { ids: rows.map(r => r.id), emails: rows.map(r => r.email) };
    }

    if (meeting.meetingType === 'core_team') {
        const rows = await db
            .select({ volunteerId: coreTeamAssignments.volunteerId, email: volunteers.email })
            .from(coreTeamAssignments)
            .innerJoin(volunteers, eq(coreTeamAssignments.volunteerId, volunteers.id))
            .where(eq(coreTeamAssignments.academicYearId, meeting.academicYearId));
        const ids = rows.map(r => r.volunteerId).filter((id): id is number => id !== null);
        return { ids, emails: rows.map(r => r.email) };
    }

    if (meeting.meetingType === 'special_camp' && meeting.specialCampId) {
        const rows = await db
            .select({ volunteerId: specialCampParticipants.volunteerId, email: volunteers.email })
            .from(specialCampParticipants)
            .innerJoin(volunteers, eq(specialCampParticipants.volunteerId, volunteers.id))
            .where(eq(specialCampParticipants.specialCampId, meeting.specialCampId));
        const ids = rows.map(r => r.volunteerId).filter((id): id is number => id !== null);
        return { ids, emails: rows.map(r => r.email) };
    }

    return { ids: [], emails: [] };
};

/** Send meeting reminder emails in chunks of 50 to stay within Resend limits */
const sendReminderEmails = async (emails: string[], meeting: typeof meetings.$inferSelect) => {
    const chunkSize = 50;
    for (let i = 0; i < emails.length; i += chunkSize) {
        const chunk = emails.slice(i, i + chunkSize);
        sendMeetingNotificationEmail(
            chunk,
            `[Reminder] ${meeting.title}`,
            meeting.scheduledDate.toISOString(),
            meeting.location,
        ).catch(err => console.error('[cron] Email chunk failed:', err));
    }
};

// ── cron job ─────────────────────────────────────────────────────────────────

export const startCronJobs = () => {
    // Runs every day at 8:00 AM — sends reminders for meetings happening tomorrow.
    cron.schedule('0 8 * * *', async () => {
        console.log('[cron] Running daily meeting reminder job...');
        try {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

            const upcomingMeetings = await db.select().from(meetings).where(
                and(
                    eq(meetings.status, 'scheduled'),
                    gt(meetings.scheduledDate, tomorrow),
                    lt(meetings.scheduledDate, dayAfterTomorrow),
                ),
            );

            if (upcomingMeetings.length === 0) {
                console.log('[cron] No meetings tomorrow, nothing to do.');
                return;
            }

            // Process all meetings in parallel — separate DB connections per meeting
            // are fine because they run concurrently, not sequentially.
            await Promise.all(upcomingMeetings.map(async (meeting) => {
                try {
                    const { ids, emails } = await getTargets(meeting);
                    if (ids.length === 0) return;

                    // DB insert (bulk, single round-trip) and email send fire concurrently
                    await Promise.all([
                        createBulkNotifications(ids.map(vid => ({
                            volunteerId: vid,
                            type: 'meeting_reminder',
                            title: `Reminder: ${meeting.title}`,
                            body: `You have a meeting tomorrow at ${meeting.location}.`,
                            referenceType: 'meeting',
                            referenceId: meeting.id,
                        }))),
                        sendReminderEmails(emails, meeting),
                    ]);

                    console.log(`[cron] Sent reminders for meeting ${meeting.id} to ${ids.length} volunteers`);
                } catch (err) {
                    console.error(`[cron] Failed to process meeting ${meeting.id}:`, err);
                }
            }));

        } catch (err) {
            console.error('[cron] Daily meeting reminder job failed:', err);
        }
    });

    console.log('[cron] Jobs initialized.');
};