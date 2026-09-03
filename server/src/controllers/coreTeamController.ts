import { Request, Response } from 'express';
import * as ctService from '../services/coreTeamService';
import { ok, created, noContent, handleError } from '../lib/response';
import { AuthRequest, getAdminId } from '../middleware/auth';
import { positiveIntParam } from '../lib/schemas';

export const getCoreTeam = async (req: Request, res: Response) => {
    try {
        const data = await ctService.getCoreTeamByAY(positiveIntParam.parse(req.params.ayId));
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const listRoles = async (req: Request, res: Response) => {
    try {
        const data = await ctService.getAllRoles();
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const assignRole = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const ayId = positiveIntParam.parse(req.params.ayId);
        const assignment = await ctService.assignRole(ayId, req.body, adminId);
        created(res, assignment, 'Role assigned.');
    } catch (err) { handleError(res, err); }
};

export const updateAssignment = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const updated = await ctService.updateAssignment(positiveIntParam.parse(req.params.id), req.body, adminId);
        ok(res, updated, 'Assignment updated.');
    } catch (err) { handleError(res, err); }
};

export const removeAssignment = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        await ctService.removeAssignment(positiveIntParam.parse(req.params.id), adminId);
        noContent(res);
    } catch (err) { handleError(res, err); }
};

export const deleteCustomRole = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        await ctService.deleteCustomRole(positiveIntParam.parse(req.params.id), adminId);
        noContent(res);
    } catch (err) { handleError(res, err); }
};
