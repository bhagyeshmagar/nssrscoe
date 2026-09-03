import {
    mssqlTable,
    int,
    nvarchar,
    bit,
    datetime2,
    date,
    unique,
    check,
    uniqueIndex,
} from 'drizzle-orm/mssql-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm/_relations';

// ─────────────────────────────────────────────────────────────────────────────
// TYPESCRIPT ENUM CONSTANTS
// (MS SQL Server has no native ENUM type — these replace pgEnum and enforce
//  type-safety at the TypeScript layer; CHECK constraints enforce them in DB)
// ─────────────────────────────────────────────────────────────────────────────

export const EVENT_TYPES = ['upcoming', 'past'] as const;
export type EventType = typeof EVENT_TYPES[number];

export const REGISTRATION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type RegistrationStatus = typeof REGISTRATION_STATUSES[number];

export const MEDIA_TYPES = ['image', 'video'] as const;
export type MediaType = typeof MEDIA_TYPES[number];

export const DEPARTMENTS = [
    'Computer Engineering',
    'Computer Science and Business Systems',
    'Information Technology',
    'Electronics and Telecommunication',
    'Electrical Engineering',
    'Automation and Robotics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Bachelor of Computer Applications',
] as const;
export type Department = typeof DEPARTMENTS[number];

export const ROLE_TYPES = ['institution', 'student'] as const;
export type RoleType = typeof ROLE_TYPES[number];

/** regular = counts toward the 100-per-AY cap; backup = overflow list */
export const VOLUNTEER_STATUSES = ['regular', 'backup'] as const;
export type VolunteerStatus = typeof VOLUNTEER_STATUSES[number];

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late'] as const;
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

// ─────────────────────────────────────────────────────────────────────────────
// ADMINS
// ─────────────────────────────────────────────────────────────────────────────

