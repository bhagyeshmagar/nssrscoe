import { eq, and, like } from 'drizzle-orm';
import { db } from '../db';
import { volunteers, volunteerProfiles } from '../db/schema';

export const getDepartmentVolunteers = async (ayId: number, department: string) => {
    const vols = await db.select({
        id: volunteers.id,
        name: volunteers.name,
        email: volunteers.email,
        status: volunteers.status,
        profile: volunteerProfiles,
    })
    .from(volunteers)
    .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
    .where(and(
        eq(volunteers.academicYearId, ayId),
        eq(volunteers.department, department as any),
        eq(volunteers.isActive, true)
    ));
    return vols;
};

export const getPortfolioVolunteers = async (ayId: number, portfolioCode: string) => {
    // portfolioCode maps to a code like 'technical_secretary' which they might have typed as 'Technical'
    // Actually, in the frontend, they select portfolio choices. We need to match those.
    const vols = await db.select({
        id: volunteers.id,
        name: volunteers.name,
        email: volunteers.email,
        status: volunteers.status,
        profile: volunteerProfiles,
    })
    .from(volunteers)
    .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
    .where(and(
        eq(volunteers.academicYearId, ayId),
        eq(volunteers.isActive, true),
        like(volunteerProfiles.portfolioChoices, `%${portfolioCode}%`)
    ));
    return vols;
};
