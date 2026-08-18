import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('Running gallery migration...');
    try {
        await db.execute(sql`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' NOT NULL;`);
        await db.execute(sql`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS submitted_by_id integer REFERENCES admins(id);`);
        await db.execute(sql`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS reviewed_by_id integer REFERENCES admins(id);`);
        await db.execute(sql`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS rejection_reason text;`);

        // Any existing item before the approval system was added won't have a submitted_by_id
        await db.execute(sql`UPDATE gallery SET status = 'approved' WHERE submitted_by_id IS NULL AND status = 'pending';`);
        console.log('Gallery migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed', err);
        process.exit(1);
    }
}

main();
