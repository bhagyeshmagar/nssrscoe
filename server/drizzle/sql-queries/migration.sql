CREATE TABLE [academic_years] (
	[id] int IDENTITY(1, 1),
	[label] nvarchar(20) NOT NULL,
	[start_date] date NOT NULL,
	[end_date] date NOT NULL,
	[is_current] bit NOT NULL CONSTRAINT [academic_years_is_current_default] DEFAULT ((0)),
	[is_locked] bit NOT NULL CONSTRAINT [academic_years_is_locked_default] DEFAULT ((0)),
	[is_archived] bit NOT NULL CONSTRAINT [academic_years_is_archived_default] DEFAULT ((0)),
	[volunteer_cap] int NOT NULL CONSTRAINT [academic_years_volunteer_cap_default] DEFAULT ((100)),
	[locked_at] datetime2,
	[locked_by_id] int,
	[regular_activity_report_url] nvarchar(1024),
	[special_camp_report_url] nvarchar(1024),
	[created_at] datetime2 CONSTRAINT [academic_years_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [academic_years_pkey] PRIMARY KEY([id]),
	CONSTRAINT [academic_years_label_key] UNIQUE([label])
);
--> statement-breakpoint
CREATE TABLE [activity_calendar] (
	[id] int IDENTITY(1, 1),
	[academic_year_id] int NOT NULL,
	[month] nvarchar(50) NOT NULL,
	[tentative_date] nvarchar(255) NOT NULL,
	[activity] nvarchar(500) NOT NULL,
	[type] nvarchar(50) NOT NULL,
	[created_at] datetime2 CONSTRAINT [activity_calendar_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [activity_calendar_pkey] PRIMARY KEY([id])
);
--> statement-breakpoint
CREATE TABLE [admins] (
	[id] int IDENTITY(1, 1),
	[username] nvarchar(255) NOT NULL,
	[password_hash] nvarchar(max) NOT NULL,
	[is_superadmin] bit NOT NULL CONSTRAINT [admins_is_superadmin_default] DEFAULT ((0)),
	[created_at] datetime2 CONSTRAINT [admins_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [admins_pkey] PRIMARY KEY([id]),
	CONSTRAINT [admins_username_key] UNIQUE([username])
);
--> statement-breakpoint
CREATE TABLE [attendance_records] (
	[id] int IDENTITY(1, 1),
	[session_id] int NOT NULL,
	[volunteer_id] int NOT NULL,
	[status] nvarchar(20) NOT NULL,
	[notes] nvarchar(max),
	[recorded_by_id] int,
	[created_at] datetime2 CONSTRAINT [attendance_records_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [attendance_records_pkey] PRIMARY KEY([id]),
	CONSTRAINT [unq_session_volunteer] UNIQUE([session_id],[volunteer_id]),
	CONSTRAINT [chk_attendance_records_status] CHECK ([attendance_records].[status] IN ('present','absent','late'))
);
--> statement-breakpoint
CREATE TABLE [attendance_sessions] (
	[id] int IDENTITY(1, 1),
	[academic_year_id] int NOT NULL,
	[event_id] int,
	[title] nvarchar(255) NOT NULL,
	[date] date NOT NULL,
	[description] nvarchar(max),
	[created_by_id] int,
	[created_at] datetime2 CONSTRAINT [attendance_sessions_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [attendance_sessions_pkey] PRIMARY KEY([id])
);
--> statement-breakpoint
CREATE TABLE [audit_logs] (
	[id] int IDENTITY(1, 1),
	[action] nvarchar(100) NOT NULL,
	[entity_type] nvarchar(50) NOT NULL,
	[entity_id] int,
	[performed_by_id] int,
	[performed_by_role] nvarchar(20) NOT NULL CONSTRAINT [audit_logs_performed_by_role_default] DEFAULT ('admin'),
	[academic_year_id] int,
	[details] nvarchar(max),
	[created_at] datetime2 CONSTRAINT [audit_logs_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [audit_logs_pkey] PRIMARY KEY([id])
);
--> statement-breakpoint
CREATE TABLE [core_team_assignments] (
	[id] int IDENTITY(1, 1),
	[academic_year_id] int NOT NULL,
	[core_team_role_id] int NOT NULL,
	[volunteer_id] int,
	[display_name] nvarchar(255),
	[display_photo_url] nvarchar(max),
	[department] nvarchar(100),
	[display_order] int CONSTRAINT [core_team_assignments_display_order_default] DEFAULT ((0)),
	[created_at] datetime2 CONSTRAINT [core_team_assignments_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [core_team_assignments_pkey] PRIMARY KEY([id])
);
--> statement-breakpoint
CREATE TABLE [core_team_roles] (
	[id] int IDENTITY(1, 1),
	[name] nvarchar(100) NOT NULL,
	[code] nvarchar(50) NOT NULL,
	[role_type] nvarchar(20) NOT NULL,
	[is_unique_per_ay] bit NOT NULL CONSTRAINT [core_team_roles_is_unique_per_ay_default] DEFAULT ((1)),
	[display_order] int NOT NULL CONSTRAINT [core_team_roles_display_order_default] DEFAULT ((0)),
	[category] nvarchar(100),
	[created_at] datetime2 CONSTRAINT [core_team_roles_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [core_team_roles_pkey] PRIMARY KEY([id]),
	CONSTRAINT [core_team_roles_name_key] UNIQUE([name]),
	CONSTRAINT [core_team_roles_code_key] UNIQUE([code]),
	CONSTRAINT [chk_core_team_roles_role_type] CHECK ([core_team_roles].[role_type] IN ('institution','student'))
);
--> statement-breakpoint
CREATE TABLE [event_images] (
	[id] int IDENTITY(1, 1),
	[event_id] int NOT NULL,
	[url] nvarchar(max) NOT NULL,
	[is_master] bit CONSTRAINT [event_images_is_master_default] DEFAULT ((0)),
	[caption] nvarchar(255),
	[created_at] datetime2 CONSTRAINT [event_images_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [event_images_pkey] PRIMARY KEY([id])
);
--> statement-breakpoint
CREATE TABLE [event_registrations] (
	[id] int IDENTITY(1, 1),
	[event_id] int NOT NULL,
	[name] nvarchar(255) NOT NULL,
	[email] nvarchar(255) NOT NULL,
	[phone] nvarchar(20) NOT NULL,
	[department] nvarchar(100) NOT NULL,
	[year] nvarchar(20) NOT NULL,
	[visitor_pass_id] nvarchar(50),
	[status] nvarchar(20) NOT NULL CONSTRAINT [event_registrations_status_default] DEFAULT ('pending'),
	[approved_at] datetime2,
	[approved_by_id] int,
	[created_at] datetime2 CONSTRAINT [event_registrations_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [event_registrations_pkey] PRIMARY KEY([id]),
	CONSTRAINT [event_registrations_visitor_pass_id_key] UNIQUE([visitor_pass_id]),
	CONSTRAINT [chk_event_registrations_status] CHECK ([event_registrations].[status] IN ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE TABLE [events] (
	[id] int IDENTITY(1, 1),
	[title] nvarchar(255) NOT NULL,
	[description] nvarchar(max) NOT NULL,
	[date] datetime2 NOT NULL,
	[location] nvarchar(255) NOT NULL,
	[image_url] nvarchar(max),
	[type] nvarchar(20) CONSTRAINT [events_type_default] DEFAULT ('upcoming'),
	[report_url] nvarchar(max),
	[drive_link] nvarchar(max),
	[volunteers_count] int CONSTRAINT [events_volunteers_count_default] DEFAULT ((0)),
	[academic_year_id] int,
	[created_at] datetime2 CONSTRAINT [events_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [events_pkey] PRIMARY KEY([id]),
	CONSTRAINT [chk_events_type] CHECK ([events].[type] IN ('upcoming','past'))
);
--> statement-breakpoint
CREATE TABLE [gallery] (
	[id] int IDENTITY(1, 1),
	[title] nvarchar(255),
	[description] nvarchar(max) NOT NULL CONSTRAINT [gallery_description_default] DEFAULT (''),
	[url] nvarchar(max) NOT NULL,
	[type] nvarchar(20) CONSTRAINT [gallery_type_default] DEFAULT ('image'),
	[event_id] int,
	[status] nvarchar(20) NOT NULL CONSTRAINT [gallery_status_default] DEFAULT ('pending'),
	[submitted_by_id] int,
	[reviewed_by_id] int,
	[rejection_reason] nvarchar(max),
	[created_at] datetime2 CONSTRAINT [gallery_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [gallery_pkey] PRIMARY KEY([id]),
	CONSTRAINT [chk_gallery_type] CHECK ([gallery].[type] IN ('image','video')),
	CONSTRAINT [chk_gallery_status] CHECK ([gallery].[status] IN ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE TABLE [meeting_attendance] (
	[id] int IDENTITY(1, 1),
	[meeting_id] int NOT NULL,
	[volunteer_id] int NOT NULL,
	[status] nvarchar(20) NOT NULL,
	[volunteer_type] nvarchar(20) NOT NULL,
	[notes] nvarchar(max),
	[marked_by_id] int,
	[marked_at] datetime2 CONSTRAINT [meeting_attendance_marked_at_default] DEFAULT (getdate()),
	CONSTRAINT [meeting_attendance_pkey] PRIMARY KEY([id]),
	CONSTRAINT [chk_meeting_attendance_status] CHECK ([meeting_attendance].[status] IN ('present','absent','late')),
	CONSTRAINT [chk_meeting_attendance_volunteer_type] CHECK ([meeting_attendance].[volunteer_type] IN ('regular','backup'))
);
--> statement-breakpoint
CREATE TABLE [meetings] (
	[id] int IDENTITY(1, 1),
	[academic_year_id] int NOT NULL,
	[title] nvarchar(255) NOT NULL,
	[description] nvarchar(max),
	[meeting_type] nvarchar(50) NOT NULL,
	[status] nvarchar(50) NOT NULL CONSTRAINT [meetings_status_default] DEFAULT ('scheduled'),
	[scheduled_date] datetime2 NOT NULL,
	[location] nvarchar(255) NOT NULL,
	[started_at] datetime2,
	[ended_at] datetime2,
	[duration_minutes] int,
	[special_camp_id] int,
	[created_by_id] int,
	[created_at] datetime2 CONSTRAINT [meetings_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [meetings_pkey] PRIMARY KEY([id]),
	CONSTRAINT [chk_meetings_meeting_type] CHECK ([meetings].[meeting_type] IN ('regular','core_team','special_camp')),
	CONSTRAINT [chk_meetings_status] CHECK ([meetings].[status] IN ('scheduled','active','ended'))
);
--> statement-breakpoint
CREATE TABLE [notifications] (
	[id] int IDENTITY(1, 1),
	[volunteer_id] int NOT NULL,
	[type] nvarchar(50) NOT NULL,
	[title] nvarchar(255) NOT NULL,
	[body] nvarchar(max) NOT NULL,
	[is_read] bit NOT NULL CONSTRAINT [notifications_is_read_default] DEFAULT ((0)),
	[email_sent] bit NOT NULL CONSTRAINT [notifications_email_sent_default] DEFAULT ((0)),
	[reference_type] nvarchar(50),
	[reference_id] int,
	[created_at] datetime2 CONSTRAINT [notifications_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [notifications_pkey] PRIMARY KEY([id])
);
--> statement-breakpoint
CREATE TABLE [site_settings] (
	[id] int IDENTITY(1, 1),
	[key] nvarchar(100) NOT NULL,
	[value] nvarchar(max) NOT NULL,
	[updated_at] datetime2 CONSTRAINT [site_settings_updated_at_default] DEFAULT (getdate()),
	CONSTRAINT [site_settings_pkey] PRIMARY KEY([id]),
	CONSTRAINT [site_settings_key_key] UNIQUE([key])
);
--> statement-breakpoint
CREATE TABLE [special_camp_participants] (
	[id] int IDENTITY(1, 1),
	[special_camp_id] int NOT NULL,
	[volunteer_id] int,
	[snap_name] nvarchar(255) NOT NULL,
	[snap_prn_no] nvarchar(50),
	[snap_department] nvarchar(100),
	[snap_college_year_at_enrollment] nvarchar(20),
	[snap_nss_year] int,
	[snap_cgpa] nvarchar(10),
	[snap_phone_no] nvarchar(20),
	[snap_finalized_at] datetime2,
	[added_at] datetime2 CONSTRAINT [special_camp_participants_added_at_default] DEFAULT (getdate()),
	CONSTRAINT [special_camp_participants_pkey] PRIMARY KEY([id])
);
--> statement-breakpoint
CREATE TABLE [special_camps] (
	[id] int IDENTITY(1, 1),
	[academic_year_id] int NOT NULL,
	[name] nvarchar(255) NOT NULL,
	[location] nvarchar(255) NOT NULL,
	[start_date] date NOT NULL,
	[end_date] date NOT NULL,
	[description] nvarchar(max),
	[volunteer_cap] int NOT NULL CONSTRAINT [special_camps_volunteer_cap_default] DEFAULT ((50)),
	[is_finalized] bit NOT NULL CONSTRAINT [special_camps_is_finalized_default] DEFAULT ((0)),
	[finalized_at] datetime2,
	[finalized_by_id] int,
	[created_at] datetime2 CONSTRAINT [special_camps_created_at_default] DEFAULT (getdate()),
	CONSTRAINT [special_camps_pkey] PRIMARY KEY([id])
);
--> statement-breakpoint
CREATE TABLE [volunteer_profiles] (
	[id] int IDENTITY(1, 1),
	[volunteer_id] int NOT NULL,
	[full_name] nvarchar(255),
	[prn_no] nvarchar(50),
	[college_year_at_enrollment] nvarchar(20),
	[nss_year] int,
	[marksheet_url] nvarchar(max),
	[cgpa] nvarchar(10),
	[eligibility_no] nvarchar(50),
	[religion] nvarchar(50),
	[caste] nvarchar(100),
	[caste_category] nvarchar(50),
	[phone_no] nvarchar(20),
	[email_id] nvarchar(255),
	[department] nvarchar(100),
	[profile_photo_url] nvarchar(max),
	[experience_text] nvarchar(max),
	[portfolio_choices] nvarchar(max),
	[updated_at] datetime2 CONSTRAINT [volunteer_profiles_updated_at_default] DEFAULT (getdate()),
	CONSTRAINT [volunteer_profiles_pkey] PRIMARY KEY([id]),
	CONSTRAINT [volunteer_profiles_volunteer_id_key] UNIQUE([volunteer_id])
);
--> statement-breakpoint
CREATE TABLE [volunteers] (
	[id] int IDENTITY(1, 1),
	[academic_year_id] int NOT NULL,
	[name] nvarchar(255) NOT NULL,
	[email] nvarchar(255) NOT NULL,
	[password_hash] nvarchar(max) NOT NULL,
	[is_active] bit CONSTRAINT [volunteers_is_active_default] DEFAULT ((1)),
	[department] nvarchar(100) NOT NULL,
	[status] nvarchar(20) NOT NULL CONSTRAINT [volunteers_status_default] DEFAULT ('regular'),
	[created_by_id] int,
	[created_at] datetime2 CONSTRAINT [volunteers_created_at_default] DEFAULT (getdate()),
	[updated_at] datetime2 CONSTRAINT [volunteers_updated_at_default] DEFAULT (getdate()),
	CONSTRAINT [volunteers_pkey] PRIMARY KEY([id]),
	CONSTRAINT [volunteers_email_key] UNIQUE([email]),
	CONSTRAINT [chk_volunteers_department] CHECK ([volunteers].[department] IN ('Computer Engineering','Computer Science and Business Systems','Information Technology','Electronics and Telecommunication','Electrical Engineering','Automation and Robotics','Mechanical Engineering','Civil Engineering','Bachelor of Computer Applications')),
	CONSTRAINT [chk_volunteers_status] CHECK ([volunteers].[status] IN ('regular','backup'))
);
--> statement-breakpoint
ALTER TABLE [academic_years] ADD CONSTRAINT [academic_years_locked_by_id_admins_id_fk] FOREIGN KEY ([locked_by_id]) REFERENCES [admins]([id]);--> statement-breakpoint
ALTER TABLE [activity_calendar] ADD CONSTRAINT [activity_calendar_academic_year_id_academic_years_id_fk] FOREIGN KEY ([academic_year_id]) REFERENCES [academic_years]([id]) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE [attendance_records] ADD CONSTRAINT [attendance_records_session_id_attendance_sessions_id_fk] FOREIGN KEY ([session_id]) REFERENCES [attendance_sessions]([id]) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE [attendance_records] ADD CONSTRAINT [attendance_records_volunteer_id_volunteers_id_fk] FOREIGN KEY ([volunteer_id]) REFERENCES [volunteers]([id]) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE [attendance_records] ADD CONSTRAINT [attendance_records_recorded_by_id_admins_id_fk] FOREIGN KEY ([recorded_by_id]) REFERENCES [admins]([id]) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE [attendance_sessions] ADD CONSTRAINT [attendance_sessions_academic_year_id_academic_years_id_fk] FOREIGN KEY ([academic_year_id]) REFERENCES [academic_years]([id]);--> statement-breakpoint
ALTER TABLE [attendance_sessions] ADD CONSTRAINT [attendance_sessions_event_id_events_id_fk] FOREIGN KEY ([event_id]) REFERENCES [events]([id]) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE [attendance_sessions] ADD CONSTRAINT [attendance_sessions_created_by_id_admins_id_fk] FOREIGN KEY ([created_by_id]) REFERENCES [admins]([id]) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE [core_team_assignments] ADD CONSTRAINT [core_team_assignments_academic_year_id_academic_years_id_fk] FOREIGN KEY ([academic_year_id]) REFERENCES [academic_years]([id]);--> statement-breakpoint
ALTER TABLE [core_team_assignments] ADD CONSTRAINT [core_team_assignments_core_team_role_id_core_team_roles_id_fk] FOREIGN KEY ([core_team_role_id]) REFERENCES [core_team_roles]([id]);--> statement-breakpoint
ALTER TABLE [core_team_assignments] ADD CONSTRAINT [core_team_assignments_volunteer_id_volunteers_id_fk] FOREIGN KEY ([volunteer_id]) REFERENCES [volunteers]([id]) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE [event_images] ADD CONSTRAINT [event_images_event_id_events_id_fk] FOREIGN KEY ([event_id]) REFERENCES [events]([id]);--> statement-breakpoint
ALTER TABLE [event_registrations] ADD CONSTRAINT [event_registrations_event_id_events_id_fk] FOREIGN KEY ([event_id]) REFERENCES [events]([id]);--> statement-breakpoint
ALTER TABLE [event_registrations] ADD CONSTRAINT [event_registrations_approved_by_id_admins_id_fk] FOREIGN KEY ([approved_by_id]) REFERENCES [admins]([id]);--> statement-breakpoint
ALTER TABLE [events] ADD CONSTRAINT [events_academic_year_id_academic_years_id_fk] FOREIGN KEY ([academic_year_id]) REFERENCES [academic_years]([id]);--> statement-breakpoint
ALTER TABLE [gallery] ADD CONSTRAINT [gallery_event_id_events_id_fk] FOREIGN KEY ([event_id]) REFERENCES [events]([id]);--> statement-breakpoint
ALTER TABLE [gallery] ADD CONSTRAINT [gallery_submitted_by_id_admins_id_fk] FOREIGN KEY ([submitted_by_id]) REFERENCES [admins]([id]);--> statement-breakpoint
ALTER TABLE [gallery] ADD CONSTRAINT [gallery_reviewed_by_id_admins_id_fk] FOREIGN KEY ([reviewed_by_id]) REFERENCES [admins]([id]);--> statement-breakpoint
ALTER TABLE [meeting_attendance] ADD CONSTRAINT [meeting_attendance_meeting_id_meetings_id_fk] FOREIGN KEY ([meeting_id]) REFERENCES [meetings]([id]) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE [meeting_attendance] ADD CONSTRAINT [meeting_attendance_volunteer_id_volunteers_id_fk] FOREIGN KEY ([volunteer_id]) REFERENCES [volunteers]([id]) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE [meeting_attendance] ADD CONSTRAINT [meeting_attendance_marked_by_id_admins_id_fk] FOREIGN KEY ([marked_by_id]) REFERENCES [admins]([id]);--> statement-breakpoint
ALTER TABLE [meetings] ADD CONSTRAINT [meetings_academic_year_id_academic_years_id_fk] FOREIGN KEY ([academic_year_id]) REFERENCES [academic_years]([id]);--> statement-breakpoint
ALTER TABLE [meetings] ADD CONSTRAINT [meetings_special_camp_id_special_camps_id_fk] FOREIGN KEY ([special_camp_id]) REFERENCES [special_camps]([id]) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE [meetings] ADD CONSTRAINT [meetings_created_by_id_admins_id_fk] FOREIGN KEY ([created_by_id]) REFERENCES [admins]([id]);--> statement-breakpoint
ALTER TABLE [notifications] ADD CONSTRAINT [notifications_volunteer_id_volunteers_id_fk] FOREIGN KEY ([volunteer_id]) REFERENCES [volunteers]([id]) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE [special_camp_participants] ADD CONSTRAINT [special_camp_participants_special_camp_id_special_camps_id_fk] FOREIGN KEY ([special_camp_id]) REFERENCES [special_camps]([id]) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE [special_camp_participants] ADD CONSTRAINT [special_camp_participants_volunteer_id_volunteers_id_fk] FOREIGN KEY ([volunteer_id]) REFERENCES [volunteers]([id]) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE [special_camps] ADD CONSTRAINT [special_camps_academic_year_id_academic_years_id_fk] FOREIGN KEY ([academic_year_id]) REFERENCES [academic_years]([id]);--> statement-breakpoint
ALTER TABLE [special_camps] ADD CONSTRAINT [special_camps_finalized_by_id_admins_id_fk] FOREIGN KEY ([finalized_by_id]) REFERENCES [admins]([id]);--> statement-breakpoint
ALTER TABLE [volunteer_profiles] ADD CONSTRAINT [volunteer_profiles_volunteer_id_volunteers_id_fk] FOREIGN KEY ([volunteer_id]) REFERENCES [volunteers]([id]) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE [volunteers] ADD CONSTRAINT [volunteers_academic_year_id_academic_years_id_fk] FOREIGN KEY ([academic_year_id]) REFERENCES [academic_years]([id]);--> statement-breakpoint
ALTER TABLE [volunteers] ADD CONSTRAINT [volunteers_created_by_id_admins_id_fk] FOREIGN KEY ([created_by_id]) REFERENCES [admins]([id]);