import { eq, and, like } from 'drizzle-orm';
import { db } from '../db';
import { volunteers, volunteerProfiles } from '../db/schema';
import { Department } from '../lib/db-constants';

export const getDepartmentVolunteers = async (ayId: number, department: Department) => {
    return db.select({
        id:      volunteers.id,
        name:    volunteers.name,
        email:   volunteers.email,
        status:  volunteers.status,
        profile: volunteerProfiles,
    })
    .from(volunteers)
    .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
    .where(and(
        eq(volunteers.academicYearId, ayId),
        eq(volunteers.department, department),
        eq(volunteers.isActive, true),
    ));
};

/**
 * Find volunteers who listed a specific portfolio in their choices.
 *
 * portfolioKeyword comes from the assigned role name (e.g. "Technical Secretary").
 * We escape LIKE special characters to prevent SQL injection via the roleName.
 */
export const getPortfolioVolunteers = async (ayId: number, portfolioKeyword: string) => {
    // Escape LIKE metacharacters so a role name like "50% Lead" doesn't break the pattern
    const safeLike = portfolioKeyword
        .replace(/\[/g, '[[]')
        .replace(/%/g, '[%]')
        .replace(/_/g, '[_]');

    return db.select({
        id:      volunteers.id,
        name:    volunteers.name,
        email:   volunteers.email,
        status:  volunteers.status,
        profile: volunteerProfiles,
    })
    .from(volunteers)
    .leftJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
    .where(and(
        eq(volunteers.academicYearId, ayId),
        eq(volunteers.isActive, true),
        like(volunteerProfiles.portfolioChoices, `%${safeLike}%`),
    ));
};
