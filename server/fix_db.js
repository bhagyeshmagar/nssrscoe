const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to DB');

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "meetings" (
        "id" serial PRIMARY KEY NOT NULL,
        "academic_year_id" integer NOT NULL REFERENCES "academic_years"("id"),
        "title" varchar(255) NOT NULL,
        "description" text,
        "meeting_type" varchar(50) NOT NULL,
        "status" varchar(50) DEFAULT 'scheduled' NOT NULL,
        "scheduled_date" timestamp NOT NULL,
        "location" varchar(255) NOT NULL,
        "started_at" timestamp,
        "ended_at" timestamp,
        "duration_minutes" integer,
        "created_by_id" integer REFERENCES "admins"("id"),
        "created_at" timestamp DEFAULT now()
      );
    `);
    console.log('Created meetings table');
  } catch (e) {
    console.log('Error creating meetings:', e.message);
  }

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "meeting_attendance" (
        "id" serial PRIMARY KEY NOT NULL,
        "meeting_id" integer NOT NULL REFERENCES "meetings"("id") ON DELETE cascade,
        "volunteer_id" integer NOT NULL REFERENCES "volunteers"("id") ON DELETE cascade,
        "status" "attendance_status" NOT NULL,
        "volunteer_type" "volunteer_status" NOT NULL,
        "notes" text,
        "marked_by_id" integer REFERENCES "admins"("id"),
        "marked_at" timestamp DEFAULT now()
      );
    `);
    console.log('Created meeting_attendance table');
  } catch (e) {
    console.log('Error creating meeting_attendance:', e.message);
  }

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" serial PRIMARY KEY NOT NULL,
        "volunteer_id" integer NOT NULL REFERENCES "volunteers"("id") ON DELETE cascade,
        "type" varchar(50) NOT NULL,
        "title" varchar(255) NOT NULL,
        "body" text NOT NULL,
        "is_read" boolean DEFAULT false NOT NULL,
        "email_sent" boolean DEFAULT false NOT NULL,
        "reference_type" varchar(50),
        "reference_id" integer,
        "created_at" timestamp DEFAULT now()
      );
    `);
    console.log('Created notifications table');
  } catch (e) {
    console.log('Error creating notifications:', e.message);
  }

  await client.end();
  console.log('Done');
}

main().catch(console.error);
