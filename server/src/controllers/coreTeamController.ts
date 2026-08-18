import { Request, Response } from 'express';
import * as ctService from '../services/coreTeamService';
import { ok, created, noContent, handleError } from '../lib/response';
import { AuthRequest } from '../middleware/auth';

export const getCoreTeam = async (req: Request, res: Response) => {
    try {
        const data = await ctService.getCoreTeamByAY(Number(req.params.ayId));
        
        const authReq = req as AuthRequest;
        if (authReq.user!.role !== 'superadmin') {
            data.forEach((item: any) => {
                if (item.volunteer) {
                    delete item.volunteer.caste;
                    delete item.volunteer.casteCategory;
                    delete item.volunteer.religion;
                }
            });
        }
        
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
        const adminId = (req as AuthRequest).user!.id;
        const ayId = Number(req.params.ayId);
        const assignment = await ctService.assignRole(ayId, req.body, adminId);
        created(res, assignment, 'Role assigned.');
    } catch (err) { handleError(res, err); }
};

export const updateAssignment = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const updated = await ctService.updateAssignment(Number(req.params.id), req.body, adminId);
        ok(res, updated, 'Assignment updated.');
    } catch (err) { handleError(res, err); }
};

export const removeAssignment = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const adminId = authReq.user!.id;
        await ctService.removeAssignment(Number(req.params.id), adminId);
        noContent(res);
    } catch (err) { handleError(res, err); }
};

export const deleteCustomRole = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const adminId = authReq.user!.id;
        await ctService.deleteCustomRole(Number(req.params.id), adminId);
        noContent(res);
    } catch (err) { handleError(res, err); }
};
