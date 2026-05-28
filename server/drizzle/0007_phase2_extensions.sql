-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0007: Phase 2 Schema Extensions
-- Adds: volunteer_status enum, attendance_status enum, volunteers.status,
--       academic_years.is_archived, core_team_roles.code,
--       core_team_assignments.department, attendance tables, audit_logs,
--       drops the over-restrictive core_team unique index,
--       inserts missing role definitions, updates role codes.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── New enums ────────────────────────────────────────────────────────────────
CREATE TYPE "public"."volunteer_status" AS ENUM('regular', 'backup');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late');--> statement-breakpoint

-- ── volunteer_status column on volunteers ────────────────────────────────────
ALTER TABLE "volunteers"
    ADD COLUMN "status" "volunteer_status" DEFAULT 'regular' NOT NULL;--> statement-breakpoint

-- Index for fast cap counting: count regular volunteers per AY
CREATE INDEX "volunteers_ay_status_idx"
    ON "volunteers" ("academic_year_id", "status");--> statement-breakpoint

-- ── is_archived on academic_years ────────────────────────────────────────────
ALTER TABLE "academic_years"
    ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint

CREATE INDEX "academic_years_is_archived_idx"
    ON "academic_years" ("is_archived");--> statement-breakpoint

-- ── code column on core_team_roles ────────────────────────────────────────────
ALTER TABLE "core_team_roles"
    ADD COLUMN "code" varchar(50);--> statement-breakpoint

-- Back-fill codes for existing roles
UPDATE "core_team_roles" SET "code" = CASE "name"
    WHEN 'Principal'              THEN 'principal'
    WHEN 'NSS Program Officer'    THEN 'nss_program_officer'
    WHEN 'Secretary'              THEN 'secretary'
    WHEN 'Joint Secretary'        THEN 'joint_secretary'
    WHEN 'Treasurer'              THEN 'treasurer'
    WHEN 'Cultural Secretary'     THEN 'cultural_secretary'
    WHEN 'Sports Secretary'       THEN 'sports_secretary'
    WHEN 'Media & PR Secretary'   THEN 'media_pr_secretary'
    WHEN 'Social Media Secretary' THEN 'social_media_secretary'
    WHEN 'Technical Secretary'    THEN 'technical_secretary'
    WHEN 'Committee Member'       THEN 'committee_member'
    ELSE lower(replace("name", ' ', '_'))
END;--> statement-breakpoint

ALTER TABLE "core_team_roles"
    ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX "core_team_roles_code_unique_idx"
    ON "core_team_roles" ("code");--> statement-breakpoint

-- ── Insert missing role definitions ────────────────────────────────────────────
INSERT INTO "core_team_roles" ("name", "code", "role_type", "is_unique_per_ay", "display_order")
VALUES
    ('Boys Representative',   'boys_representative',   'student', true,  12),
    ('Girls Representative',  'girls_representative',  'student', true,  13),
    ('Department Coordinator','department_coordinator','student', false, 14)
ON CONFLICT ("name") DO UPDATE
    SET "code" = EXCLUDED."code",
        "display_order" = EXCLUDED."display_order";--> statement-breakpoint

-- ── department column on core_team_assignments (for dept coordinators) ─────────
ALTER TABLE "core_team_assignments"
    ADD COLUMN "department" varchar(100);--> statement-breakpoint

-- ── Drop the over-restrictive unique index from migration 0004 ─────────────────
-- The old index prevented multiple dept coordinators per AY.
-- Uniqueness is now enforced at the application layer, with the targeted
-- partial indexes below.
DROP INDEX IF EXISTS "core_team_assignments_ay_role_unique_idx";--> statement-breakpoint

-- For roles that are unique per AY (is_unique_per_ay=true, excluding dept_coordinator):
-- Enforced via application-layer check + the volunteer uniqueness index below.

-- One volunteer can only hold one role per AY (prevents double assignments)
-- (This index already exists from migration 0004 — kept unchanged)

-- For dept_coordinator: unique (ay_id, role_id, department)
CREATE UNIQUE INDEX "core_team_assignments_ay_dept_coordinator_unique_idx"
    ON "core_team_assignments" ("academic_year_id", "core_team_role_id", "department")
    WHERE "department" IS NOT NULL;--> statement-breakpoint

