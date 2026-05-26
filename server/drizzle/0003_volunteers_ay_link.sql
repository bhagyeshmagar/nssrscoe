-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0003: Link Volunteers to Academic Years
-- 1. Adds `department` (canonical enum) to volunteers — required at creation.
-- 2. Adds `academic_year_id` FK to volunteers.
-- 3. Renames volunteer_profiles.academic_year → college_year_at_enrollment
--    to make explicit that it stores the student's college year (FE/SE/TE/BE),
--    not the NSS program year.
--
-- Migration strategy for existing data:
--   Step A — add column as nullable (so existing rows don't break)
--   Step B — create a default "legacy" academic year, assign all existing volunteers to it
--   Step C — add NOT NULL constraint
--   (Steps B and C are in a separate backfill script, not here)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Step A: Add `academic_year_id` to volunteers (nullable initially) ───────
ALTER TABLE "volunteers"
    ADD COLUMN "academic_year_id" integer;--> statement-breakpoint

-- ─── Step B: Add `department` enum column to volunteers ───────────────────────
-- Added as nullable to allow backfill of existing rows without breaking them.
ALTER TABLE "volunteers"
    ADD COLUMN "department" "department";--> statement-breakpoint

-- ─── Step C: FK constraint for academic_year_id ──────────────────────────────
ALTER TABLE "volunteers"
    ADD CONSTRAINT "volunteers_academic_year_id_academic_years_id_fk"
    FOREIGN KEY ("academic_year_id")
    REFERENCES "public"."academic_years"("id")
    ON DELETE RESTRICT
    ON UPDATE NO ACTION;--> statement-breakpoint

-- ─── Step D: Rename academic_year → college_year_at_enrollment ───────────────
-- This column stores "FE", "SE", "TE", or "BE" — the student's college year
-- at the time they enrolled in NSS. It is NOT the NSS program year.
ALTER TABLE "volunteer_profiles"
    RENAME COLUMN "academic_year" TO "college_year_at_enrollment";--> statement-breakpoint

-- ─── Indexes ──────────────────────────────────────────────────────────────────
-- Query volunteers by AY (most common admin query)
CREATE INDEX "volunteers_academic_year_id_idx"
    ON "volunteers" ("academic_year_id");

-- Query volunteers by AY + department (for the departmental breakdown view)
CREATE INDEX "volunteers_ay_department_idx"
    ON "volunteers" ("academic_year_id", "department");

-- Query active volunteers within an AY
CREATE INDEX "volunteers_ay_is_active_idx"
    ON "volunteers" ("academic_year_id", "is_active");
