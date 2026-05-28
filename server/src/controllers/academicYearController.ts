import { Request, Response } from 'express';
import * as ayService from '../services/academicYearService';
import { ok, created, handleError } from '../lib/response';
import { AuthRequest } from '../middleware/auth';

export const listAcademicYears = async (req: Request, res: Response) => {
    try {
        const data = await ayService.getAllAcademicYears();
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const createAcademicYear = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const ay = await ayService.createAcademicYear(req.body, adminId);
        created(res, ay, `Academic year "${ay.label}" created.`);
    } catch (err) { handleError(res, err); }
};

export const getCurrentAcademicYear = async (req: Request, res: Response) => {
    try {
        const ay = await ayService.getCurrentAcademicYear();
        if (!ay) return res.status(404).json({ success: false, code: 'NO_CURRENT_AY', message: 'No academic year is currently active.' });
        ok(res, ay);
    } catch (err) { handleError(res, err); }
};

export const getAcademicYear = async (req: Request, res: Response) => {
    try {
        const ay = await ayService.getAcademicYearById(Number(req.params.id));
        ok(res, ay);
    } catch (err) { handleError(res, err); }
};

export const updateAcademicYear = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const ay = await ayService.updateAcademicYear(Number(req.params.id), req.body, adminId);
        ok(res, ay, 'Academic year updated.');
    } catch (err) { handleError(res, err); }
};

export const activateAcademicYear = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const ay = await ayService.activateAcademicYear(Number(req.params.id), adminId);
        ok(res, ay, `Academic year "${ay.label}" is now active.`);
    } catch (err) { handleError(res, err); }
};

export const lockAcademicYear = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const ay = await ayService.lockAcademicYear(Number(req.params.id), adminId);
        ok(res, ay, `Academic year "${ay.label}" has been locked.`);
    } catch (err) { handleError(res, err); }
};

export const archiveAcademicYear = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const ay = await ayService.archiveAcademicYear(Number(req.params.id), adminId);
        ok(res, ay, `Academic year "${ay.label}" has been archived.`);
    } catch (err) { handleError(res, err); }
};

export const getAcademicYearStats = async (req: Request, res: Response) => {
    try {
        const stats = await ayService.getAcademicYearStats(Number(req.params.id));
        ok(res, stats);
    } catch (err) { handleError(res, err); }
};
