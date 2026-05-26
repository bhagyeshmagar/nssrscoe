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
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const eventTypeEnum = pgEnum('event_type', ['upcoming', 'past']);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);

/** Canonical department list for JSPM RSCOE. Enforces consistency across all records. */
export const departmentEnum = pgEnum('department', [
    'Computer Engineering',
    'Information Technology',
    'Electronics & Telecommunication Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Artificial Intelligence & Data Science',
]);

/**
 * Distinguishes between institution-level roles (Principal, NSS Program Officer)
 * which are manually entered, and student roles which must reference a volunteer
 * from the same academic year.
 */
export const roleTypeEnum = pgEnum('role_type', ['institution', 'student']);

// ─────────────────────────────────────────────────────────────────────────────
// ADMINS
// ─────────────────────────────────────────────────────────────────────────────

export const admins = pgTable('admins', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC YEARS
// Top-level aggregate. All volunteers, core team, and special camps belong to
// exactly one academic year.
// ─────────────────────────────────────────────────────────────────────────────

export const academicYears = pgTable('academic_years', {
    id: serial('id').primaryKey(),
    /** Human-readable label, e.g. "2024-25". Must be unique. */
    label: varchar('label', { length: 20 }).notNull().unique(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    /**
     * Only one AY can be current at a time.
     * Enforced by a partial unique index: UNIQUE (is_current) WHERE is_current = true.
     * Switching the current AY requires setting the previous one to false first.
     */
    isCurrent: boolean('is_current').default(false).notNull(),
    /**
     * When locked, all write operations (volunteers, core team, special camps)
     * scoped to this AY return 403. Read operations are always permitted.
     */
    isLocked: boolean('is_locked').default(false).notNull(),
    /** Maximum number of regular volunteers allowed for this AY. Default 100. */
    volunteerCap: integer('volunteer_cap').default(100).notNull(),
    lockedAt: timestamp('locked_at'),
    lockedById: integer('locked_by_id').references(() => admins.id),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// VOLUNTEERS (auth credentials + basic identity)
// ─────────────────────────────────────────────────────────────────────────────

export const volunteers = pgTable('volunteers', {
    id: serial('id').primaryKey(),
    /**
     * Every volunteer belongs to exactly one academic year.
     * The cap (volunteerCap) is enforced at the application layer before insert.
     */
    academicYearId: integer('academic_year_id').references(() => academicYears.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    isActive: boolean('is_active').default(true),
    /**
     * Canonical department — required at account creation time.
     * Uses the departmentEnum to prevent free-text drift.
     */
    department: departmentEnum('department').notNull(),
    createdById: integer('created_by_id').references(() => admins.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// VOLUNTEER PROFILES (self-filled personal details)
// Kept intentionally separate from the volunteers (auth) table so that
// credential data and personal data have distinct access paths.
// ─────────────────────────────────────────────────────────────────────────────

export const volunteerProfiles = pgTable('volunteer_profiles', {
    id: serial('id').primaryKey(),
    volunteerId: integer('volunteer_id')
        .references(() => volunteers.id, { onDelete: 'cascade' })
        .notNull()
        .unique(),
    fullName: varchar('full_name', { length: 255 }),
    prnNo: varchar('prn_no', { length: 50 }),
    /**
     * The student's current college year at the time of NSS enrollment (FE/SE/TE/BE).
     * This is intentionally separate from academic_year_id on the volunteers table,
     * which represents the NSS program year (e.g. "2024-25"), not the college year.
     */
    collegeYearAtEnrollment: varchar('college_year_at_enrollment', { length: 20 }),
    nssYear: integer('nss_year'),                   // 1 or 2 — which year of the NSS program
    marksheetUrl: text('marksheet_url'),
    cgpa: varchar('cgpa', { length: 10 }),
    eligibilityNo: varchar('eligibility_no', { length: 50 }),
    religion: varchar('religion', { length: 50 }),
    caste: varchar('caste', { length: 100 }),
    casteCategory: varchar('caste_category', { length: 50 }),
    phoneNo: varchar('phone_no', { length: 20 }),
    emailId: varchar('email_id', { length: 255 }),
    profilePhotoUrl: text('profile_photo_url'),
    experienceText: text('experience_text'),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// CORE TEAM ROLES (master reference table)
// Seeded once at setup. Contains both institution-level roles (Principal,
// NSS Program Officer) and student roles (Secretary, etc.).
// ─────────────────────────────────────────────────────────────────────────────

export const coreTeamRoles = pgTable('core_team_roles', {
    id: serial('id').primaryKey(),
    /** Role name, e.g. "Secretary", "Principal". Must be globally unique. */
    name: varchar('name', { length: 100 }).notNull().unique(),
    /** 'institution' roles bypass the volunteer cap and use display_name/photo directly. */
    roleType: roleTypeEnum('role_type').notNull(),
    /**
     * When true, only one volunteer (or institution person) can hold this role
     * per academic year. E.g. Secretary is unique; a generic "Committee Member" might not be.
     */
    isUniquePerAy: boolean('is_unique_per_ay').default(true).notNull(),
    /** Controls display ordering on the public /members page. */
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// CORE TEAM ASSIGNMENTS (per-AY selection)
// Links a role → a volunteer (student roles) or a named person (institution roles).
// ─────────────────────────────────────────────────────────────────────────────

export const coreTeamAssignments = pgTable('core_team_assignments', {
    id: serial('id').primaryKey(),
    academicYearId: integer('academic_year_id')
        .notNull()
        .references(() => academicYears.id),
    coreTeamRoleId: integer('core_team_role_id')
        .notNull()
        .references(() => coreTeamRoles.id),
    /**
     * For student roles: must reference a volunteer from the SAME academicYearId.
     * For institution roles: must be NULL (Principal/NSS PO are not in volunteers table).
     * SET NULL on delete so the assignment record survives if the volunteer is removed.
     */
    volunteerId: integer('volunteer_id').references(() => volunteers.id, { onDelete: 'set null' }),
    /** Used only when volunteerId IS NULL (institution roles). */
    displayName: varchar('display_name', { length: 255 }),
    /** Used only when volunteerId IS NULL (institution roles). */
    displayPhotoUrl: text('display_photo_url'),
    /** Overrides role-level display order within a specific AY if needed. */
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL CAMPS
// ─────────────────────────────────────────────────────────────────────────────

export const specialCamps = pgTable('special_camps', {
    id: serial('id').primaryKey(),
    academicYearId: integer('academic_year_id')
        .notNull()
        .references(() => academicYears.id),
    name: varchar('name', { length: 255 }).notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    description: text('description'),
    /**
     * While false: participants can be freely added or removed.
     * Once true: the participant list is sealed and snapshot columns are frozen.
     * Cannot be reversed.
     */
    isFinalized: boolean('is_finalized').default(false).notNull(),
    finalizedAt: timestamp('finalized_at'),
    finalizedById: integer('finalized_by_id').references(() => admins.id),
    createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL CAMP PARTICIPANTS (snapshot table)
// snap_* columns are populated from the volunteer's live profile at the moment
// the camp is finalized. After that, the live profile may change but these
// snapshot columns remain unchanged — they are the official record.
// ─────────────────────────────────────────────────────────────────────────────

export const specialCampParticipants = pgTable('special_camp_participants', {
    id: serial('id').primaryKey(),
    specialCampId: integer('special_camp_id')
        .notNull()
        .references(() => specialCamps.id, { onDelete: 'cascade' }),
    /**
     * The live volunteer FK. SET NULL if the volunteer record is deleted later,
     * preserving the historical snapshot.
     */
    volunteerId: integer('volunteer_id').references(() => volunteers.id, { onDelete: 'set null' }),
    // ── Snapshot columns (written at finalization time, never updated after) ──
    snapName: varchar('snap_name', { length: 255 }).notNull(),
    snapPrnNo: varchar('snap_prn_no', { length: 50 }),
    snapDepartment: varchar('snap_department', { length: 100 }),
    snapCollegeYearAtEnrollment: varchar('snap_college_year_at_enrollment', { length: 20 }),
    snapNssYear: integer('snap_nss_year'),
    snapCgpa: varchar('snap_cgpa', { length: 10 }),
    snapPhoneNo: varchar('snap_phone_no', { length: 20 }),
    /** Timestamp at which snapshot data was captured (= camp finalization time). */
    snapFinalizedAt: timestamp('snap_finalized_at'),
    addedAt: timestamp('added_at').defaultNow(),
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
    /** Optional link to an academic year. Allows grouping past events by AY. */
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
}));

export const academicYearsRelations = relations(academicYears, ({ many, one }) => ({
    volunteers: many(volunteers),
    coreTeamAssignments: many(coreTeamAssignments),
    specialCamps: many(specialCamps),
    events: many(events),
    lockedBy: one(admins, {
        fields: [academicYears.lockedById],
        references: [admins.id],
    }),
}));

export const volunteersRelations = relations(volunteers, ({ one, many }) => ({
    academicYear: one(academicYears, {
        fields: [volunteers.academicYearId],
        references: [academicYears.id],
    }),
    profile: one(volunteerProfiles, {
        fields: [volunteers.id],
        references: [volunteerProfiles.volunteerId],
    }),
    createdBy: one(admins, {
        fields: [volunteers.createdById],
        references: [admins.id],
    }),
    coreTeamAssignments: many(coreTeamAssignments),
    specialCampParticipations: many(specialCampParticipants),
}));

export const volunteerProfilesRelations = relations(volunteerProfiles, ({ one }) => ({
    volunteer: one(volunteers, {
        fields: [volunteerProfiles.volunteerId],
        references: [volunteers.id],
    }),
}));

export const coreTeamRolesRelations = relations(coreTeamRoles, ({ many }) => ({
    assignments: many(coreTeamAssignments),
}));

export const coreTeamAssignmentsRelations = relations(coreTeamAssignments, ({ one }) => ({
    academicYear: one(academicYears, {
        fields: [coreTeamAssignments.academicYearId],
        references: [academicYears.id],
    }),
    role: one(coreTeamRoles, {
        fields: [coreTeamAssignments.coreTeamRoleId],
        references: [coreTeamRoles.id],
    }),
    volunteer: one(volunteers, {
        fields: [coreTeamAssignments.volunteerId],
        references: [volunteers.id],
    }),
}));

export const specialCampsRelations = relations(specialCamps, ({ one, many }) => ({
    academicYear: one(academicYears, {
        fields: [specialCamps.academicYearId],
        references: [academicYears.id],
    }),
    finalizedBy: one(admins, {
        fields: [specialCamps.finalizedById],
        references: [admins.id],
    }),
    participants: many(specialCampParticipants),
}));

export const specialCampParticipantsRelations = relations(specialCampParticipants, ({ one }) => ({
    specialCamp: one(specialCamps, {
        fields: [specialCampParticipants.specialCampId],
        references: [specialCamps.id],
    }),
    volunteer: one(volunteers, {
        fields: [specialCampParticipants.volunteerId],
        references: [volunteers.id],
    }),
}));

export const eventsRelations = relations(events, ({ many, one }) => ({
    registrations: many(eventRegistrations),
    gallery: many(gallery),
    images: many(eventImages),
    academicYear: one(academicYears, {
        fields: [events.academicYearId],
        references: [academicYears.id],
    }),
}));

export const eventImagesRelations = relations(eventImages, ({ one }) => ({
    event: one(events, {
        fields: [eventImages.eventId],
        references: [events.id],
    }),
}));

export const registrationRelations = relations(eventRegistrations, ({ one }) => ({
    event: one(events, {
        fields: [eventRegistrations.eventId],
        references: [events.id],
    }),
}));

export const galleryRelations = relations(gallery, ({ one }) => ({
    event: one(events, {
        fields: [gallery.eventId],
        references: [events.id],
    }),
}));
