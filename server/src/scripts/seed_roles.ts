import { db } from '../db';
import { coreTeamRoles, coreTeamAssignments } from '../db/schema';
import { sql } from 'drizzle-orm';

const SEED_ROLES = [
    { name: 'Principal', roleType: 'institution' as const, displayOrder: 1 },
    { name: 'NSS Program Officer', roleType: 'institution' as const, displayOrder: 2 },
    { name: 'Boys Representative', roleType: 'student' as const, displayOrder: 3 },
    { name: 'Girls Representative', roleType: 'student' as const, displayOrder: 4 },
    { name: 'Department Coordinator - Computer Engineering', roleType: 'student' as const, displayOrder: 5 },
    { name: 'Department Coordinator - Computer Science and Business Systems', roleType: 'student' as const, displayOrder: 5 },
    { name: 'Department Coordinator - Information Technology', roleType: 'student' as const, displayOrder: 5 },
    { name: 'Department Coordinator - Electronics and Telecommunication', roleType: 'student' as const, displayOrder: 5 },
    { name: 'Department Coordinator - Electrical Engineering', roleType: 'student' as const, displayOrder: 5 },
    { name: 'Department Coordinator - Automation and Robotics', roleType: 'student' as const, displayOrder: 5 },
    { name: 'Department Coordinator - Mechanical Engineering', roleType: 'student' as const, displayOrder: 5 },
    { name: 'Department Coordinator - Civil Engineering', roleType: 'student' as const, displayOrder: 5 },
    { name: 'Department Coordinator - Bachelor of Computer Applications', roleType: 'student' as const, displayOrder: 5 },
    { name: 'Portfolio Lead - Event management', roleType: 'student' as const, displayOrder: 6 },
    { name: 'Portfolio Lead - PR', roleType: 'student' as const, displayOrder: 6 },
    { name: 'Portfolio Lead - Social Media', roleType: 'student' as const, displayOrder: 6 },
    { name: 'Portfolio Lead - Graphic design', roleType: 'student' as const, displayOrder: 6 },
    { name: 'Portfolio Lead - Documentation', roleType: 'student' as const, displayOrder: 6 },
    { name: 'Portfolio Lead - Hospitality', roleType: 'student' as const, displayOrder: 6 },
    { name: 'Portfolio Lead - Cultural', roleType: 'student' as const, displayOrder: 6 },
    { name: 'Portfolio Lead - Technical', roleType: 'student' as const, displayOrder: 6 },
    { name: 'Portfolio Lead - Website', roleType: 'student' as const, displayOrder: 6 }
];

async function seedRoles() {
    console.log('Seeding core team roles...');
    try {
        // First truncate assignments since it has a foreign key to roles
        await db.execute(sql`TRUNCATE TABLE core_team_assignments CASCADE`);
        await db.execute(sql`TRUNCATE TABLE core_team_roles CASCADE`);
        console.log('Truncated core_team_assignments and core_team_roles');

        for (const role of SEED_ROLES) {
            const code = role.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 50);
            await db.insert(coreTeamRoles).values({
                name: role.name,
                code: code,
                roleType: role.roleType,
                displayOrder: role.displayOrder,
                isUniquePerAy: role.displayOrder < 5, // Only Principal/PO/Reps are unique per AY
            });
        }
        
        console.log('Successfully seeded exact core team roles.');
    } catch (e) {
        console.error('Error seeding roles:', e);
    }
    process.exit(0);
}

seedRoles();
