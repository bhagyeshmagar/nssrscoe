-- Migration: Sync schema drift between Drizzle schema.ts and actual DB
-- Adds missing columns that were in the DB but not tracked in migrations

-- portfolio_tasks: add updated_at (already added via ALTER TABLE manually)
ALTER TABLE "portfolio_tasks" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();

-- notifications: email_sent already exists from migration 0009, ensure it's there
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "email_sent" boolean DEFAULT false NOT NULL;
