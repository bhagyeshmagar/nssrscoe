import { Request, Response } from 'express';
import * as volService from '../services/volunteerService';
import { ok, created, noContent, handleError } from '../lib/response';
import { AuthRequest, getAdminId } from '../middleware/auth';
import { db } from '../db';
import { volunteerProfiles, volunteers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ValidationError, NotFoundError } from '../lib/errors';
import { positiveIntParam } from '../lib/schemas';
import { z } from 'zod';

// ── Admin: AY-scoped volunteer management ─────────────────────────────────────

export const listVolunteersByAY = async (req: Request, res: Response) => {
    try {
        const ayId = positiveIntParam.parse(req.params.ayId);
        const { department, status, search, isActive, sortBy } = req.query;
        const { page, limit } = z.object({
            page: z.coerce.number().int().positive().optional().default(1),
            limit: z.coerce.number().int().positive().max(100).optional().default(20),
        }).parse(req.query);
        const data = await volService.listVolunteersForAY(ayId, {
            department: department as string | undefined,
            status: status as 'regular' | 'backup' | undefined,
            search: search as string | undefined,
            sortBy: sortBy as 'name' | 'department' | undefined,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
            page,
            limit,
        });

        const authReq = req as AuthRequest;
        if (authReq.user!.role !== 'superadmin') {
            data.data = data.data.map((v: any) => {
                if (v.profile) {
                    const { caste, casteCategory, religion, ...safeProfile } = v.profile;
                    return { ...v, profile: safeProfile };
                }
                return v;
            });
        }

        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const createVolunteer = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const ayId = positiveIntParam.parse(req.params.ayId);
        const vol = await volService.createVolunteer(ayId, req.body, adminId);
        created(res, vol, `Volunteer "${vol.name}" added to academic year.`);
    } catch (err) { handleError(res, err); }
};

export const getVolunteer = async (req: Request, res: Response) => {
    try {
        const data = await volService.getVolunteerById(positiveIntParam.parse(req.params.id));
        
        const authReq = req as AuthRequest;
        if (authReq.user!.role !== 'superadmin' && data.profile) {
            const { caste, casteCategory, religion, ...safeProfile } = data.profile as any;
            data.profile = safeProfile;
        }

        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const updateVolunteer = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const vol = await volService.updateVolunteer(positiveIntParam.parse(req.params.id), req.body, adminId);
        ok(res, vol, 'Volunteer updated.');
    } catch (err) { handleError(res, err); }
};

export const deleteVolunteer = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        await volService.deleteVolunteer(positiveIntParam.parse(req.params.id), adminId);
        noContent(res);
    } catch (err) { handleError(res, err); }
};

export const changeVolunteerStatus = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const { status } = req.body;
        if (!['regular', 'backup'].includes(status)) {
            throw new ValidationError('status must be "regular" or "backup".');
        }
        const vol = await volService.changeVolunteerStatus(positiveIntParam.parse(req.params.id), status, adminId);
        ok(res, vol, `Volunteer status changed to "${status}".`);
    } catch (err) { handleError(res, err); }
};

export const toggleVolunteerActive = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const vol = await volService.toggleVolunteerActive(positiveIntParam.parse(req.params.id), adminId);
        ok(res, vol, `Volunteer ${vol.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err) { handleError(res, err); }
};

export const importVolunteers = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const ayId = positiveIntParam.parse(req.params.ayId);
        const result = await volService.importVolunteersFromAY({ ...req.body, targetAyId: ayId }, adminId);
        ok(res, result, `Import complete. ${result.imported.length} imported, ${result.skipped.length} skipped.`);
    } catch (err) { handleError(res, err); }
};

// ── Volunteer self-service ────────────────────────────────────────────────────

export const getMyProfile = async (req: Request, res: Response) => {
    try {
        const volunteerId = (req as AuthRequest).user!.id;
        const data = await volService.getVolunteerById(volunteerId);
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const getMyAttendance = async (req: Request, res: Response) => {
    try {
        const volunteerId = (req as AuthRequest).user!.id;
        const data = await volService.getMyAttendance(volunteerId);
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const updateMyProfile = async (req: Request, res: Response) => {
    try {
        const volunteerId = (req as AuthRequest).user!.id;
        const profile = await volService.updateVolunteerProfile(volunteerId, req.body);
        ok(res, profile, 'Profile updated.');
    } catch (err) { handleError(res, err); }
};

export const updateMyPassword = async (req: Request, res: Response) => {
    try {
        const volunteerId = (req as AuthRequest).user!.id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            throw new ValidationError('currentPassword and newPassword are required.');
        }
        await volService.changePassword(volunteerId, currentPassword, newPassword);
        ok(res, null, 'Password updated.');
    } catch (err) { handleError(res, err); }
};

/** Volunteer-to-volunteer: list active volunteers in the same AY (limited fields). */
export const getPublicVolunteers = async (req: Request, res: Response) => {
    try {
        const volunteerUser = (req as AuthRequest).user!;
        // Find AY for the requesting volunteer
        const [vol] = await db
            .select({ academicYearId: volunteers.academicYearId })
            .top(1).from(volunteers)
            .where(eq(volunteers.id, volunteerUser.id))
            ;
        if (!vol) throw new NotFoundError('Volunteer not found.');

        const result = await volService.listVolunteersForAY(vol.academicYearId, { isActive: true, sortBy: 'department' });
        // Strip sensitive fields
        const safe = result.data.map((v: any) => ({
            id: v.id,
            name: v.name,
            department: v.department,
            status: v.status,
            fullName: v.profile?.fullName,
            profilePhotoUrl: v.profile?.profilePhotoUrl,
        }));
        ok(res, safe);
    } catch (err) { handleError(res, err); }
};

/** Public: volunteer experience testimonials */
export const getExperiences = async (req: Request, res: Response) => {
    try {
        const profiles = await db
            .select({
                id: volunteerProfiles.id,
                fullName: volunteerProfiles.fullName,
                profilePhotoUrl: volunteerProfiles.profilePhotoUrl,
                experienceText: volunteerProfiles.experienceText,
                isExperienceApproved: volunteerProfiles.isExperienceApproved,
                collegeYearAtEnrollment: volunteerProfiles.collegeYearAtEnrollment,
            })
            .from(volunteerProfiles);

        const experiences = profiles
            .filter(p => p.isExperienceApproved === true && p.experienceText && p.experienceText.trim() !== '')
            .map(p => ({
                id: p.id,
                name: p.fullName ?? 'Anonymous',
                role: p.collegeYearAtEnrollment ? `Volunteer, ${p.collegeYearAtEnrollment}` : 'Volunteer',
                text: p.experienceText,
                // Only return the stored photo URL — never an external placeholder
                image: p.profilePhotoUrl ?? null,
            }));

        ok(res, experiences);
    } catch (err) { handleError(res, err); }
};

export const approveVolunteerExperience = async (req: Request, res: Response) => {
    try {
        const id = positiveIntParam.parse(req.params.id);

        const adminId = getAdminId(req);
        const updated = await volService.approveVolunteerExperience(id, adminId);
        ok(res, updated);
    } catch (err) { handleError(res, err); }
};
