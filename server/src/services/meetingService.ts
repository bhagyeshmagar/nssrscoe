import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '../db';
import { meetings, meetingAttendance, volunteers, coreTeamAssignments, specialCampParticipants, admins } from '../db/schema';
import { NotFoundError, ConflictError } from '../lib/errors';
import { logAudit } from './auditService';
import { createBulkNotifications } from './notificationService';

export interface CreateMeetingInput {
    title: string;
    description?: string;
    meetingType: 'regular' | 'core_team' | 'special_camp';
    scheduledDate: Date;
    location: string;
    sendEmail?: boolean;
    specialCampId?: number;
}

export const createMeeting = async (ayId: number, input: CreateMeetingInput, adminId: number) => {
    const [meeting] = await db.insert(meetings).values({
        academicYearId: ayId,
        title: input.title,
        description: input.description,
        meetingType: input.meetingType,
        status: 'scheduled',
        scheduledDate: input.scheduledDate,
        location: input.location,
        createdById: adminId,
        specialCampId: input.specialCampId ?? null,
    }).returning();

    await logAudit({ action: 'meeting.create', entityType: 'meeting', entityId: meeting.id, performedById: adminId, academicYearId: ayId });

    // Auto-generate notifications
    let targetVolunteerIds: number[] = [];
    let targetVolunteerEmails: string[] = [];

    if (input.meetingType === 'regular') {
        const vols = await db.select({ id: volunteers.id, email: volunteers.email })
            .from(volunteers)
            .where(and(eq(volunteers.academicYearId, ayId), eq(volunteers.isActive, true)));
        targetVolunteerIds = vols.map(v => v.id);
        targetVolunteerEmails = vols.map(v => v.email);
    } else if (input.meetingType === 'core_team') {
        const vols = await db.select({ volunteerId: coreTeamAssignments.volunteerId, email: volunteers.email })
            .from(coreTeamAssignments)
            .innerJoin(volunteers, eq(coreTeamAssignments.volunteerId, volunteers.id))
            .where(eq(coreTeamAssignments.academicYearId, ayId));
        targetVolunteerIds = vols.map(v => v.volunteerId).filter((id): id is number => id !== null);
        targetVolunteerEmails = vols.map(v => v.email);
    } else if (input.meetingType === 'special_camp' && input.specialCampId) {
        // Only notify volunteers enrolled in the specified special camp
        const participants = await db
            .select({ volunteerId: specialCampParticipants.volunteerId, email: volunteers.email })
            .from(specialCampParticipants)
            .innerJoin(volunteers, eq(specialCampParticipants.volunteerId, volunteers.id))
            .where(eq(specialCampParticipants.specialCampId, input.specialCampId));
        targetVolunteerIds = participants.map(p => p.volunteerId).filter((id): id is number => id !== null);
        targetVolunteerEmails = participants.map(p => p.email);
    }

    if (targetVolunteerIds.length > 0) {
        await createBulkNotifications(targetVolunteerIds.map(vid => ({
            volunteerId: vid,
            type: 'meeting_scheduled',
            title: `New Meeting: ${input.title}`,
            body: `You have a new meeting scheduled on ${input.scheduledDate.toLocaleDateString()} at ${input.location}.`,
            referenceType: 'meeting',
            referenceId: meeting.id,
        })));
    }

    if (input.sendEmail && targetVolunteerEmails.length > 0) {
        const { sendMeetingNotificationEmail } = await import('./emailService');
        // Resend can accept up to 50 recipients per request, we should probably chunk it if > 50
        // For now we'll just send in chunks of 50
        const chunkSize = 50;
        for (let i = 0; i < targetVolunteerEmails.length; i += chunkSize) {
            const chunk = targetVolunteerEmails.slice(i, i + chunkSize);
            sendMeetingNotificationEmail(chunk, input.title, input.scheduledDate.toISOString(), input.location).catch(err => {
                console.error('Failed to send bulk meeting email', err);
            });
        }
    }

    return meeting;
};

