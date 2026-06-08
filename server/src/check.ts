import { db } from './server/src/db';
import { coreTeamRoles } from './server/src/db/schema';
import { eq } from 'drizzle-orm';
async function run() {
    const roles = await db.select().from(coreTeamRoles).where(eq(coreTeamRoles.id, 129));
    console.log(roles);
    process.exit(0);
}
run();
