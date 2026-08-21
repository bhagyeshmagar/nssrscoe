import cron from 'node-cron';
import { eq, and, gt, lt } from 'drizzle-orm';
import { db } from '../db';
import { meetings, volunteers, coreTeamAssignments, specialCampParticipants } from '../db/schema';
import { createBulkNotifications } from './notificationService';
import { sendMeetingNotificationEmail } from './emailService';

export const startCronJobs = () => {
    // Run every day at 8:00 AM to send reminders for meetings happening tomorrow
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily meeting reminder cron job...');
        try {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

            // Find scheduled meetings happening tomorrow
            const upcomingMeetings = await db.select().from(meetings).where(
                and(
                    eq(meetings.status, 'scheduled'),
                    gt(meetings.scheduledDate, tomorrow),
                    lt(meetings.scheduledDate, dayAfterTomorrow)
                )
            );

            for (const meeting of upcomingMeetings) {
                let targetVolunteerIds: number[] = [];
                let targetVolunteerEmails: string[] = [];

                if (meeting.meetingType === 'regular') {
                    const vols = await db.select({ id: volunteers.id, email: volunteers.email })
                        .from(volunteers)
                        .where(and(eq(volunteers.academicYearId, meeting.academicYearId), eq(volunteers.isActive, true)));
                    targetVolunteerIds = vols.map(v => v.id);
                    targetVolunteerEmails = vols.map(v => v.email);
                } else if (meeting.meetingType === 'core_team') {
                    const vols = await db.select({ volunteerId: coreTeamAssignments.volunteerId, email: volunteers.email })
                        .from(coreTeamAssignments)
                        .innerJoin(volunteers, eq(coreTeamAssignments.volunteerId, volunteers.id))
                        .where(eq(coreTeamAssignments.academicYearId, meeting.academicYearId));
                    targetVolunteerIds = vols.map(v => v.volunteerId).filter((id): id is number => id !== null);
                    targetVolunteerEmails = vols.map(v => v.email);
                } else if (meeting.meetingType === 'special_camp' && meeting.specialCampId) {
                    const vols = await db.select({ volunteerId: specialCampParticipants.volunteerId, email: volunteers.email })
                        .from(specialCampParticipants)
                        .innerJoin(volunteers, eq(specialCampParticipants.volunteerId, volunteers.id))
                        .where(eq(specialCampParticipants.specialCampId, meeting.specialCampId));
                    targetVolunteerIds = vols.map(v => v.volunteerId).filter((id): id is number => id !== null);
                    targetVolunteerEmails = vols.map(v => v.email);
                }

                if (targetVolunteerIds.length > 0) {
                    await createBulkNotifications(targetVolunteerIds.map(vid => ({
                        volunteerId: vid,
                        type: 'meeting_reminder',
                        title: `Reminder: ${meeting.title}`,
                        body: `You have a meeting tomorrow at ${meeting.location}.`,
                        referenceType: 'meeting',
                        referenceId: meeting.id,
                    })));

                    // Also send emails
                    const chunkSize = 50;
                    for (let i = 0; i < targetVolunteerEmails.length; i += chunkSize) {
                        const chunk = targetVolunteerEmails.slice(i, i + chunkSize);
                        sendMeetingNotificationEmail(chunk, `[Reminder] ${meeting.title}`, meeting.scheduledDate.toISOString(), meeting.location).catch(err => {
                            console.error('Failed to send reminder email', err);
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Failed to run daily meeting reminder cron', err);
        }
    });

    console.log('Cron jobs initialized.');
};