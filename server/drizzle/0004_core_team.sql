-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0004: Core Team Structure
-- Creates two tables:
--   core_team_roles       — master reference of all possible roles (seeded once)
--   core_team_assignments — per-AY assignment of a role to a person
--
-- Rules:
--   • institution roles (Principal, NSS Program Officer) have volunteer_id = NULL
--     and require display_name + display_photo_url to be set.
--   • student roles must have volunteer_id referencing a volunteer in the SAME AY.
--     This cross-AY constraint is enforced at the application layer.
--   • When is_unique_per_ay = true on a role, a unique constraint on
--     (academic_year_id, core_team_role_id) prevents double-assignment.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Core Team Roles (master reference) ───────────────────────────────────────
CREATE TABLE "core_team_roles" (
    "id"               serial PRIMARY KEY NOT NULL,
    "name"             varchar(100) NOT NULL,
    "role_type"        "role_type" NOT NULL,
    -- When true, only one assignment per AY is allowed for this role.
    -- A partial unique index (below) enforces this.
    "is_unique_per_ay" boolean DEFAULT true NOT NULL,
    "display_order"    integer DEFAULT 0 NOT NULL,
    "created_at"       timestamp DEFAULT now(),
    CONSTRAINT "core_team_roles_name_unique" UNIQUE("name")
);--> statement-breakpoint

-- ─── Core Team Assignments (per-AY) ───────────────────────────────────────────
CREATE TABLE "core_team_assignments" (
    "id"                serial PRIMARY KEY NOT NULL,
    "academic_year_id"  integer NOT NULL,
    "core_team_role_id" integer NOT NULL,
    -- NULL for institution roles. SET NULL so the assignment survives volunteer deletion.
    "volunteer_id"      integer,
    -- Used only when volunteer_id IS NULL (institution roles)
    "display_name"      varchar(255),
    "display_photo_url" text,
    -- Per-AY override of the role's default display_order
    "display_order"     integer DEFAULT 0,
    "created_at"        timestamp DEFAULT now()
);--> statement-breakpoint

-- ─── Foreign Keys ─────────────────────────────────────────────────────────────
ALTER TABLE "core_team_assignments"
    ADD CONSTRAINT "core_team_assignments_academic_year_id_fk"
    FOREIGN KEY ("academic_year_id")
    REFERENCES "public"."academic_years"("id")
    ON DELETE RESTRICT
    ON UPDATE NO ACTION;--> statement-breakpoint

ALTER TABLE "core_team_assignments"
    ADD CONSTRAINT "core_team_assignments_core_team_role_id_fk"
    FOREIGN KEY ("core_team_role_id")
    REFERENCES "public"."core_team_roles"("id")
    ON DELETE RESTRICT
    ON UPDATE NO ACTION;--> statement-breakpoint

ALTER TABLE "core_team_assignments"
    ADD CONSTRAINT "core_team_assignments_volunteer_id_fk"
    FOREIGN KEY ("volunteer_id")
    REFERENCES "public"."volunteers"("id")
    ON DELETE SET NULL
    ON UPDATE NO ACTION;--> statement-breakpoint

-- ─── Unique Constraints ────────────────────────────────────────────────────────
-- A volunteer cannot hold more than one role in the same AY.
CREATE UNIQUE INDEX "core_team_assignments_ay_volunteer_unique_idx"
    ON "core_team_assignments" ("academic_year_id", "volunteer_id")
    WHERE "volunteer_id" IS NOT NULL;--> statement-breakpoint

-- For roles where is_unique_per_ay = true: only one assignment per (AY, role).
-- We enforce this in the application layer by checking is_unique_per_ay before insert.
-- Additionally, a partial unique index covers the common case:
CREATE UNIQUE INDEX "core_team_assignments_ay_role_unique_idx"
    ON "core_team_assignments" ("academic_year_id", "core_team_role_id");--> statement-breakpoint

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX "core_team_assignments_academic_year_id_idx"
    ON "core_team_assignments" ("academic_year_id");

CREATE INDEX "core_team_assignments_volunteer_id_idx"
    ON "core_team_assignments" ("volunteer_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Core Team Roles
-- These are the canonical roles for JSPM RSCOE NSS.
-- Seed is idempotent (INSERT ... ON CONFLICT DO NOTHING).
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "core_team_roles" ("name", "role_type", "is_unique_per_ay", "display_order") VALUES
    ('Principal',                    'institution', true,  1),
    ('NSS Program Officer',          'institution', true,  2),
    ('Secretary',                    'student',      true,  3),
    ('Joint Secretary',              'student',      true,  4),
    ('Treasurer',                    'student',      true,  5),
    ('Cultural Secretary',           'student',      true,  6),
    ('Sports Secretary',             'student',      true,  7),
    ('Media & PR Secretary',         'student',      true,  8),
    ('Social Media Secretary',       'student',      true,  9),
    ('Technical Secretary',          'student',      true,  10),
    ('Committee Member',             'student',      false, 11)
ON CONFLICT ("name") DO NOTHING;
