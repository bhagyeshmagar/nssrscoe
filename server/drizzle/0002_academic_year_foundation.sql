-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0002: Academic Year Foundation
-- Adds the `department` enum, `role_type` enum, and `academic_years` table.
-- The `academic_years` table is the top-level aggregate for the NSS platform.
-- ─────────────────────────────────────────────────────────────────────────────

-- Canonical department enum
-- All volunteer records must use one of these values.
CREATE TYPE "public"."department" AS ENUM(
    'Computer Engineering',
    'Information Technology',
    'Electronics & Telecommunication Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Artificial Intelligence & Data Science'
);--> statement-breakpoint

-- Role type enum
-- 'institution' = Principal, NSS PO (manually entered, not in volunteers table)
-- 'student'     = Secretary, Joint Secretary, etc. (must reference a volunteer)
CREATE TYPE "public"."role_type" AS ENUM('institution', 'student');--> statement-breakpoint

-- Academic Years table
CREATE TABLE "academic_years" (
    "id"            serial PRIMARY KEY NOT NULL,
    "label"         varchar(20) NOT NULL,
    "start_date"    date NOT NULL,
    "end_date"      date NOT NULL,
    -- Only one row may have is_current = true at any time.
    -- Enforced below by a partial unique index.
    "is_current"    boolean DEFAULT false NOT NULL,
    -- When locked, all writes scoped to this AY are rejected (HTTP 403).
    -- Reads always succeed. Cannot be unlocked once set.
    "is_locked"     boolean DEFAULT false NOT NULL,
    -- Maximum regular volunteers allowed for this AY. Default 100.
    "volunteer_cap" integer DEFAULT 100 NOT NULL,
    "locked_at"     timestamp,
    "locked_by_id"  integer,
    "created_at"    timestamp DEFAULT now(),
    CONSTRAINT "academic_years_label_unique" UNIQUE("label")
);--> statement-breakpoint

-- FK: locked_by_id → admins.id
ALTER TABLE "academic_years"
    ADD CONSTRAINT "academic_years_locked_by_id_admins_id_fk"
    FOREIGN KEY ("locked_by_id")
    REFERENCES "public"."admins"("id")
    ON DELETE SET NULL
    ON UPDATE NO ACTION;--> statement-breakpoint

-- ─── Constraint: only one "current" AY at a time ────────────────────────────
-- A partial unique index is the cleanest PostgreSQL way to allow multiple
-- FALSE rows but at most one TRUE row in the same column.
CREATE UNIQUE INDEX "academic_years_single_current_idx"
    ON "academic_years" ("is_current")
    WHERE "is_current" = true;--> statement-breakpoint

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX "academic_years_is_current_idx" ON "academic_years" ("is_current");
CREATE INDEX "academic_years_is_locked_idx"  ON "academic_years" ("is_locked");
