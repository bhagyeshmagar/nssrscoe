-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0005: Special Camps & Snapshot Participants
--
-- special_camps            — one record per camp, linked to an AY
-- special_camp_participants — the snapshot table:
--     • While is_finalized = false on the parent camp: participants may be
--       freely added or removed. snap_* columns may be NULL.
--     • When admin finalizes the camp: snap_* columns are written from the
--       volunteer's live profile at that exact moment, is_finalized is set to
--       true, and finalized_at / finalized_by_id are recorded.
--     • After finalization: no inserts, updates, or deletes on participants
--       are permitted (enforced at application layer). The snap_* columns
--       are the permanent, auditable record of participation.
--     • volunteer_id is SET NULL on delete so the historical snapshot survives
--       even if the volunteer account is removed.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "special_camps" (
    "id"                serial PRIMARY KEY NOT NULL,
    "academic_year_id"  integer NOT NULL,
    "name"              varchar(255) NOT NULL,
    "location"          varchar(255) NOT NULL,
    "start_date"        date NOT NULL,
    "end_date"          date NOT NULL,
    "description"       text,
    "is_finalized"      boolean DEFAULT false NOT NULL,
    "finalized_at"      timestamp,
    "finalized_by_id"   integer,
    "created_at"        timestamp DEFAULT now()
);--> statement-breakpoint

CREATE TABLE "special_camp_participants" (
    "id"                                serial PRIMARY KEY NOT NULL,
    "special_camp_id"                   integer NOT NULL,
    -- Nullable: SET NULL when volunteer is deleted; snapshot data is preserved.
    "volunteer_id"                      integer,
    -- ── Snapshot columns ─────────────────────────────────────────────────────
    -- Populated from the volunteer's live profile at camp finalization time.
    -- Never updated after is_finalized = true on the parent camp.
    "snap_name"                         varchar(255) NOT NULL,
    "snap_prn_no"                       varchar(50),
    "snap_department"                   varchar(100),
    "snap_college_year_at_enrollment"   varchar(20),
    "snap_nss_year"                     integer,
    "snap_cgpa"                         varchar(10),
    "snap_phone_no"                     varchar(20),
    -- When the snapshot was captured (equals the camp's finalized_at timestamp)
    "snap_finalized_at"                 timestamp,
    "added_at"                          timestamp DEFAULT now()
);--> statement-breakpoint

-- ─── Foreign Keys ─────────────────────────────────────────────────────────────
ALTER TABLE "special_camps"
    ADD CONSTRAINT "special_camps_academic_year_id_fk"
    FOREIGN KEY ("academic_year_id")
    REFERENCES "public"."academic_years"("id")
    ON DELETE RESTRICT
    ON UPDATE NO ACTION;--> statement-breakpoint

ALTER TABLE "special_camps"
    ADD CONSTRAINT "special_camps_finalized_by_id_fk"
    FOREIGN KEY ("finalized_by_id")
    REFERENCES "public"."admins"("id")
    ON DELETE SET NULL
    ON UPDATE NO ACTION;--> statement-breakpoint

ALTER TABLE "special_camp_participants"
    ADD CONSTRAINT "special_camp_participants_special_camp_id_fk"
    FOREIGN KEY ("special_camp_id")
    REFERENCES "public"."special_camps"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION;--> statement-breakpoint

ALTER TABLE "special_camp_participants"
    ADD CONSTRAINT "special_camp_participants_volunteer_id_fk"
    FOREIGN KEY ("volunteer_id")
    REFERENCES "public"."volunteers"("id")
    ON DELETE SET NULL
    ON UPDATE NO ACTION;--> statement-breakpoint

-- ─── Unique Constraints ────────────────────────────────────────────────────────
-- A volunteer can only appear once per camp.
CREATE UNIQUE INDEX "special_camp_participants_camp_volunteer_unique_idx"
    ON "special_camp_participants" ("special_camp_id", "volunteer_id")
    WHERE "volunteer_id" IS NOT NULL;--> statement-breakpoint

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX "special_camps_academic_year_id_idx"
    ON "special_camps" ("academic_year_id");

CREATE INDEX "special_camps_is_finalized_idx"
    ON "special_camps" ("is_finalized");

CREATE INDEX "special_camp_participants_special_camp_id_idx"
    ON "special_camp_participants" ("special_camp_id");

CREATE INDEX "special_camp_participants_volunteer_id_idx"
    ON "special_camp_participants" ("volunteer_id");
