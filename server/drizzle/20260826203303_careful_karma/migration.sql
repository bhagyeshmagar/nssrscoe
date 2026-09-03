CREATE TABLE [email_logs] (
	[id] int IDENTITY(1, 1),
	[email_type] nvarchar(50) NOT NULL,
	[subject] nvarchar(500) NOT NULL,
	[recipient_email] nvarchar(max) NOT NULL,
	[recipient_name] nvarchar(255),
	[status] nvarchar(20) NOT NULL CONSTRAINT [email_logs_status_default] DEFAULT ('sent'),
	[error_message] nvarchar(max),
	[metadata] nvarchar(max),
	[sent_by_admin_id] int,
	[sent_at] datetime2 CONSTRAINT [email_logs_sent_at_default] DEFAULT (getdate()),
	CONSTRAINT [email_logs_pkey] PRIMARY KEY([id]),
	CONSTRAINT [chk_email_logs_status] CHECK ([email_logs].[status] IN ('sent','failed'))
);
--> statement-breakpoint
CREATE TABLE [hod_contacts] (
	[id] int IDENTITY(1, 1),
	[department] nvarchar(100) NOT NULL,
	[name] nvarchar(255) NOT NULL,
	[email] nvarchar(255) NOT NULL,
	[is_active] bit NOT NULL CONSTRAINT [hod_contacts_is_active_default] DEFAULT ((1)),
	[created_at] datetime2 CONSTRAINT [hod_contacts_created_at_default] DEFAULT (getdate()),
	[updated_at] datetime2 CONSTRAINT [hod_contacts_updated_at_default] DEFAULT (getdate()),
	CONSTRAINT [hod_contacts_pkey] PRIMARY KEY([id]),
	CONSTRAINT [hod_contacts_department_key] UNIQUE([department])
);
--> statement-breakpoint
CREATE TABLE [home_slider_images] (
	[id] int IDENTITY(1, 1),
	[url] nvarchar(max) NOT NULL,
	[description] nvarchar(255) CONSTRAINT [home_slider_images_description_default] DEFAULT (''),
	[event_id] int,
	[approval_status] nvarchar(20) NOT NULL CONSTRAINT [home_slider_images_approval_status_default] DEFAULT ('pending'),
	[approved_by_id] int,
	[approved_at] datetime2,
	[created_at] datetime2 CONSTRAINT [home_slider_images_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [home_slider_images_pkey] PRIMARY KEY([id]),
	CONSTRAINT [chk_slider_approval_status] CHECK ([home_slider_images].[approval_status] IN ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE TABLE [innovative_ideas] (
	[id] int IDENTITY(1, 1),
	[volunteer_id] int NOT NULL,
	[title] nvarchar(255) NOT NULL,
	[description] nvarchar(max) NOT NULL,
	[category] nvarchar(255) NOT NULL,
	[article] nvarchar(max),
	[methodology] nvarchar(max),
	[benefits] nvarchar(max),
	[supporting_document_url] nvarchar(max),
	[status] nvarchar(20) NOT NULL CONSTRAINT [innovative_ideas_status_default] DEFAULT ('pending'),
	[rejection_reason] nvarchar(max),
	[approved_by_id] int,
	[approved_at] datetime2,
	[delete_requested] bit NOT NULL CONSTRAINT [innovative_ideas_delete_requested_default] DEFAULT ((0)),
	[pending_update_data] nvarchar(max),
	[created_at] datetime2 CONSTRAINT [innovative_ideas_created_at_default] DEFAULT (getdate()),
	[updated_at] datetime2 CONSTRAINT [innovative_ideas_updated_at_default] DEFAULT (getdate()),
	CONSTRAINT [innovative_ideas_pkey] PRIMARY KEY([id]),
	CONSTRAINT [chk_innovative_ideas_status] CHECK ([innovative_ideas].[status] IN ('pending','approved','rejected'))
);
--> statement-breakpoint
ALTER TABLE [event_registrations] ADD [has_attended] bit NOT NULL CONSTRAINT [event_registrations_has_attended_default] DEFAULT ((0));--> statement-breakpoint
ALTER TABLE [events] ADD [approval_status] nvarchar(20) NOT NULL CONSTRAINT [events_approval_status_default] DEFAULT ('pending');--> statement-breakpoint
ALTER TABLE [events] ADD [approved_by_id] int;--> statement-breakpoint
ALTER TABLE [events] ADD [approved_at] datetime2;--> statement-breakpoint
ALTER TABLE [volunteer_profiles] ADD [is_experience_approved] bit CONSTRAINT [volunteer_profiles_is_experience_approved_default] DEFAULT ((0));--> statement-breakpoint
ALTER TABLE [events] ALTER COLUMN [description] nvarchar(max);--> statement-breakpoint
ALTER TABLE [email_logs] ADD CONSTRAINT [email_logs_sent_by_admin_id_admins_id_fk] FOREIGN KEY ([sent_by_admin_id]) REFERENCES [admins]([id]) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE [events] ADD CONSTRAINT [events_approved_by_id_admins_id_fk] FOREIGN KEY ([approved_by_id]) REFERENCES [admins]([id]);--> statement-breakpoint
ALTER TABLE [home_slider_images] ADD CONSTRAINT [home_slider_images_event_id_events_id_fk] FOREIGN KEY ([event_id]) REFERENCES [events]([id]) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE [home_slider_images] ADD CONSTRAINT [home_slider_images_approved_by_id_admins_id_fk] FOREIGN KEY ([approved_by_id]) REFERENCES [admins]([id]);--> statement-breakpoint
ALTER TABLE [innovative_ideas] ADD CONSTRAINT [innovative_ideas_volunteer_id_volunteers_id_fk] FOREIGN KEY ([volunteer_id]) REFERENCES [volunteers]([id]) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE [innovative_ideas] ADD CONSTRAINT [innovative_ideas_approved_by_id_admins_id_fk] FOREIGN KEY ([approved_by_id]) REFERENCES [admins]([id]);--> statement-breakpoint
CREATE UNIQUE INDEX [unq_is_current] ON [academic_years] ([is_current]) WHERE [is_current] = 1;--> statement-breakpoint
ALTER TABLE [event_registrations] ADD CONSTRAINT [unq_event_email] UNIQUE([event_id],[email]);--> statement-breakpoint
ALTER TABLE [meeting_attendance] ADD CONSTRAINT [unq_meeting_volunteer] UNIQUE([meeting_id],[volunteer_id]);--> statement-breakpoint
ALTER TABLE [events] ADD CONSTRAINT [chk_events_approval_status] CHECK ([events].[approval_status] IN ('pending','approved','rejected'));