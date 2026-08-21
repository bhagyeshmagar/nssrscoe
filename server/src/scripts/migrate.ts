import { migrate } from 'drizzle-orm/node-mssql/migrator';
import { db } from '../db/index.js';

async function runMigrations() {
    try {
        console.log('Connecting to database...');
        console.log('Running migrations from ./drizzle...');
        await migrate(db, { migrationsFolder: './drizzle' });
        
        console.log('Migrations completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        // pool is managed internally
        process.exit(0);
    }
}

runMigrations();
