/**
 * Seed script: Core Team Roles
 *
 * Populates the `core_team_roles` table with the canonical NSS JSPM RSCOE
 * roles. Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING.
 *
 * Run with:
 *   npx tsx src/scripts/seedCoreTeamRoles.ts
 */
import 'dotenv/config';
import { db } from '../db';
import { coreTeamRoles } from '../db/schema';

const roles: (typeof coreTeamRoles.$inferInsert)[] = [
    // Institution-level roles (volunteer_id = NULL in assignments, manually entered)
    { name: 'Principal',              roleType: 'institution', isUniquePerAy: true,  displayOrder: 1 },
    { name: 'NSS Program Officer',    roleType: 'institution', isUniquePerAy: true,  displayOrder: 2 },
    // Student roles (must reference a volunteer from the same AY)
    { name: 'Secretary',              roleType: 'student',     isUniquePerAy: true,  displayOrder: 3 },
    { name: 'Joint Secretary',        roleType: 'student',     isUniquePerAy: true,  displayOrder: 4 },
    { name: 'Treasurer',              roleType: 'student',     isUniquePerAy: true,  displayOrder: 5 },
    { name: 'Cultural Secretary',     roleType: 'student',     isUniquePerAy: true,  displayOrder: 6 },
    { name: 'Sports Secretary',       roleType: 'student',     isUniquePerAy: true,  displayOrder: 7 },
    { name: 'Media & PR Secretary',   roleType: 'student',     isUniquePerAy: true,  displayOrder: 8 },
    { name: 'Social Media Secretary', roleType: 'student',     isUniquePerAy: true,  displayOrder: 9 },
    { name: 'Technical Secretary',    roleType: 'student',     isUniquePerAy: true,  displayOrder: 10 },
    { name: 'Committee Member',       roleType: 'student',     isUniquePerAy: false, displayOrder: 11 },
];

async function seed() {
    console.log('Seeding core_team_roles...');

    for (const role of roles) {
        await db
            .insert(coreTeamRoles)
            .values(role)
            .onConflictDoNothing({ target: coreTeamRoles.name });
        console.log(`  ✓ ${role.name} (${role.roleType})`);
    }

    console.log(`\nDone. ${roles.length} roles processed.`);
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
