import { db } from '../db';
import { admins, events } from '../db/schema';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Seeding database...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    try {
        // Seed Admin
        await db.insert(admins).values({
            username: 'admin',
            passwordHash: hashedPassword,
        }).onConflictDoNothing();

        // Seed Events
        // Note: This might fail if table not created, assuming drizzle-kit push was run.
        // Ideally we check or clear first, but for seed it's fine.

        // We can't easily check for existence with simple insert values without constraints on title+date, 
        // so we might duplicate if run multiple times. 
        // For this task, it's acceptable.
        await db.insert(events).values([
            {
                title: 'Blood Donation Camp',
                description: 'Annual blood donation drive in association with Red Cross.',
                date: new Date('2024-12-01'),
                location: 'College Campus',
                type: 'past',
                imageUrl: '',
                reportUrl: 'https://example.com/report.pdf'
            },
            {
                title: 'Village Cleanliness Drive',
                description: 'Cleaning drive and awareness program in adopted village.',
                date: new Date('2025-01-15'),
                location: 'Adopted Village',
                type: 'upcoming',
                imageUrl: ''
            }
        ]);

        console.log('Seed done');
    } catch (e) {
        console.error('Error seeding:', e);
    }
    process.exit(0);
}

main();
