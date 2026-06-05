DO $$ BEGIN
 CREATE TYPE "meeting_type" AS ENUM('regular', 'core_team');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "meeting_status" AS ENUM('scheduled', 'active', 'ended');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"meeting_type" "meeting_type" DEFAULT 'regular' NOT NULL,
	"status" "meeting_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"location" varchar(255) NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"duration_minutes" integer,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "meeting_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer NOT NULL,
	"volunteer_id" integer NOT NULL,
	"status" "attendance_status" NOT NULL,
	"volunteer_type" "volunteer_status" NOT NULL,
	"notes" text,
	"marked_at" timestamp DEFAULT now(),
	"marked_by_id" integer,
	CONSTRAINT "unq_meeting_volunteer" UNIQUE("meeting_id","volunteer_id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"volunteer_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"reference_type" varchar(50),
	"reference_id" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "portfolio_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id" integer NOT NULL,
	"portfolio" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"assigned_to_id" integer,
	"assigned_by_id" integer,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"due_date" date,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

ALTER TABLE "meetings" ADD CONSTRAINT "meetings_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_id_admins_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_marked_by_id_admins_id_fk" FOREIGN KEY ("marked_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "portfolio_tasks" ADD CONSTRAINT "portfolio_tasks_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "portfolio_tasks" ADD CONSTRAINT "portfolio_tasks_assigned_to_id_volunteers_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."volunteers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "portfolio_tasks" ADD CONSTRAINT "portfolio_tasks_assigned_by_id_volunteers_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."volunteers"("id") ON DELETE set null ON UPDATE no action;
