CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late');--> statement-breakpoint
CREATE TYPE "public"."department" AS ENUM('Computer Engineering', 'Computer Science and Business Systems', 'Information Technology', 'Electronics and Telecommunication', 'Electrical Engineering', 'Automation and Robotics', 'Mechanical Engineering', 'Civil Engineering', 'Bachelor of Computer Applications');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."role_type" AS ENUM('institution', 'student');--> statement-breakpoint
CREATE TYPE "public"."volunteer_status" AS ENUM('regular', 'backup');--> statement-breakpoint
CREATE TABLE "academic_years" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(20) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"volunteer_cap" integer DEFAULT 100 NOT NULL,
	"locked_at" timestamp,
	"locked_by_id" integer,
	"regular_activity_report_url" varchar(1024),
	"special_camp_report_url" varchar(1024),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "academic_years_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE "activity_calendar" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id" integer NOT NULL,
	"month" varchar(50) NOT NULL,
	"tentative_date" varchar(255) NOT NULL,
	"activity" varchar(500) NOT NULL,
	"type" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"volunteer_id" integer NOT NULL,
	"status" "attendance_status" NOT NULL,
	"notes" text,
	"recorded_by_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unq_session_volunteer" UNIQUE("session_id","volunteer_id")
);
--> statement-breakpoint
CREATE TABLE "attendance_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id" integer NOT NULL,
	"event_id" integer,
	"title" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"description" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer,
	"performed_by_id" integer,
	"performed_by_role" varchar(20) DEFAULT 'admin' NOT NULL,
	"academic_year_id" integer,
	"details" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "core_team_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id" integer NOT NULL,
	"core_team_role_id" integer NOT NULL,
	"volunteer_id" integer,
	"display_name" varchar(255),
	"display_photo_url" text,
	"department" varchar(100),
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "core_team_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"role_type" "role_type" NOT NULL,
	"is_unique_per_ay" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"category" varchar(100),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "core_team_roles_name_unique" UNIQUE("name"),
	CONSTRAINT "core_team_roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "meeting_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer NOT NULL,
	"volunteer_id" integer NOT NULL,
	"status" "attendance_status" NOT NULL,
	"volunteer_type" "volunteer_status" NOT NULL,
	"notes" text,
	"marked_by_id" integer,
	"marked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"meeting_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"location" varchar(255) NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"duration_minutes" integer,
	"special_camp_id" integer,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"volunteer_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"reference_type" varchar(50),
	"reference_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "special_camp_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"special_camp_id" integer NOT NULL,
	"volunteer_id" integer,
	"snap_name" varchar(255) NOT NULL,
	"snap_prn_no" varchar(50),
	"snap_department" varchar(100),
	"snap_college_year_at_enrollment" varchar(20),
	"snap_nss_year" integer,
	"snap_cgpa" varchar(10),
	"snap_phone_no" varchar(20),
	"snap_finalized_at" timestamp,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "special_camps" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"description" text,
	"volunteer_cap" integer DEFAULT 50 NOT NULL,
	"is_finalized" boolean DEFAULT false NOT NULL,
	"finalized_at" timestamp,
	"finalized_by_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "core_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "core_members" CASCADE;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "is_superadmin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "visitor_pass_id" varchar(50);--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "status" "registration_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "approved_by_id" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "drive_link" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "academic_year_id" integer;--> statement-breakpoint
ALTER TABLE "gallery" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "gallery" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "gallery" ADD COLUMN "submitted_by_id" integer;--> statement-breakpoint
ALTER TABLE "gallery" ADD COLUMN "reviewed_by_id" integer;--> statement-breakpoint
ALTER TABLE "gallery" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD COLUMN "college_year_at_enrollment" varchar(20);--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD COLUMN "profile_photo_url" text;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD COLUMN "experience_text" text;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD COLUMN "portfolio_choices" text;--> statement-breakpoint
ALTER TABLE "volunteers" ADD COLUMN "academic_year_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "volunteers" ADD COLUMN "department" "department" NOT NULL;--> statement-breakpoint
ALTER TABLE "volunteers" ADD COLUMN "status" "volunteer_status" DEFAULT 'regular' NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_locked_by_id_admins_id_fk" FOREIGN KEY ("locked_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_calendar" ADD CONSTRAINT "activity_calendar_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_attendance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_recorded_by_id_admins_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_created_by_id_admins_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_team_assignments" ADD CONSTRAINT "core_team_assignments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_team_assignments" ADD CONSTRAINT "core_team_assignments_core_team_role_id_core_team_roles_id_fk" FOREIGN KEY ("core_team_role_id") REFERENCES "public"."core_team_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_team_assignments" ADD CONSTRAINT "core_team_assignments_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_marked_by_id_admins_id_fk" FOREIGN KEY ("marked_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_special_camp_id_special_camps_id_fk" FOREIGN KEY ("special_camp_id") REFERENCES "public"."special_camps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_id_admins_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_camp_participants" ADD CONSTRAINT "special_camp_participants_special_camp_id_special_camps_id_fk" FOREIGN KEY ("special_camp_id") REFERENCES "public"."special_camps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_camp_participants" ADD CONSTRAINT "special_camp_participants_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_camps" ADD CONSTRAINT "special_camps_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_camps" ADD CONSTRAINT "special_camps_finalized_by_id_admins_id_fk" FOREIGN KEY ("finalized_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_approved_by_id_admins_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_submitted_by_id_admins_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_reviewed_by_id_admins_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" DROP COLUMN "academic_year";--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_visitor_pass_id_unique" UNIQUE("visitor_pass_id");