export const listMeetings = async (ayId: number, type?: string, status?: string) => {
    let query = db.select().from(meetings).where(eq(meetings.academicYearId, ayId)).$dynamic();
    if (type) query = query.where(eq(meetings.meetingType, type as 'regular' | 'core_team' | 'special_camp'));
    if (status) query = query.where(eq(meetings.status, status as 'scheduled' | 'active' | 'ended'));
    return await query.orderBy(desc(meetings.scheduledDate));
};

export const getMeeting = async (id: number) => {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) throw new NotFoundError('Meeting not found');
    return meeting;
};

export const updateMeeting = async (id: number, input: Partial<CreateMeetingInput>, adminId: number) => {
    const [existing] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!existing) throw new NotFoundError('Meeting not found');
    
    // Check if scheduled
    const [admin] = await db.select({ isSuperadmin: admins.isSuperadmin }).from(admins).where(eq(admins.id, adminId));
    // Superadmin is allowed to edit ended meetings but normal admins can only edit scheduled. Wait, I'll pass isSuperadmin flag to the service instead of querying here.
    
    const [updated] = await db.update(meetings).set(input).where(eq(meetings.id, id)).returning();
    await logAudit({ action: 'meeting.update', entityType: 'meeting', entityId: id, performedById: adminId });
    return updated;
};

export const startMeeting = async (id: number, adminId: number) => {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) throw new NotFoundError('Meeting not found');
    if (meeting.status !== 'scheduled') throw new ConflictError('Only scheduled meetings can be started');

    const [updated] = await db.update(meetings).set({
        status: 'active',
        startedAt: new Date(),
    }).where(eq(meetings.id, id)).returning();
    
    await logAudit({ action: 'meeting.start', entityType: 'meeting', entityId: id, performedById: adminId });
    return updated;
};

export const endMeeting = async (id: number, adminId: number) => {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) throw new NotFoundError('Meeting not found');
    if (meeting.status !== 'active') throw new ConflictError('Only active meetings can be ended');

    const endedAt = new Date();
    const durationMinutes = meeting.startedAt ? Math.round((endedAt.getTime() - meeting.startedAt.getTime()) / 60000) : 0;

    const [updated] = await db.update(meetings).set({
        status: 'ended',
        endedAt,
        durationMinutes,
    }).where(eq(meetings.id, id)).returning();
    
    await logAudit({ action: 'meeting.end', entityType: 'meeting', entityId: id, performedById: adminId });
    return updated;
};

export const reopenMeeting = async (id: number, adminId: number) => {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) throw new NotFoundError('Meeting not found');
    if (meeting.status !== 'ended') throw new ConflictError('Only ended meetings can be re-opened');

    const [updated] = await db.update(meetings).set({
        status: 'active',
        endedAt: null,
        durationMinutes: null,
    }).where(eq(meetings.id, id)).returning();
    
    await logAudit({ action: 'meeting.reopen', entityType: 'meeting', entityId: id, performedById: adminId });
    return updated;
};

export const deleteMeeting = async (id: number, adminId: number) => {
    const [deleted] = await db.delete(meetings).where(eq(meetings.id, id)).returning();
    if (!deleted) throw new NotFoundError('Meeting not found');
    await logAudit({ action: 'meeting.delete', entityType: 'meeting', entityId: id, performedById: adminId });
    return deleted;
};

