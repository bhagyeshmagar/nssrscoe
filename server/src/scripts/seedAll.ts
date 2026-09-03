/**
 * Comprehensive Seed Script
 * Seeds: superadmin, site settings, core team roles
 * Run with: npx tsx src/scripts/seedAll.ts
 */
import 'dotenv/config';
import { db } from '../db';
import { admins, siteSettings, coreTeamRoles } from '../db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('🌱 Starting comprehensive seed...\n');
    
    const defaultPassword = process.env.DEFAULT_SEED_PASSWORD || 'changeme';

    try {
        await db.transaction(async (tx) => {
            // ── 1. Admins ──────────────────────────────────────────────────────────────
            console.log('── Seeding admins...');
            const adminEntries = [
                { username: 'bhagyeshgmagar007@gmail.com', password: defaultPassword, isSuperadmin: true  },
                { username: 'nsspo@email.com',             password: defaultPassword, isSuperadmin: false },
                { username: 'website@email.com',           password: defaultPassword, isSuperadmin: false },
            ];

            for (const a of adminEntries) {
                const existingAdmin = await tx
                    .select({ id: admins.id })
                    .top(1)
                    .from(admins)
                    .where(eq(admins.username, a.username));

                if (existingAdmin.length === 0) {
                    const passwordHash = await bcrypt.hash(a.password, 10);
                    await tx.insert(admins).values({
                        username: a.username,
                        passwordHash,
                        isSuperadmin: a.isSuperadmin,
                    });
                    console.log(`  ✓ Admin: ${a.username} (superadmin: ${a.isSuperadmin})`);
                } else {
                    console.log(`  - Admin: ${a.username} already exists, skipping`);
                }
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
                { name: 'Electronics and Telecommunication', code: 'dept_coord_entc', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 13 },
                { name: 'Electrical Engineering', code: 'dept_coord_electrical', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 14 },
                { name: 'Automation and Robotics', code: 'dept_coord_automation', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 15 },
                { name: 'Mechanical Engineering', code: 'dept_coord_mechanical', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 16 },
                { name: 'Civil Engineering', code: 'dept_coord_civil', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 17 },
                { name: 'Bachelor of Computer Applications', code: 'dept_coord_bca', roleType: 'student', category: 'Department Coordinators', isUniquePerAy: true, displayOrder: 18 },
                // Portfolio Leads
                { name: 'Technical Team Lead', code: 'portfolio_lead_technical', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 30 },
                { name: 'Event Management Team Lead', code: 'portfolio_lead_event_management', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 31 },
                { name: 'Social Media Team Lead', code: 'portfolio_lead_social_media', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 32 },
                { name: 'Cultural Team Lead', code: 'portfolio_lead_cultural', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 33 },
                { name: 'Graphics Team Lead', code: 'portfolio_lead_graphic_design', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 34 },
                { name: 'Documentation Team Lead', code: 'portfolio_lead_documentation', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 35 },
                { name: 'PR Team Lead', code: 'portfolio_lead_pr', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 36 },
                { name: 'Hospitality Team Lead', code: 'portfolio_lead_hospitality', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 37 },
                { name: 'Decoration Team Lead', code: 'portfolio_lead_decoration', roleType: 'student', category: 'Portfolio Leads', isUniquePerAy: true, displayOrder: 38 },
                { name: 'Portfolio Lead - Website', code: 'portfolio_lead_website', roleType: 'student', isUniquePerAy: true, displayOrder: 39 },
            ];

            for (const role of roles) {
                const existingRole = await tx
                    .select({ id: coreTeamRoles.id })
                    .top(1)
                    .from(coreTeamRoles)
                    .where(eq(coreTeamRoles.code, role.code));

                if (existingRole.length === 0) {
                    await tx.insert(coreTeamRoles).values(role);
                    console.log(`  ✓ Role: ${role.name}`);
                } else {
                    console.log(`  - Role: ${role.name} already exists, skipping`);
                }
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
                { key: 'statImpactCount',       value: '10+' },
                { key: 'statImpactLabel',       value: 'Special Camps' },
                { key: 'aboutMission',          value: 'The National Service Scheme (NSS) is a Central Sector Scheme of Government of India, Ministry of Youth Affairs & Sports. NSS provides opportunity to the student youth of 11th & 12th Class of schools at district level and student youth of Technical Institution, Graduate & Post Graduate at university level of India to take part in various government led community service activities & programmes.' },
                { key: 'contactEmail',          value: 'nssrscoe073@gmail.com' },
            ];

            for (const setting of settings) {
                const existingSetting = await tx
                    .select({ key: siteSettings.key })
                    .top(1)
                    .from(siteSettings)
                    .where(eq(siteSettings.key, setting.key));

                if (existingSetting.length === 0) {
                    await tx.insert(siteSettings).values(setting);
                    console.log(`  ✓ Setting: ${setting.key}`);
                } else {
                    console.log(`  - Setting: ${setting.key} already exists, skipping`);
                }
            }
        });

        console.log('\n✅ Seed complete!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    }
}

main();
