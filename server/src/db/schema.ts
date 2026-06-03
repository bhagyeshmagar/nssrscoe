import {
    pgTable,
    pgEnum,
    serial,
    text,
    timestamp,
    date,
    varchar,
    integer,
    boolean,
    unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const eventTypeEnum = pgEnum('event_type', ['upcoming', 'past']);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);

export const departmentEnum = pgEnum('department', [
    'Computer Engineering',
    'Computer Science and Business Systems',
    'Information Technology',
    'Electronics and Telecommunication',
    'Electrical Engineering',
    'Automation and Robotics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Bachelor of Computer Applications',
]);

export const roleTypeEnum = pgEnum('role_type', ['institution', 'student']);

/** regular = counts toward the 100-per-AY cap; backup = overflow list */
export const volunteerStatusEnum = pgEnum('volunteer_status', ['regular', 'backup']);

export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late']);

// ─────────────────────────────────────────────────────────────────────────────
// ADMINS
// ─────────────────────────────────────────────────────────────────────────────

export const admins = pgTable('admins', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    isSuperadmin: boolean('is_superadmin').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC YEARS
// ─────────────────────────────────────────────────────────────────────────────

export const academicYears = pgTable('academic_years', {
    id: serial('id').primaryKey(),
    label: varchar('label', { length: 20 }).notNull().unique(),   // "2024-25"
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    /** Enforced by partial unique index: UNIQUE (is_current) WHERE is_current = true */
    isCurrent: boolean('is_current').default(false).notNull(),
    /** Write-lock. All volunteer/core-team/camp mutations blocked when true. */
    isLocked: boolean('is_locked').default(false).notNull(),
    /** Archived AYs are fully read-only and hidden from active management views. */
    isArchived: boolean('is_archived').default(false).notNull(),
    volunteerCap: integer('volunteer_cap').default(100).notNull(),
    lockedAt: timestamp('locked_at'),
    lockedById: integer('locked_by_id').references(() => admins.id),
    regularActivityReportUrl: varchar('regular_activity_report_url', { length: 1024 }),
    specialCampReportUrl: varchar('special_camp_report_url', { length: 1024 }),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY CALENDAR
// ─────────────────────────────────────────────────────────────────────────────

export const activityCalendar = pgTable('activity_calendar', {
    id: serial('id').primaryKey(),
    academicYearId: integer('academic_year_id').references(() => academicYears.id, { onDelete: 'cascade' }).notNull(),
    month: varchar('month', { length: 50 }).notNull(),
    tentativeDate: varchar('tentative_date', { length: 255 }).notNull(),
    activity: varchar('activity', { length: 500 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'Field Work', 'Health', 'Campus', 'National'
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// VOLUNTEERS (auth + identity)
// ─────────────────────────────────────────────────────────────────────────────

export const volunteers = pgTable('volunteers', {
    id: serial('id').primaryKey(),
    academicYearId: integer('academic_year_id').references(() => academicYears.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    isActive: boolean('is_active').default(true),
    department: departmentEnum('department').notNull(),
    /** regular = counts toward 100-per-AY cap; backup = overflow */
    status: volunteerStatusEnum('status').default('regular').notNull(),
    createdById: integer('created_by_id').references(() => admins.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// VOLUNTEER PROFILES (self-filled personal details — kept split from auth)
// ─────────────────────────────────────────────────────────────────────────────

export const volunteerProfiles = pgTable('volunteer_profiles', {
    id: serial('id').primaryKey(),
    volunteerId: integer('volunteer_id')
        .references(() => volunteers.id, { onDelete: 'cascade' })
        .notNull()
        .unique(),
    fullName: varchar('full_name', { length: 255 }),
    prnNo: varchar('prn_no', { length: 50 }),
    /** FE / SE / TE / BE — the student's college year at NSS enrollment time. */
    collegeYearAtEnrollment: varchar('college_year_at_enrollment', { length: 20 }),
    nssYear: integer('nss_year'),
    marksheetUrl: text('marksheet_url'),
    cgpa: varchar('cgpa', { length: 10 }),
    eligibilityNo: varchar('eligibility_no', { length: 50 }),
    religion: varchar('religion', { length: 50 }),
    caste: varchar('caste', { length: 100 }),
    casteCategory: varchar('caste_category', { length: 50 }),
    phoneNo: varchar('phone_no', { length: 20 }),
    emailId: varchar('email_id', { length: 255 }),
    department: varchar('department', { length: 100 }), // Added so Drizzle can map the existing DB column
    profilePhotoUrl: text('profile_photo_url'),
    experienceText: text('experience_text'),
    portfolioChoices: text('portfolio_choices'), // Added for preferred portfolios
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// CORE TEAM ROLES (master reference — seeded once)
// ─────────────────────────────────────────────────────────────────────────────

export const coreTeamRoles = pgTable('core_team_roles', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    /** Stable code used for programmatic validation (e.g. 'department_coordinator'). */
    code: varchar('code', { length: 50 }).notNull().unique(),
    roleType: roleTypeEnum('role_type').notNull(),
    isUniquePerAy: boolean('is_unique_per_ay').default(true).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// CORE TEAM ASSIGNMENTS (per-AY selection)
// ─────────────────────────────────────────────────────────────────────────────

export const coreTeamAssignments = pgTable('core_team_assignments', {
    id: serial('id').primaryKey(),
    academicYearId: integer('academic_year_id').notNull().references(() => academicYears.id),
    coreTeamRoleId: integer('core_team_role_id').notNull().references(() => coreTeamRoles.id),
    volunteerId: integer('volunteer_id').references(() => volunteers.id, { onDelete: 'set null' }),
    /** For institution roles (principal, nss_po). NULL for student roles. */
    displayName: varchar('display_name', { length: 255 }),
    displayPhotoUrl: text('display_photo_url'),
    /** For department_coordinator only — which dept this coordinator manages. */
    department: varchar('department', { length: 100 }),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL CAMPS
// ─────────────────────────────────────────────────────────────────────────────

export const specialCamps = pgTable('special_camps', {
    id: serial('id').primaryKey(),
    academicYearId: integer('academic_year_id').notNull().references(() => academicYears.id),
    name: varchar('name', { length: 255 }).notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    description: text('description'),
    volunteerCap: integer('volunteer_cap').default(50).notNull(),
    isFinalized: boolean('is_finalized').default(false).notNull(),
    finalizedAt: timestamp('finalized_at'),
    finalizedById: integer('finalized_by_id').references(() => admins.id),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL CAMP PARTICIPANTS (snapshot)
// snap_* columns are frozen at finalization time and never updated after.
// ─────────────────────────────────────────────────────────────────────────────

export const specialCampParticipants = pgTable('special_camp_participants', {
    id: serial('id').primaryKey(),
    specialCampId: integer('special_camp_id').notNull().references(() => specialCamps.id, { onDelete: 'cascade' }),
    volunteerId: integer('volunteer_id').references(() => volunteers.id, { onDelete: 'set null' }),
    snapName: varchar('snap_name', { length: 255 }).notNull(),
    snapPrnNo: varchar('snap_prn_no', { length: 50 }),
    snapDepartment: varchar('snap_department', { length: 100 }),
    snapCollegeYearAtEnrollment: varchar('snap_college_year_at_enrollment', { length: 20 }),
    snapNssYear: integer('snap_nss_year'),
    snapCgpa: varchar('snap_cgpa', { length: 10 }),
    snapPhoneNo: varchar('snap_phone_no', { length: 20 }),
    snapFinalizedAt: timestamp('snap_finalized_at'),
    addedAt: timestamp('added_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const attendanceSessions = pgTable('attendance_sessions', {
    id: serial('id').primaryKey(),
    academicYearId: integer('academic_year_id').notNull().references(() => academicYears.id),
    eventId: integer('event_id').references(() => events.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    date: date('date').notNull(),
    description: text('description'),
    createdById: integer('created_by_id').references(() => admins.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE RECORDS
// ─────────────────────────────────────────────────────────────────────────────

export const attendanceRecords = pgTable('attendance_records', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').notNull().references(() => attendanceSessions.id, { onDelete: 'cascade' }),
    volunteerId: integer('volunteer_id').notNull().references(() => volunteers.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').notNull(),
    notes: text('notes'),
    recordedById: integer('recorded_by_id').references(() => admins.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
    unqSessionVolunteer: unique('unq_session_volunteer').on(t.sessionId, t.volunteerId),
}));

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
    id: serial('id').primaryKey(),
    /** e.g. 'volunteer.create', 'academic_year.lock', 'special_camp.finalize' */
    action: varchar('action', { length: 100 }).notNull(),
    /** e.g. 'volunteer', 'academic_year', 'special_camp' */
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: integer('entity_id'),
    performedById: integer('performed_by_id'),
    performedByRole: varchar('performed_by_role', { length: 20 }).default('admin').notNull(),
    academicYearId: integer('academic_year_id'),
    /** JSON string with relevant context (before/after values, params). */
    details: text('details'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export const events = pgTable('events', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    date: timestamp('date').notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    imageUrl: text('image_url'),
    type: eventTypeEnum('type').default('upcoming'),
    reportUrl: text('report_url'),
    volunteersCount: integer('volunteers_count').default(0),
    academicYearId: integer('academic_year_id').references(() => academicYears.id),
    createdAt: timestamp('created_at').defaultNow(),
});

export const eventImages = pgTable('event_images', {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').references(() => events.id).notNull(),
    url: text('url').notNull(),
    isMaster: boolean('is_master').default(false),
    caption: varchar('caption', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
});

export const eventRegistrations = pgTable('event_registrations', {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').references(() => events.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    department: varchar('department', { length: 100 }).notNull(),
    year: varchar('year', { length: 20 }).notNull(),
    visitorPassId: varchar('visitor_pass_id', { length: 50 }).unique(),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// GALLERY
// ─────────────────────────────────────────────────────────────────────────────

export const gallery = pgTable('gallery', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }),
    description: text('description').notNull().default(''),
    url: text('url').notNull(),
    type: mediaTypeEnum('type').default('image'),
    eventId: integer('event_id').references(() => events.id),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SITE SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

export const siteSettings = pgTable('site_settings', {
    id: serial('id').primaryKey(),
    key: varchar('key', { length: 100 }).notNull().unique(),
    value: text('value').notNull(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const adminsRelations = relations(admins, ({ many }) => ({
    createdVolunteers: many(volunteers),
    lockedYears: many(academicYears),
    finalizedCamps: many(specialCamps),
    attendanceSessions: many(attendanceSessions),
}));

export const academicYearsRelations = relations(academicYears, ({ many, one }) => ({
    volunteers: many(volunteers),
    coreTeamAssignments: many(coreTeamAssignments),
    specialCamps: many(specialCamps),
    events: many(events),
    attendanceSessions: many(attendanceSessions),
    lockedBy: one(admins, { fields: [academicYears.lockedById], references: [admins.id] }),
}));

export const volunteersRelations = relations(volunteers, ({ one, many }) => ({
    academicYear: one(academicYears, { fields: [volunteers.academicYearId], references: [academicYears.id] }),
    profile: one(volunteerProfiles, { fields: [volunteers.id], references: [volunteerProfiles.volunteerId] }),
    createdBy: one(admins, { fields: [volunteers.createdById], references: [admins.id] }),
    coreTeamAssignments: many(coreTeamAssignments),
    specialCampParticipations: many(specialCampParticipants),
    attendanceRecords: many(attendanceRecords),
}));

export const volunteerProfilesRelations = relations(volunteerProfiles, ({ one }) => ({
    volunteer: one(volunteers, { fields: [volunteerProfiles.volunteerId], references: [volunteers.id] }),
}));

export const coreTeamRolesRelations = relations(coreTeamRoles, ({ many }) => ({
    assignments: many(coreTeamAssignments),
}));

export const coreTeamAssignmentsRelations = relations(coreTeamAssignments, ({ one }) => ({
    academicYear: one(academicYears, { fields: [coreTeamAssignments.academicYearId], references: [academicYears.id] }),
    role: one(coreTeamRoles, { fields: [coreTeamAssignments.coreTeamRoleId], references: [coreTeamRoles.id] }),
    volunteer: one(volunteers, { fields: [coreTeamAssignments.volunteerId], references: [volunteers.id] }),
}));

export const specialCampsRelations = relations(specialCamps, ({ one, many }) => ({
    academicYear: one(academicYears, { fields: [specialCamps.academicYearId], references: [academicYears.id] }),
    finalizedBy: one(admins, { fields: [specialCamps.finalizedById], references: [admins.id] }),
    participants: many(specialCampParticipants),
}));

export const specialCampParticipantsRelations = relations(specialCampParticipants, ({ one }) => ({
    specialCamp: one(specialCamps, { fields: [specialCampParticipants.specialCampId], references: [specialCamps.id] }),
    volunteer: one(volunteers, { fields: [specialCampParticipants.volunteerId], references: [volunteers.id] }),
}));

export const attendanceSessionsRelations = relations(attendanceSessions, ({ one, many }) => ({
    academicYear: one(academicYears, { fields: [attendanceSessions.academicYearId], references: [academicYears.id] }),
    event: one(events, { fields: [attendanceSessions.eventId], references: [events.id] }),
    createdBy: one(admins, { fields: [attendanceSessions.createdById], references: [admins.id] }),
    records: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
    session: one(attendanceSessions, { fields: [attendanceRecords.sessionId], references: [attendanceSessions.id] }),
    volunteer: one(volunteers, { fields: [attendanceRecords.volunteerId], references: [volunteers.id] }),
    recordedBy: one(admins, { fields: [attendanceRecords.recordedById], references: [admins.id] }),
}));

export const eventsRelations = relations(events, ({ many, one }) => ({
    registrations: many(eventRegistrations),
    gallery: many(gallery),
    images: many(eventImages),
    academicYear: one(academicYears, { fields: [events.academicYearId], references: [academicYears.id] }),
    attendanceSessions: many(attendanceSessions),
}));

export const eventImagesRelations = relations(eventImages, ({ one }) => ({
    event: one(events, { fields: [eventImages.eventId], references: [events.id] }),
}));

export const registrationRelations = relations(eventRegistrations, ({ one }) => ({
    event: one(events, { fields: [eventRegistrations.eventId], references: [events.id] }),
}));

export const galleryRelations = relations(gallery, ({ one }) => ({
    event: one(events, { fields: [gallery.eventId], references: [events.id] }),
}));
