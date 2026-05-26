-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0006: Link Events to Academic Years (optional)
--
-- Adds academic_year_id as a nullable FK on events.
-- Events are content management artifacts and remain editable even when an AY
-- is locked — only volunteer/core team/camp data is frozen.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "events"
    ADD COLUMN "academic_year_id" integer;--> statement-breakpoint

ALTER TABLE "events"
    ADD CONSTRAINT "events_academic_year_id_academic_years_id_fk"
    FOREIGN KEY ("academic_year_id")
    REFERENCES "public"."academic_years"("id")
    ON DELETE SET NULL
    ON UPDATE NO ACTION;--> statement-breakpoint

CREATE INDEX "events_academic_year_id_idx"
    ON "events" ("academic_year_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0007: NOT NULL backfill for volunteers.academic_year_id
--
-- Run AFTER creating a default AY and assigning existing volunteers to it.
-- This is a separate step so the application can execute the backfill between
-- migrations 0003 and this one without downtime.
--
-- Backfill procedure (run in application or psql before executing this file):
--
--   1. INSERT INTO academic_years (label, start_date, end_date, is_current)
--      VALUES ('2023-24', '2023-06-01', '2024-05-31', false)
--      RETURNING id;   -- capture this as <legacy_ay_id>
--
--   2. UPDATE volunteers
--      SET academic_year_id = <legacy_ay_id>
--      WHERE academic_year_id IS NULL;
--
--   3. UPDATE volunteers
--      SET department = 'Computer Engineering'   -- or parse from profile if possible
--      WHERE department IS NULL;
--
-- After backfill, run the following two statements to enforce NOT NULL:
-- ─────────────────────────────────────────────────────────────────────────────

-- Uncomment and run ONLY after backfill is complete:
-- ALTER TABLE "volunteers" ALTER COLUMN "academic_year_id" SET NOT NULL;
-- ALTER TABLE "volunteers" ALTER COLUMN "department" SET NOT NULL;
