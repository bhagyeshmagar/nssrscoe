import { db } from '../db';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('Running manual migration...');
    try {
        await db.execute(sql`ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT false;`);
        console.log('Added is_superadmin to admins');
        
        // Make existing admins superadmins
        await db.execute(sql`UPDATE admins SET is_superadmin = true;`);
        console.log('Updated existing admins to superadmin');

        await db.execute(sql`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';`);
        console.log('Added description to gallery');

    } catch (e) {
        console.error('Error during migration:', e);
    }
    process.exit(0);
}

migrate();
