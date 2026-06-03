import { db } from '../db';
import { admins } from '../db/schema';
import bcrypt from 'bcryptjs';

async function setupAdmins() {
    console.log('Setting up Admin accounts...');

    const adminAccounts = [
        { username: 'superadmin', name: 'Bhagyesh Magar', password: 'superadmin123' },
        { username: 'nsspo', name: 'NSS PO', password: 'nsspo123' },
        { username: 'website', name: 'Website Team Leads', password: 'website123' }
    ];

    try {
        for (const account of adminAccounts) {
            const hashedPassword = await bcrypt.hash(account.password, 10);
            const isSuperadmin = account.username === 'superadmin';
            await db.insert(admins).values({
                username: account.username,
                passwordHash: hashedPassword,
                isSuperadmin: isSuperadmin
            }).onConflictDoNothing();
            console.log(`Created/Ensured admin account: ${account.username} (Password: ${account.password})`);
        }
        console.log('Admin accounts setup complete.');
    } catch (e) {
        console.error('Error setting up admins:', e);
    }
    process.exit(0);
}

setupAdmins();
