import { db } from './src/db';
import { coreTeamRoles } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function updateRole() {
  console.log("Updating NSS Program Officer category...");
  await db.update(coreTeamRoles)
    .set({ category: 'NSS Program Officer' })
    .where(eq(coreTeamRoles.code, 'nss_program_officer'));
  console.log("Done.");
  process.exit(0);
}

updateRole().catch(console.error);
