/**
 * Seed script: Core Team Roles (updated with `code` field)
 * Run with: npx tsx src/scripts/seedCoreTeamRoles.ts
 */
import 'dotenv/config';
import { db } from '../db';
import { coreTeamRoles } from '../db/schema';

const roles: (typeof coreTeamRoles.$inferInsert)[] = [
    { name: 'Principal',              code: 'principal',              roleType: 'institution', isUniquePerAy: true,  displayOrder: 1  },
    { name: 'NSS Program Officer',    code: 'nss_program_officer',    roleType: 'institution', isUniquePerAy: true,  displayOrder: 2  },
    { name: 'Secretary',              code: 'secretary',              roleType: 'student',     isUniquePerAy: true,  displayOrder: 3  },
    { name: 'Joint Secretary',        code: 'joint_secretary',        roleType: 'student',     isUniquePerAy: true,  displayOrder: 4  },
    { name: 'Treasurer',              code: 'treasurer',              roleType: 'student',     isUniquePerAy: true,  displayOrder: 5  },
    { name: 'Cultural Secretary',     code: 'cultural_secretary',     roleType: 'student',     isUniquePerAy: true,  displayOrder: 6  },
    { name: 'Sports Secretary',       code: 'sports_secretary',       roleType: 'student',     isUniquePerAy: true,  displayOrder: 7  },
    { name: 'Media & PR Secretary',   code: 'media_pr_secretary',     roleType: 'student',     isUniquePerAy: true,  displayOrder: 8  },
    { name: 'Social Media Secretary', code: 'social_media_secretary', roleType: 'student',     isUniquePerAy: true,  displayOrder: 9  },
    { name: 'Technical Secretary',    code: 'technical_secretary',    roleType: 'student',     isUniquePerAy: true,  displayOrder: 10 },
    { name: 'Committee Member',       code: 'committee_member',       roleType: 'student',     isUniquePerAy: false, displayOrder: 11 },
    { name: 'Boys Representative',    code: 'boys_representative',    roleType: 'student',     isUniquePerAy: true,  displayOrder: 12 },
    { name: 'Girls Representative',   code: 'girls_representative',   roleType: 'student',     isUniquePerAy: true,  displayOrder: 13 },
    { name: 'Department Coordinator', code: 'department_coordinator', roleType: 'student',     isUniquePerAy: false, displayOrder: 14 },
];

async function seed() {
    console.log('Seeding core_team_roles...');
    for (const role of roles) {
        await db.insert(coreTeamRoles).values(role).onConflictDoNothing({ target: coreTeamRoles.name });
        console.log(`  ✓ ${role.name} (${role.code})`);
    }
    console.log(`\nDone. ${roles.length} roles processed.`);
    process.exit(0);
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
