import { pgTable, serial, text, timestamp, varchar, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const eventTypeEnum = pgEnum('event_type', ['upcoming', 'past']);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);

export const admins = pgTable('admins', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

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
    createdAt: timestamp('created_at').defaultNow(),
});

export const eventRegistrations = pgTable('event_registrations', {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').references(() => events.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    department: varchar('department', { length: 100 }).notNull(),
    year: varchar('year', { length: 20 }).notNull(), // e.g., 'FE', 'SE', 'TE', 'BE'
    visitorPassId: varchar('visitor_pass_id', { length: 50 }).unique(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const coreMembers = pgTable('core_members', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 100 }).notNull(), // Program Officer, Secretary, etc.
    photoUrl: text('photo_url'),
    year: varchar('year', { length: 20 }), // Academic year or serving year
    createdAt: timestamp('created_at').defaultNow(),
});

export const gallery = pgTable('gallery', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }),
    url: text('url').notNull(),
    type: mediaTypeEnum('type').default('image'),
    eventId: integer('event_id').references(() => events.id),
    createdAt: timestamp('created_at').defaultNow(),
});

// Event images table for multiple images per event
export const eventImages = pgTable('event_images', {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').references(() => events.id).notNull(),
    url: text('url').notNull(),
    isMaster: boolean('is_master').default(false),
    caption: varchar('caption', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
});

export const eventsRelations = relations(events, ({ many }) => ({
    registrations: many(eventRegistrations),
    gallery: many(gallery),
    images: many(eventImages),
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

// Site settings for customizable content
export const siteSettings = pgTable('site_settings', {
    id: serial('id').primaryKey(),
    key: varchar('key', { length: 100 }).notNull().unique(),
    value: text('value').notNull(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Volunteers table - managed by admin
export const volunteers = pgTable('volunteers', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    isActive: boolean('is_active').default(true),
    createdById: integer('created_by_id').references(() => admins.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Volunteer profile details - filled by volunteer
export const volunteerProfiles = pgTable('volunteer_profiles', {
    id: serial('id').primaryKey(),
    volunteerId: integer('volunteer_id').references(() => volunteers.id, { onDelete: 'cascade' }).notNull().unique(),
    fullName: varchar('full_name', { length: 255 }),
    prnNo: varchar('prn_no', { length: 50 }),
    department: varchar('department', { length: 100 }),
    academicYear: varchar('academic_year', { length: 20 }),
    nssYear: integer('nss_year'), // 1 or 2
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

// Volunteer relations
export const volunteersRelations = relations(volunteers, ({ one }) => ({
    profile: one(volunteerProfiles, {
        fields: [volunteers.id],
        references: [volunteerProfiles.volunteerId],
    }),
    createdBy: one(admins, {
        fields: [volunteers.createdById],
        references: [admins.id],
    }),
}));

export const volunteerProfilesRelations = relations(volunteerProfiles, ({ one }) => ({
    volunteer: one(volunteers, {
        fields: [volunteerProfiles.volunteerId],
        references: [volunteers.id],
    }),
}));
