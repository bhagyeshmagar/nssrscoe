import { Request, Response } from 'express';
import * as ayService from '../services/academicYearService';
import { ok, created } from '../lib/response';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../lib/asyncHandler';
import { positiveIntParam, createAYSchema, updateAYSchema, unlockAYSchema } from '../lib/schemas';
import { AppError } from '../lib/errors';

const getAdminId = (req: Request): number => {
    const user = (req as AuthRequest).user;
    if (!user) throw new AppError('Unauthorized access', 401, 'UNAUTHORIZED');
    return user.id;
};

export const listAcademicYears = asyncHandler(async (req: Request, res: Response) => {
    const data = await ayService.getAllAcademicYears();
    ok(res, data);
});

export const createAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const { body } = createAYSchema.parse({ body: req.body });
    const ay = await ayService.createAcademicYear(body, adminId);
    created(res, ay, `Academic year "${ay.label}" created.`);
});

export const getCurrentAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const ay = await ayService.getCurrentAcademicYear();
    if (!ay) throw new AppError('No academic year is currently active.', 404, 'NO_CURRENT_AY');
    ok(res, ay);
});

export const getAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const id = positiveIntParam.parse(req.params.id);
    const ay = await ayService.getAcademicYearById(id);
    ok(res, ay);
});

export const updateAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const id = positiveIntParam.parse(req.params.id);
    const { body } = updateAYSchema.parse({ body: req.body });
    const ay = await ayService.updateAcademicYear(id, body, adminId);
    ok(res, ay, 'Academic year updated.');
});

export const activateAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const id = positiveIntParam.parse(req.params.id);
    const ay = await ayService.activateAcademicYear(id, adminId);
    ok(res, ay, `Academic year "${ay.label}" is now active.`);
});

export const lockAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const id = positiveIntParam.parse(req.params.id);
    const ay = await ayService.lockAcademicYear(id, adminId);
    ok(res, ay, `Academic year "${ay.label}" has been locked.`);
});

export const unlockAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const id = positiveIntParam.parse(req.params.id);
    const { body } = unlockAYSchema.parse({ body: req.body });
    const ay = await ayService.unlockAcademicYear(id, body.password, adminId);
    ok(res, ay, `Academic year "${ay.label}" has been unlocked.`);
});

export const archiveAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const id = positiveIntParam.parse(req.params.id);
    const ay = await ayService.archiveAcademicYear(id, adminId);
    ok(res, ay, `Academic year "${ay.label}" has been archived.`);
});

export const unarchiveAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const id = positiveIntParam.parse(req.params.id);
    const ay = await ayService.unarchiveAcademicYear(id, adminId);
    ok(res, ay, `Academic year "${ay.label}" has been unarchived.`);
});

export const deleteAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const id = positiveIntParam.parse(req.params.id);
    await ayService.deleteAcademicYear(id, adminId);
    ok(res, null, `Academic year deleted.`);
});

export const getAcademicYearStats = asyncHandler(async (req: Request, res: Response) => {
    const id = positiveIntParam.parse(req.params.id);
    const stats = await ayService.getAcademicYearStats(id);
    ok(res, stats);
});