export const admins = mssqlTable('admins', {
    id: int('id').identity().primaryKey(),
    username: nvarchar('username', { length: 255 }).notNull().unique(),
    passwordHash: nvarchar('password_hash', { length: 'max' }).notNull(),
    isSuperadmin: bit('is_superadmin').default(false).notNull(),
    createdAt: datetime2('created_at').default(sql`getdate()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC YEARS
// ─────────────────────────────────────────────────────────────────────────────

export const academicYears = mssqlTable('academic_years', {
    id: int('id').identity().primaryKey(),
    label: nvarchar('label', { length: 20 }).notNull().unique(),   // "2024-25"
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    /** Enforced by partial unique index: UNIQUE (is_current) WHERE is_current = 1 */
    isCurrent: bit('is_current').default(false).notNull(),
    /** Write-lock. All volunteer/core-team/camp mutations blocked when true. */
    isLocked: bit('is_locked').default(false).notNull(),
    /** Archived AYs are fully read-only and hidden from active management views. */
    isArchived: bit('is_archived').default(false).notNull(),
    volunteerCap: int('volunteer_cap').default(100).notNull(),
    lockedAt: datetime2('locked_at'),
    lockedById: int('locked_by_id').references(() => admins.id),
    regularActivityReportUrl: nvarchar('regular_activity_report_url', { length: 1024 }),
    specialCampReportUrl: nvarchar('special_camp_report_url', { length: 1024 }),
    createdAt: datetime2('created_at').default(sql`getdate()`),
}, (t) => [
    uniqueIndex('unq_is_current').on(t.isCurrent).where(sql`${t.isCurrent} = 1`)
]);

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY CALENDAR
// ─────────────────────────────────────────────────────────────────────────────

export const activityCalendar = mssqlTable('activity_calendar', {
    id: int('id').identity().primaryKey(),
    academicYearId: int('academic_year_id').references(() => academicYears.id, { onDelete: 'cascade' }).notNull(),
    month: nvarchar('month', { length: 50 }).notNull(),
    tentativeDate: nvarchar('tentative_date', { length: 255 }).notNull(),
    activity: nvarchar('activity', { length: 500 }).notNull(),
    type: nvarchar('type', { length: 50 }).notNull(), // 'Field Work', 'Health', 'Campus', 'National'
    createdAt: datetime2('created_at').default(sql`getdate()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// VOLUNTEERS (auth + identity)
// ─────────────────────────────────────────────────────────────────────────────

export const volunteers = mssqlTable('volunteers', {
    id: int('id').identity().primaryKey(),
    academicYearId: int('academic_year_id').references(() => academicYears.id).notNull(),
    name: nvarchar('name', { length: 255 }).notNull(),
    email: nvarchar('email', { length: 255 }).notNull().unique(),
    passwordHash: nvarchar('password_hash', { length: 'max' }).notNull(),
    isActive: bit('is_active').default(true),
    department: nvarchar('department', { length: 100 }).notNull(),
    /** regular = counts toward 100-per-AY cap; backup = overflow */
    status: nvarchar('status', { length: 20 }).default('regular').notNull(),
    createdById: int('created_by_id').references(() => admins.id),
    createdAt: datetime2('created_at').default(sql`getdate()`),
    updatedAt: datetime2('updated_at').default(sql`getdate()`),
}, (t) => [
check('chk_volunteers_department', sql`${t.department} IN ('Computer Engineering','Computer Science and Business Systems','Information Technology','Electronics and Telecommunication','Electrical Engineering','Automation and Robotics','Mechanical Engineering','Civil Engineering','Bachelor of Computer Applications')`),
    check('chk_volunteers_status', sql`${t.status} IN ('regular','backup')`),
]);

// ─────────────────────────────────────────────────────────────────────────────
// VOLUNTEER PROFILES (self-filled personal details — kept split from auth)
// ─────────────────────────────────────────────────────────────────────────────

export const volunteerProfiles = mssqlTable('volunteer_profiles', {
    id: int('id').identity().primaryKey(),
    volunteerId: int('volunteer_id')
        .references(() => volunteers.id, { onDelete: 'cascade' })
        .notNull()
        .unique(),
    fullName: nvarchar('full_name', { length: 255 }),
    prnNo: nvarchar('prn_no', { length: 50 }),
    /** FE / SE / TE / BE — the student's college year at NSS enrollment time. */
    collegeYearAtEnrollment: nvarchar('college_year_at_enrollment', { length: 20 }),
    nssYear: int('nss_year'),
    marksheetUrl: nvarchar('marksheet_url', { length: 'max' }),
    cgpa: nvarchar('cgpa', { length: 10 }),
    eligibilityNo: nvarchar('eligibility_no', { length: 50 }),
    religion: nvarchar('religion', { length: 50 }),
    caste: nvarchar('caste', { length: 100 }),
    casteCategory: nvarchar('caste_category', { length: 50 }),
    phoneNo: nvarchar('phone_no', { length: 20 }),
    emailId: nvarchar('email_id', { length: 255 }),
    department: nvarchar('department', { length: 100 }), // Added so Drizzle can map the existing DB column
    profilePhotoUrl: nvarchar('profile_photo_url', { length: 'max' }),
    experienceText: nvarchar('experience_text', { length: 'max' }),
    isExperienceApproved: bit('is_experience_approved').default(false),
    portfolioChoices: nvarchar('portfolio_choices', { length: 'max' }), // Added for preferred portfolios
    updatedAt: datetime2('updated_at').default(sql`getdate()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// CORE TEAM ROLES (master reference — seeded once)
// ─────────────────────────────────────────────────────────────────────────────

export const coreTeamRoles = mssqlTable('core_team_roles', {
    id: int('id').identity().primaryKey(),
    name: nvarchar('name', { length: 100 }).notNull().unique(),
    /** Stable code used for programmatic validation (e.g. 'department_coordinator'). */
    code: nvarchar('code', { length: 50 }).notNull().unique(),
    roleType: nvarchar('role_type', { length: 20 }).notNull(),
    isUniquePerAy: bit('is_unique_per_ay').default(true).notNull(),
    displayOrder: int('display_order').default(0).notNull(),
    category: nvarchar('category', { length: 100 }),
    createdAt: datetime2('created_at').default(sql`getdate()`),
}, (t) => [
check('chk_core_team_roles_role_type', sql`${t.roleType} IN ('institution','student')`),
]);

// ─────────────────────────────────────────────────────────────────────────────
// CORE TEAM ASSIGNMENTS (per-AY selection)
// ─────────────────────────────────────────────────────────────────────────────

export const coreTeamAssignments = mssqlTable('core_team_assignments', {
    id: int('id').identity().primaryKey(),
    academicYearId: int('academic_year_id').notNull().references(() => academicYears.id),
    coreTeamRoleId: int('core_team_role_id').notNull().references(() => coreTeamRoles.id),
    volunteerId: int('volunteer_id').references(() => volunteers.id, { onDelete: 'set null' }),
    /** For institution roles (principal, nss_po). NULL for student roles. */
    displayName: nvarchar('display_name', { length: 255 }),
    displayPhotoUrl: nvarchar('display_photo_url', { length: 'max' }),
    /** For department_coordinator only — which dept this coordinator manages. */
    department: nvarchar('department', { length: 100 }),
    displayOrder: int('display_order').default(0),
    createdAt: datetime2('created_at').default(sql`getdate()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL CAMPS
// ─────────────────────────────────────────────────────────────────────────────

export const specialCamps = mssqlTable('special_camps', {
    id: int('id').identity().primaryKey(),
    academicYearId: int('academic_year_id').notNull().references(() => academicYears.id),
    name: nvarchar('name', { length: 255 }).notNull(),
    location: nvarchar('location', { length: 255 }).notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    description: nvarchar('description', { length: 'max' }),
    volunteerCap: int('volunteer_cap').default(50).notNull(),
    isFinalized: bit('is_finalized').default(false).notNull(),
    finalizedAt: datetime2('finalized_at'),
    finalizedById: int('finalized_by_id').references(() => admins.id),
    createdAt: datetime2('created_at').default(sql`getdate()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL CAMP PARTICIPANTS (snapshot)
// snap_* columns are frozen at finalization time and never updated after.
// ─────────────────────────────────────────────────────────────────────────────

export const specialCampParticipants = mssqlTable('special_camp_participants', {
    id: int('id').identity().primaryKey(),
    specialCampId: int('special_camp_id').notNull().references(() => specialCamps.id, { onDelete: 'cascade' }),
    volunteerId: int('volunteer_id').references(() => volunteers.id, { onDelete: 'set null' }),
    snapName: nvarchar('snap_name', { length: 255 }).notNull(),
    snapPrnNo: nvarchar('snap_prn_no', { length: 50 }),
    snapDepartment: nvarchar('snap_department', { length: 100 }),
    snapCollegeYearAtEnrollment: nvarchar('snap_college_year_at_enrollment', { length: 20 }),
    snapNssYear: int('snap_nss_year'),
    snapCgpa: nvarchar('snap_cgpa', { length: 10 }),
    snapPhoneNo: nvarchar('snap_phone_no', { length: 20 }),
    snapFinalizedAt: datetime2('snap_finalized_at'),
    addedAt: datetime2('added_at').default(sql`getdate()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const attendanceSessions = mssqlTable('attendance_sessions', {
    id: int('id').identity().primaryKey(),
    academicYearId: int('academic_year_id').notNull().references(() => academicYears.id),
    eventId: int('event_id').references(() => events.id, { onDelete: 'set null' }),
    title: nvarchar('title', { length: 255 }).notNull(),
    date: date('date').notNull(),
    description: nvarchar('description', { length: 'max' }),
    createdById: int('created_by_id').references(() => admins.id, { onDelete: 'set null' }),
    createdAt: datetime2('created_at').default(sql`getdate()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE RECORDS
// ─────────────────────────────────────────────────────────────────────────────

export const attendanceRecords = mssqlTable('attendance_records', {
    id: int('id').identity().primaryKey(),
    sessionId: int('session_id').notNull().references(() => attendanceSessions.id, { onDelete: 'cascade' }),
    volunteerId: int('volunteer_id').notNull().references(() => volunteers.id, { onDelete: 'cascade' }),
    status: nvarchar('status', { length: 20 }).notNull(),
    notes: nvarchar('notes', { length: 'max' }),
    recordedById: int('recorded_by_id').references(() => admins.id, { onDelete: 'set null' }),
    createdAt: datetime2('created_at').default(sql`getdate()`),
}, (t) => [
unique('unq_session_volunteer').on(t.sessionId, t.volunteerId),
    check('chk_attendance_records_status', sql`${t.status} IN ('present','absent','late')`),
]);

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────

export const auditLogs = mssqlTable('audit_logs', {
    id: int('id').identity().primaryKey(),
    /** e.g. 'volunteer.create', 'academic_year.lock', 'special_camp.finalize' */
    action: nvarchar('action', { length: 100 }).notNull(),
    /** e.g. 'volunteer', 'academic_year', 'special_camp' */
    entityType: nvarchar('entity_type', { length: 50 }).notNull(),
    entityId: int('entity_id'),
    performedById: int('performed_by_id'),
    performedByRole: nvarchar('performed_by_role', { length: 20 }).default('admin').notNull(),
    academicYearId: int('academic_year_id'),
    /** JSON string with relevant context (before/after values, params). */
    details: nvarchar('details', { length: 'max' }),
    createdAt: datetime2('created_at').default(sql`getdate()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export const events = mssqlTable('events', {
    id: int('id').identity().primaryKey(),
    title: nvarchar('title', { length: 255 }).notNull(),
    description: nvarchar('description', { length: 'max' }),
    date: datetime2('date').notNull(),
    location: nvarchar('location', { length: 255 }).notNull(),
    imageUrl: nvarchar('image_url', { length: 'max' }),
    type: nvarchar('type', { length: 20 }).default('upcoming'),
    reportUrl: nvarchar('report_url', { length: 'max' }),
    driveLink: nvarchar('drive_link', { length: 'max' }),
    volunteersCount: int('volunteers_count').default(0),
    approvalStatus: nvarchar('approval_status', { length: 20 }).default('pending').notNull(),
    approvedById: int('approved_by_id').references(() => admins.id),
    approvedAt: datetime2('approved_at'),
    academicYearId: int('academic_year_id').references(() => academicYears.id),
    createdAt: datetime2('created_at').default(sql`getdate()`),
}, (t) => [
check('chk_events_type', sql`${t.type} IN ('upcoming','past')`),
check('chk_events_approval_status', sql`${t.approvalStatus} IN ('pending','approved','rejected')`),
]);

export const eventImages = mssqlTable('event_images', {
    id: int('id').identity().primaryKey(),
    eventId: int('event_id').references(() => events.id).notNull(),
    url: nvarchar('url', { length: 'max' }).notNull(),
    isMaster: bit('is_master').default(false),
    caption: nvarchar('caption', { length: 255 }),
    createdAt: datetime2('created_at').default(sql`getdate()`),
});

export const homeSliderImages = mssqlTable('home_slider_images', {
    id: int('id').identity().primaryKey(),
    url: nvarchar('url', { length: 'max' }).notNull(),
    description: nvarchar('description', { length: 255 }).default(''),
    eventId: int('event_id').references(() => events.id, { onDelete: 'set null' }),
    approvalStatus: nvarchar('approval_status', { length: 20 }).default('pending').notNull(),
    approvedById: int('approved_by_id').references(() => admins.id),
    approvedAt: datetime2('approved_at'),
    createdAt: datetime2('created_at').default(sql`getdate()`),
}, (t) => [
    check('chk_slider_approval_status', sql`${t.approvalStatus} IN ('pending','approved','rejected')`),
]);

export const eventRegistrations = mssqlTable('event_registrations', {
    id: int('id').identity().primaryKey(),
    eventId: int('event_id').references(() => events.id).notNull(),
    name: nvarchar('name', { length: 255 }).notNull(),
    email: nvarchar('email', { length: 255 }).notNull(),
    phone: nvarchar('phone', { length: 20 }).notNull(),
    department: nvarchar('department', { length: 100 }).notNull(),
    year: nvarchar('year', { length: 20 }).notNull(),
    visitorPassId: nvarchar('visitor_pass_id', { length: 50 }).unique(),
    hasAttended: bit('has_attended').default(false).notNull(),
    /** Admin approval workflow: pending → approved | rejected */
    status: nvarchar('status', { length: 20 }).default('pending').notNull(),
    approvedAt: datetime2('approved_at'),
    approvedById: int('approved_by_id').references(() => admins.id),
    createdAt: datetime2('created_at').default(sql`getdate()`),
}, (t) => [
    check('chk_event_registrations_status', sql`${t.status} IN ('pending','approved','rejected')`),
    unique('unq_event_email').on(t.eventId, t.email),
]);

// ─────────────────────────────────────────────────────────────────────────────
// GALLERY
// ─────────────────────────────────────────────────────────────────────────────

export const gallery = mssqlTable('gallery', {
    id: int('id').identity().primaryKey(),
    title: nvarchar('title', { length: 255 }),
    description: nvarchar('description', { length: 'max' }).notNull().default(''),
    url: nvarchar('url', { length: 'max' }).notNull(),
    type: nvarchar('type', { length: 20 }).default('image'),
    eventId: int('event_id').references(() => events.id),
    status: nvarchar('status', { length: 20 }).notNull().default('pending'),
    submittedById: int('submitted_by_id').references(() => admins.id),
    reviewedById: int('reviewed_by_id').references(() => admins.id),
    rejectionReason: nvarchar('rejection_reason', { length: 'max' }),
    createdAt: datetime2('created_at').default(sql`getdate()`),
}, (t) => [
check('chk_gallery_type', sql`${t.type} IN ('image','video')`),
    check('chk_gallery_status', sql`${t.status} IN ('pending','approved','rejected')`),
]);

// ─────────────────────────────────────────────────────────────────────────────
// SITE SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

export const siteSettings = mssqlTable('site_settings', {
    id: int('id').identity().primaryKey(),
    key: nvarchar('key', { length: 100 }).notNull().unique(),
    value: nvarchar('value', { length: 'max' }).notNull(),
    updatedAt: datetime2('updated_at').default(sql`getdate()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const adminsRelations = relations(admins, ({ many }: any) => ({
    createdVolunteers: many(volunteers),
    lockedYears: many(academicYears),
    finalizedCamps: many(specialCamps),
    attendanceSessions: many(attendanceSessions),
}));

export const academicYearsRelations = relations(academicYears, ({ many, one }: any) => ({
    volunteers: many(volunteers),
    coreTeamAssignments: many(coreTeamAssignments),
    specialCamps: many(specialCamps),
    events: many(events),
    attendanceSessions: many(attendanceSessions),
    lockedBy: one(admins, { fields: [academicYears.lockedById], references: [admins.id] }),
}));

export const volunteersRelations = relations(volunteers, ({ one, many }: any) => ({
    academicYear: one(academicYears, { fields: [volunteers.academicYearId], references: [academicYears.id] }),
    profile: one(volunteerProfiles, { fields: [volunteers.id], references: [volunteerProfiles.volunteerId] }),
    createdBy: one(admins, { fields: [volunteers.createdById], references: [admins.id] }),
    coreTeamAssignments: many(coreTeamAssignments),
    specialCampParticipations: many(specialCampParticipants),
    attendanceRecords: many(attendanceRecords),
    innovativeIdeas: many(innovativeIdeas),
}));

export const volunteerProfilesRelations = relations(volunteerProfiles, ({ one }: any) => ({
    volunteer: one(volunteers, { fields: [volunteerProfiles.volunteerId], references: [volunteers.id] }),
}));

export const coreTeamRolesRelations = relations(coreTeamRoles, ({ many }: any) => ({
    assignments: many(coreTeamAssignments),
}));

export const coreTeamAssignmentsRelations = relations(coreTeamAssignments, ({ one }: any) => ({
    academicYear: one(academicYears, { fields: [coreTeamAssignments.academicYearId], references: [academicYears.id] }),
    role: one(coreTeamRoles, { fields: [coreTeamAssignments.coreTeamRoleId], references: [coreTeamRoles.id] }),
    volunteer: one(volunteers, { fields: [coreTeamAssignments.volunteerId], references: [volunteers.id] }),
}));

export const specialCampsRelations = relations(specialCamps, ({ one, many }: any) => ({
    academicYear: one(academicYears, { fields: [specialCamps.academicYearId], references: [academicYears.id] }),
    finalizedBy: one(admins, { fields: [specialCamps.finalizedById], references: [admins.id] }),
    participants: many(specialCampParticipants),
}));

export const specialCampParticipantsRelations = relations(specialCampParticipants, ({ one }: any) => ({
    specialCamp: one(specialCamps, { fields: [specialCampParticipants.specialCampId], references: [specialCamps.id] }),
    volunteer: one(volunteers, { fields: [specialCampParticipants.volunteerId], references: [volunteers.id] }),
}));

export const attendanceSessionsRelations = relations(attendanceSessions, ({ one, many }: any) => ({
    academicYear: one(academicYears, { fields: [attendanceSessions.academicYearId], references: [academicYears.id] }),
    event: one(events, { fields: [attendanceSessions.eventId], references: [events.id] }),
    createdBy: one(admins, { fields: [attendanceSessions.createdById], references: [admins.id] }),
    records: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }: any) => ({
    session: one(attendanceSessions, { fields: [attendanceRecords.sessionId], references: [attendanceSessions.id] }),
    volunteer: one(volunteers, { fields: [attendanceRecords.volunteerId], references: [volunteers.id] }),
    recordedBy: one(admins, { fields: [attendanceRecords.recordedById], references: [admins.id] }),
}));

export const eventsRelations = relations(events, ({ many, one }: any) => ({
    registrations: many(eventRegistrations),
    gallery: many(gallery),
    images: many(eventImages),
    academicYear: one(academicYears, { fields: [events.academicYearId], references: [academicYears.id] }),
    attendanceSessions: many(attendanceSessions),
}));

export const eventImagesRelations = relations(eventImages, ({ one }: any) => ({
    event: one(events, { fields: [eventImages.eventId], references: [events.id] }),
}));

export const registrationRelations = relations(eventRegistrations, ({ one }: any) => ({
    event: one(events, { fields: [eventRegistrations.eventId], references: [events.id] }),
}));

export const galleryRelations = relations(gallery, ({ one }: any) => ({
    event: one(events, { fields: [gallery.eventId], references: [events.id] }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// MEETINGS
// ─────────────────────────────────────────────────────────────────────────────

export const meetings = mssqlTable('meetings', {
    id: int('id').identity().primaryKey(),
    academicYearId: int('academic_year_id').notNull().references(() => academicYears.id),
    title: nvarchar('title', { length: 255 }).notNull(),
    description: nvarchar('description', { length: 'max' }),
    meetingType: nvarchar('meeting_type', { length: 50 }).notNull(), // 'regular' | 'core_team' | 'special_camp'
    status: nvarchar('status', { length: 50 }).default('scheduled').notNull(), // 'scheduled' | 'active' | 'ended'
    scheduledDate: datetime2('scheduled_date').notNull(),
    location: nvarchar('location', { length: 255 }).notNull(),
    startedAt: datetime2('started_at'),
    endedAt: datetime2('ended_at'),
    durationMinutes: int('duration_minutes'),
    specialCampId: int('special_camp_id').references(() => specialCamps.id, { onDelete: 'set null' }),
    createdById: int('created_by_id').references(() => admins.id),
    createdAt: datetime2('created_at').default(sql`getdate()`),
}, (t) => [
check('chk_meetings_meeting_type', sql`${t.meetingType} IN ('regular','core_team','special_camp')`),
    check('chk_meetings_status', sql`${t.status} IN ('scheduled','active','ended')`),
]);

export const meetingAttendance = mssqlTable('meeting_attendance', {
    id: int('id').identity().primaryKey(),
    meetingId: int('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
    volunteerId: int('volunteer_id').notNull().references(() => volunteers.id, { onDelete: 'cascade' }),
    status: nvarchar('status', { length: 20 }).notNull(),
    volunteerType: nvarchar('volunteer_type', { length: 20 }).notNull(),
    notes: nvarchar('notes', { length: 'max' }),
    markedById: int('marked_by_id').references(() => admins.id),
    markedAt: datetime2('marked_at').default(sql`getdate()`),
}, (t) => [
    unique('unq_meeting_volunteer').on(t.meetingId, t.volunteerId),
    check('chk_meeting_attendance_status', sql`${t.status} IN ('present','absent','late')`),
    check('chk_meeting_attendance_volunteer_type', sql`${t.volunteerType} IN ('regular','backup')`),
]);

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const notifications = mssqlTable('notifications', {
    id: int('id').identity().primaryKey(),
    volunteerId: int('volunteer_id').notNull().references(() => volunteers.id, { onDelete: 'cascade' }),
    type: nvarchar('type', { length: 50 }).notNull(),
    title: nvarchar('title', { length: 255 }).notNull(),
    body: nvarchar('body', { length: 'max' }).notNull(),
    isRead: bit('is_read').default(false).notNull(),
    emailSent: bit('email_sent').default(false).notNull(),
    referenceType: nvarchar('reference_type', { length: 50 }),
    referenceId: int('reference_id'),
    createdAt: datetime2('created_at').default(sql`getdate()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// HOD CONTACTS (department Head of Department email list)
// ─────────────────────────────────────────────────────────────────────────────

export const hodContacts = mssqlTable('hod_contacts', {
    id: int('id').identity().primaryKey(),
    department: nvarchar('department', { length: 100 }).notNull().unique(),
    name: nvarchar('name', { length: 255 }).notNull(),
    email: nvarchar('email', { length: 255 }).notNull(),
    isActive: bit('is_active').default(true).notNull(),
    createdAt: datetime2('created_at').default(sql`getdate()`),
    updatedAt: datetime2('updated_at').default(sql`getdate()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL LOGS (audit trail of all emails sent by the system)
// ─────────────────────────────────────────────────────────────────────────────

export const EMAIL_TYPES = [
    'volunteer_welcome',
    'volunteer_backup',
    'volunteer_regular',
    'hod_attendance',
    'meeting_notification',
    'pass_approval',
] as const;
export type EmailType = typeof EMAIL_TYPES[number];

export const emailLogs = mssqlTable('email_logs', {
    id: int('id').identity().primaryKey(),
    emailType: nvarchar('email_type', { length: 50 }).notNull(),
    subject: nvarchar('subject', { length: 500 }).notNull(),
    recipientEmail: nvarchar('recipient_email', { length: 'max' }).notNull(),
    recipientName: nvarchar('recipient_name', { length: 255 }),
    status: nvarchar('status', { length: 20 }).notNull().default('sent'), // 'sent' | 'failed'
    errorMessage: nvarchar('error_message', { length: 'max' }),
    /** JSON blob: extra info like eventId, sessionId, ayLabel etc. */
    metadata: nvarchar('metadata', { length: 'max' }),
    sentByAdminId: int('sent_by_admin_id').references(() => admins.id, { onDelete: 'set null' }),
    sentAt: datetime2('sent_at').default(sql`getdate()`),
}, (t) => [
    check('chk_email_logs_status', sql`${t.status} IN ('sent','failed')`),
]);

// ─────────────────────────────────────────────────────────────────────────────
// INNOVATIVE IDEAS
// ─────────────────────────────────────────────────────────────────────────────

export const innovativeIdeas = mssqlTable('innovative_ideas', {
    id: int('id').identity().primaryKey(),
    volunteerId: int('volunteer_id').notNull().references(() => volunteers.id, { onDelete: 'cascade' }),
    title: nvarchar('title', { length: 255 }).notNull(),
    description: nvarchar('description', { length: 'max' }).notNull(),
    category: nvarchar('category', { length: 255 }).notNull(),
    article: nvarchar('article', { length: 'max' }),
    methodology: nvarchar('methodology', { length: 'max' }),
    benefits: nvarchar('benefits', { length: 'max' }),
    supportingDocumentUrl: nvarchar('supporting_document_url', { length: 'max' }),
    status: nvarchar('status', { length: 20 }).default('pending').notNull(),
    rejectionReason: nvarchar('rejection_reason', { length: 'max' }),
    approvedById: int('approved_by_id').references(() => admins.id),
    approvedAt: datetime2('approved_at'),
    deleteRequested: bit('delete_requested').default(false).notNull(),
    pendingUpdateData: nvarchar('pending_update_data', { length: 'max' }),
    createdAt: datetime2('created_at').default(sql`getdate()`),
    updatedAt: datetime2('updated_at').default(sql`getdate()`),
    updatedById: int('updated_by_id').references(() => admins.id),
    deletedById: int('deleted_by_id').references(() => admins.id),
    deletedAt: datetime2('deleted_at'),
}, (t) => [
    check('chk_innovative_ideas_status', sql`${t.status} IN ('pending','approved','rejected')`),
]);

export const innovativeIdeasRelations = relations(innovativeIdeas, ({ one }: any) => ({
    volunteer: one(volunteers, { fields: [innovativeIdeas.volunteerId], references: [volunteers.id] }),
    approvedBy: one(admins, { fields: [innovativeIdeas.approvedById], references: [admins.id] }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const achievements = mssqlTable('achievements', {
    id:             int('id').identity().primaryKey(),
    title:          nvarchar('title', { length: 255 }).notNull(),
    description:    nvarchar('description', { length: 'max' }).notNull(),
    imageUrl:       nvarchar('image_url', { length: 'max' }).notNull(),
    date:           datetime2('date').notNull(),
    academicYearId: int('academic_year_id').references(() => academicYears.id),
    createdById:    int('created_by_id').references(() => admins.id),
    createdAt:      datetime2('created_at').default(sql`getdate()`),
    updatedAt:      datetime2('updated_at').default(sql`getdate()`),
    updatedById:    int('updated_by_id').references(() => admins.id),
    deletedById:    int('deleted_by_id').references(() => admins.id),
    deletedAt:      datetime2('deleted_at'),
});

export const achievementsRelations = relations(achievements, ({ one }: any) => ({
    academicYear: one(academicYears, { fields: [achievements.academicYearId], references: [academicYears.id] }),
    createdBy:    one(admins,        { fields: [achievements.createdById],    references: [admins.id] }),
}));
