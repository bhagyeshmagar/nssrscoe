import { db, pool } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Truncating attendance_records...');
  await db.execute(sql`TRUNCATE TABLE attendance_records CASCADE;`);
  console.log('Done!');
  await pool.end();
}

main().catch(console.error);
