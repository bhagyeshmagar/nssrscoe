import { updateMyProfile } from './src/controllers/volunteerController';
import * as schema from './src/db/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const req = {
    user: { id: 1 },
    body: {
        fullName: 'Test User 2',
        experienceText: 'Hello from tester backend mock',
        profilePhotoUrl: 'tester.jpg'
    }
  } as any;

  const res = {
    json: (data: any) => console.log('Response JSON:', data),
    status: (code: number) => ({ json: (data: any) => console.log('Response Status:', code, data) })
  } as any;

  console.log('--- Calling updateMyProfile ---');
  await updateMyProfile(req, res);

  console.log('--- Checking DB directly ---');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const profiles = await db.select().from(schema.volunteerProfiles);
  console.log('DB AFTER:', JSON.stringify(profiles, null, 2));
  
  await pool.end();
}

run().catch(console.error);