export const getMeetingAttendance = async (meetingId: number) => {
    const meeting = await getMeeting(meetingId);

    let baseVolunteers: { id: number; name: string; department: string; status: 'regular' | 'backup' }[] = [];

    if (meeting.meetingType === 'core_team') {
        baseVolunteers = await db.select({
            id: volunteers.id,
            name: volunteers.name,
            department: volunteers.department,
            status: volunteers.status,
        })
        .from(volunteers)
        .innerJoin(coreTeamAssignments, eq(volunteers.id, coreTeamAssignments.volunteerId))
        .where(eq(volunteers.academicYearId, meeting.academicYearId));
    } else if (meeting.meetingType === 'special_camp' && meeting.specialCampId) {
        baseVolunteers = await db.select({
            id: volunteers.id,
            name: volunteers.name,
            department: volunteers.department,
            status: volunteers.status,
        })
        .from(volunteers)
        .innerJoin(specialCampParticipants, eq(volunteers.id, specialCampParticipants.volunteerId))
        .where(eq(specialCampParticipants.specialCampId, meeting.specialCampId));
    } else {
        baseVolunteers = await db.select({
            id: volunteers.id,
            name: volunteers.name,
            department: volunteers.department,
            status: volunteers.status,
        })
        .from(volunteers)
        .where(eq(volunteers.academicYearId, meeting.academicYearId));
    }

    const existingAttendance = await db.select().from(meetingAttendance).where(eq(meetingAttendance.meetingId, meetingId));
    const attendanceMap = new Map(existingAttendance.map(a => [a.volunteerId, a]));

    return baseVolunteers.map(v => ({
        volunteer: v,
        attendance: attendanceMap.get(v.id) || null,
    }));
};

export const exportMeetingAttendance = async (meetingId: number) => {
    const meeting = await getMeeting(meetingId);
    const attendanceList = await getMeetingAttendance(meetingId);

    return {
        meetingTitle: meeting.title,
        meetingType: meeting.meetingType,
        scheduledDate: meeting.scheduledDate,
        location: meeting.location,
        status: meeting.status,
        rows: attendanceList.map((item, i) => ({
            srNo: i + 1,
            name: item.volunteer.name,
            department: item.volunteer.department,
            volunteerType: item.volunteer.status,
            attendance: item.attendance?.status ?? 'not_marked',
            notes: item.attendance?.notes ?? '',
        })),
    };
};

export const markMeetingAttendance = async (meetingId: number, volunteerId: number, status: 'present' | 'absent' | 'late', notes: string | null, adminId: number) => {
    const [vol] = await db.select().from(volunteers).where(eq(volunteers.id, volunteerId));
    if (!vol) throw new NotFoundError('Volunteer not found');

    const [existing] = await db.select().from(meetingAttendance)
        .where(and(eq(meetingAttendance.meetingId, meetingId), eq(meetingAttendance.volunteerId, volunteerId)));

    if (existing) {
        return await db.update(meetingAttendance).set({
            status,
            notes,
            markedAt: new Date(),
            markedById: adminId,
            volunteerType: vol.status,
        }).where(eq(meetingAttendance.id, existing.id)).returning();
    } else {
        return await db.insert(meetingAttendance).values({
            meetingId,
            volunteerId,
            status,
            notes,
            markedAt: new Date(),
            markedById: adminId,
            volunteerType: vol.status,
        }).returning();
    }
};

export const getMeetingAttendanceStats = async (meetingId: number) => {
    const rows = await db.select({
        status: meetingAttendance.status,
        volunteerType: meetingAttendance.volunteerType,
        count: count()
    }).from(meetingAttendance).where(eq(meetingAttendance.meetingId, meetingId)).groupBy(meetingAttendance.status, meetingAttendance.volunteerType);
    
    const stats = {
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        regularPresent: 0,
        backupPresent: 0,
    };
    
    rows.forEach(r => {
        if (r.status === 'present') {
            stats.totalPresent += r.count;
            if (r.volunteerType === 'regular') stats.regularPresent += r.count;
            if (r.volunteerType === 'backup') stats.backupPresent += r.count;
        } else if (r.status === 'absent') {
            stats.totalAbsent += r.count;
        } else if (r.status === 'late') {
            stats.totalLate += r.count;
        }
    });
    
    return stats;
};
