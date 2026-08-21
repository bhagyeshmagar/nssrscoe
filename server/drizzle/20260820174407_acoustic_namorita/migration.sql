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
ALTER TABLE [email_logs] ADD CONSTRAINT [email_logs_sent_by_admin_id_admins_id_fk] FOREIGN KEY ([sent_by_admin_id]) REFERENCES [admins]([id]) ON DELETE SET NULL;--> statement-breakpoint
CREATE UNIQUE INDEX [unq_is_current] ON [academic_years] ([is_current]) WHERE [is_current] = 1;--> statement-breakpoint
ALTER TABLE [meeting_attendance] ADD CONSTRAINT [unq_meeting_volunteer] UNIQUE([meeting_id],[volunteer_id]);