import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './src/db/schema';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool, { schema });
  
  const profiles = await db.select().from(schema.volunteerProfiles);
  fs.writeFileSync('check_db_utf8.json', JSON.stringify(profiles, null, 2));
  
  pool.end();
}

run().catch(console.error);
