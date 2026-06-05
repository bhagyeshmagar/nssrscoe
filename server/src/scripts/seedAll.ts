/**
 * Comprehensive Seed Script
 * Seeds: superadmin, site settings, core team roles
 * Run with: npx tsx src/scripts/seedAll.ts
 */
import 'dotenv/config';
import { db } from '../db';
import { admins, siteSettings, coreTeamRoles } from '../db/schema';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('🌱 Starting comprehensive seed...\n');

    // ── 1. Admins ──────────────────────────────────────────────────────────────
    console.log('── Seeding admins...');
    const adminEntries = [
        { username: 'admin@email.com',   password: 'admin123',     isSuperadmin: true  },
        { username: 'superadmin',        password: 'superadmin123', isSuperadmin: true  },
        { username: 'nsspo@email.com',   password: 'nsspo123',     isSuperadmin: false },
        { username: 'website@email.com', password: 'website123',   isSuperadmin: false },
    ];

    for (const a of adminEntries) {
        const passwordHash = await bcrypt.hash(a.password, 10);
        await db.insert(admins).values({
            username: a.username,
            passwordHash,
            isSuperadmin: a.isSuperadmin,
        }).onConflictDoNothing();
        console.log(`  ✓ Admin: ${a.username} (superadmin: ${a.isSuperadmin})`);
    }

    // ── 2. Core Team Roles ────────────────────────────────────────────────────
    console.log('\n── Seeding core team roles...');
    const roles: (typeof coreTeamRoles.$inferInsert)[] = [
        // Institute Officers
        { name: 'Principal', code: 'principal', roleType: 'institution', category: 'Institute Officers', isUniquePerAy: true, displayOrder: 1 },
        { name: 'NSS Program Officer', code: 'nss_program_officer', roleType: 'institution', category: 'Institute Officers', isUniquePerAy: true, displayOrder: 2 },
        // NSS Representatives
        { name: 'Boys Representative', code: 'boys_representative', roleType: 'student', category: 'NSS Representatives', isUniquePerAy: true, displayOrder: 3 },
        { name: 'Girls Representative', code: 'girls_representative', roleType: 'student', category: 'NSS Representatives', isUniquePerAy: true, displayOrder: 4 },
        // Department Coordinators
        { name: 'Computer Engineering', code: 'dept_coord_computer_engineering', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 10 },
        { name: 'Computer Science and Business Systems', code: 'dept_coord_csbs', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 11 },
        { name: 'Information Technology', code: 'dept_coord_information_technology', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 12 },
        { name: 'Electronics and telecomunication', code: 'dept_coord_entc', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 13 },
        { name: 'Electrical Engineering', code: 'dept_coord_electrical', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 14 },
        { name: 'Automation and Robotics', code: 'dept_coord_automation', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 15 },
        { name: 'Mechanical engineering', code: 'dept_coord_mechanical', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 16 },
        { name: 'Civil Engineering', code: 'dept_coord_civil', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 17 },
        { name: 'Bachelor of Computer Applications department', code: 'dept_coord_bca', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 18 },
        // Portfolio Leads
        { name: 'Technical team Lead', code: 'portfolio_lead_technical', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 30 },
        { name: 'Event Management team Lead', code: 'portfolio_lead_event_management', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 31 },
        { name: 'Social Media team Lead', code: 'portfolio_lead_social_media', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 32 },
        { name: 'Cultural team Lead', code: 'portfolio_lead_cultural', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 33 },
        { name: 'Graphics team Lead', code: 'portfolio_lead_graphic_design', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 34 },
        { name: 'Documentation team Lead', code: 'portfolio_lead_documentation', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 35 },
        { name: 'PR team Lead', code: 'portfolio_lead_pr', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 36 },
        { name: 'Hospitality team Lead', code: 'portfolio_lead_hospitality', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 37 },
        { name: 'Decoration team lead', code: 'portfolio_lead_decoration', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 38 },
        { name: 'Portfolio Lead - Website',          code: 'portfolio_lead_website',          roleType: 'student', isUniquePerAy: true, displayOrder: 38 },
    ];

    for (const role of roles) {
        await db.insert(coreTeamRoles).values(role).onConflictDoUpdate({ 
            target: coreTeamRoles.code,
            set: { category: role.category, displayOrder: role.displayOrder }
        });
        console.log(`  ✓ Role: ${role.name}`);
    }

    // ── 3. Site Settings ──────────────────────────────────────────────────────
    console.log('\n── Seeding site settings...');
    const settings: { key: string; value: string }[] = [
        { key: 'heroTitle',             value: 'NOT ME, BUT YOU' },
        { key: 'heroSubtitle',          value: 'National Service Scheme - JSPM RSCOE' },
        { key: 'heroCta',               value: 'Join Us / Register' },
        { key: 'statEventsCount',       value: '50+' },
        { key: 'statEventsLabel',       value: 'Events Conducted' },
        { key: 'statVolunteersCount',   value: '500+' },
        { key: 'statVolunteersLabel',   value: 'Active Volunteers' },
        { key: 'statCampsCount',        value: '10+' },
        { key: 'statCampsLabel',        value: 'Special Camps' },
        { key: 'statHoursCount',        value: '5000+' },
        { key: 'statHoursLabel',        value: 'Service Hours' },
        { key: 'aboutTitle',            value: 'About NSS' },
        { key: 'aboutText',             value: 'The National Service Scheme (NSS) is a Central Sector Scheme of Government of India, Ministry of Youth Affairs & Sports. NSS provides opportunity to the student youth of 11th & 12th Class of schools at district level and student youth of Technical Institution, Graduate & Post Graduate at university level of India to take part in various government led community service activities & programmes.' },
        { key: 'contactEmail',          value: 'nss@jspmrscoe.edu.in' },
    ];

    for (const setting of settings) {
        await db.insert(siteSettings).values(setting)
            .onConflictDoNothing();
        console.log(`  ✓ Setting: ${setting.key}`);
    }

    console.log('\n✅ Seed complete!');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