-- ── attendance_sessions ────────────────────────────────────────────────────────
CREATE TABLE "attendance_sessions" (
    "id"               serial PRIMARY KEY NOT NULL,
    "academic_year_id" integer NOT NULL,
    "event_id"         integer,
    "title"            varchar(255) NOT NULL,
    "date"             date NOT NULL,
    "description"      text,
    "created_by_id"    integer,
    "created_at"       timestamp DEFAULT now()
);--> statement-breakpoint

ALTER TABLE "attendance_sessions"
    ADD CONSTRAINT "attendance_sessions_academic_year_id_fk"
    FOREIGN KEY ("academic_year_id")
    REFERENCES "public"."academic_years"("id")
    ON DELETE RESTRICT;--> statement-breakpoint

ALTER TABLE "attendance_sessions"
    ADD CONSTRAINT "attendance_sessions_event_id_fk"
    FOREIGN KEY ("event_id")
    REFERENCES "public"."events"("id")
    ON DELETE SET NULL;--> statement-breakpoint

ALTER TABLE "attendance_sessions"
    ADD CONSTRAINT "attendance_sessions_created_by_id_fk"
    FOREIGN KEY ("created_by_id")
    REFERENCES "public"."admins"("id")
    ON DELETE SET NULL;--> statement-breakpoint

CREATE INDEX "attendance_sessions_ay_idx"   ON "attendance_sessions" ("academic_year_id");
CREATE INDEX "attendance_sessions_date_idx" ON "attendance_sessions" ("date");--> statement-breakpoint

-- ── attendance_records ────────────────────────────────────────────────────────
CREATE TABLE "attendance_records" (
    "id"               serial PRIMARY KEY NOT NULL,
    "session_id"       integer NOT NULL,
    "volunteer_id"     integer NOT NULL,
    "status"           "attendance_status" NOT NULL,
    "notes"            text,
    "recorded_by_id"   integer,
    "created_at"       timestamp DEFAULT now(),
    CONSTRAINT "attendance_records_session_volunteer_unique"
        UNIQUE ("session_id", "volunteer_id")
);--> statement-breakpoint

ALTER TABLE "attendance_records"
    ADD CONSTRAINT "attendance_records_session_id_fk"
    FOREIGN KEY ("session_id")
    REFERENCES "public"."attendance_sessions"("id")
    ON DELETE CASCADE;--> statement-breakpoint

ALTER TABLE "attendance_records"
    ADD CONSTRAINT "attendance_records_volunteer_id_fk"
    FOREIGN KEY ("volunteer_id")
    REFERENCES "public"."volunteers"("id")
    ON DELETE CASCADE;--> statement-breakpoint

ALTER TABLE "attendance_records"
    ADD CONSTRAINT "attendance_records_recorded_by_id_fk"
    FOREIGN KEY ("recorded_by_id")
    REFERENCES "public"."admins"("id")
    ON DELETE SET NULL;--> statement-breakpoint

CREATE INDEX "attendance_records_session_idx"   ON "attendance_records" ("session_id");
CREATE INDEX "attendance_records_volunteer_idx" ON "attendance_records" ("volunteer_id");--> statement-breakpoint

-- ── audit_logs ────────────────────────────────────────────────────────────────
CREATE TABLE "audit_logs" (
    "id"                serial PRIMARY KEY NOT NULL,
    -- e.g. 'volunteer.create', 'academic_year.lock', 'special_camp.finalize'
    "action"            varchar(100) NOT NULL,
    -- e.g. 'volunteer', 'academic_year', 'special_camp'
    "entity_type"       varchar(50) NOT NULL,
    "entity_id"         integer,
    "performed_by_id"   integer,
    "performed_by_role" varchar(20) NOT NULL DEFAULT 'admin',
    "academic_year_id"  integer,
    -- JSON snapshot of relevant fields (before/after if applicable)
    "details"           text,
    "created_at"        timestamp DEFAULT now()
);--> statement-breakpoint

CREATE INDEX "audit_logs_entity_idx"   ON "audit_logs" ("entity_type", "entity_id");
CREATE INDEX "audit_logs_ay_idx"       ON "audit_logs" ("academic_year_id");
CREATE INDEX "audit_logs_created_idx"  ON "audit_logs" ("created_at");
