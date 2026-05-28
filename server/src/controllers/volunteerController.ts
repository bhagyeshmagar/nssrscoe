import { Request, Response } from 'express';
import * as volService from '../services/volunteerService';
import { ok, created, noContent, handleError } from '../lib/response';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';
import { volunteerProfiles, volunteers } from '../db/schema';
import { eq } from 'drizzle-orm';

// ── Admin: AY-scoped volunteer management ─────────────────────────────────────

export const listVolunteersByAY = async (req: Request, res: Response) => {
    try {
        const ayId = Number(req.params.ayId);
        const { department, status, search, isActive } = req.query;
        const data = await volService.listVolunteersForAY(ayId, {
            department: department as string | undefined,
            status: status as 'regular' | 'backup' | undefined,
            search: search as string | undefined,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
        });
        console.log('DEBUG API OUTPUT:', JSON.stringify(data[0], null, 2));
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const createVolunteer = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const ayId = Number(req.params.ayId);
        const vol = await volService.createVolunteer(ayId, req.body, adminId);
        created(res, vol, `Volunteer "${vol.name}" added to academic year.`);
    } catch (err) { handleError(res, err); }
};

export const getVolunteer = async (req: Request, res: Response) => {
    try {
        const data = await volService.getVolunteerById(Number(req.params.id));
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const updateVolunteer = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const vol = await volService.updateVolunteer(Number(req.params.id), req.body, adminId);
        ok(res, vol, 'Volunteer updated.');
    } catch (err) { handleError(res, err); }
};

export const deleteVolunteer = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        await volService.deleteVolunteer(Number(req.params.id), adminId);
        noContent(res);
    } catch (err) { handleError(res, err); }
};

export const changeVolunteerStatus = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const { status } = req.body;
        if (!['regular', 'backup'].includes(status)) {
            return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'status must be "regular" or "backup".' });
        }
        const vol = await volService.changeVolunteerStatus(Number(req.params.id), status, adminId);
        ok(res, vol, `Volunteer status changed to "${status}".`);
    } catch (err) { handleError(res, err); }
};

export const toggleVolunteerActive = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const vol = await volService.toggleVolunteerActive(Number(req.params.id), adminId);
        ok(res, vol, `Volunteer ${vol.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err) { handleError(res, err); }
};

export const importVolunteers = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const ayId = Number(req.params.ayId);
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
            return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'currentPassword and newPassword are required.' });
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
            .from(volunteers)
            .where(eq(volunteers.id, volunteerUser.id))
            .limit(1);
        if (!vol) return res.status(404).json({ success: false, message: 'Volunteer not found.' });

        const data = await volService.listVolunteersForAY(vol.academicYearId, { isActive: true });
        // Strip sensitive fields
        const safe = data.map(v => ({
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
                collegeYearAtEnrollment: volunteerProfiles.collegeYearAtEnrollment,
            })
            .from(volunteerProfiles);

        const experiences = profiles
            .filter(p => p.experienceText && p.experienceText.trim() !== '')
            .map(p => ({
                id: p.id,
                name: p.fullName ?? 'Anonymous',
                role: p.collegeYearAtEnrollment ? `Volunteer, ${p.collegeYearAtEnrollment}` : 'Volunteer',
                text: p.experienceText,
                image: p.profilePhotoUrl ?? 'https://i.pravatar.cc/150?img=1',
            }));

        ok(res, experiences);
    } catch (err) { handleError(res, err); }
};
