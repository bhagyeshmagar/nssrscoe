import { Request, Response } from 'express';
import * as campService from '../services/specialCampService';
import { ok, created, noContent, handleError } from '../lib/response';
import { AuthRequest } from '../middleware/auth';

export const listCamps = async (req: Request, res: Response) => {
    try {
        ok(res, await campService.listCamps(Number(req.params.ayId)));
    } catch (err) { handleError(res, err); }
};

export const createCamp = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const { name, location, startDate, endDate, description, volunteerCap } = req.body;
        const camp = await campService.createCamp(Number(req.params.ayId), { name, location, startDate, endDate, description, volunteerCap }, adminId);
        created(res, camp, 'Special camp created.');
    } catch (err) { handleError(res, err); }
};

export const getCamp = async (req: Request, res: Response) => {
    try {
        ok(res, await campService.getCamp(Number(req.params.campId)));
    } catch (err) { handleError(res, err); }
};

export const updateCamp = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const { name, location, startDate, endDate, description, volunteerCap } = req.body;
        ok(res, await campService.updateCamp(Number(req.params.campId), { name, location, startDate, endDate, description, volunteerCap }, adminId), 'Camp updated.');
    } catch (err) { handleError(res, err); }
};

export const deleteCamp = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        await campService.deleteCamp(Number(req.params.campId), adminId);
        noContent(res);
    } catch (err) { handleError(res, err); }
};

export const addParticipant = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const { volunteerId } = req.body;
        const p = await campService.addParticipant(Number(req.params.campId), Number(volunteerId), adminId);
        created(res, p, 'Participant added.');
    } catch (err) { handleError(res, err); }
};

export const removeParticipant = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        await campService.removeParticipant(Number(req.params.campId), Number(req.params.participantId), adminId);
        noContent(res);
    } catch (err) { handleError(res, err); }
};

export const finalizeCamp = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const camp = await campService.finalizeCamp(Number(req.params.campId), adminId);
        ok(res, camp, 'Camp finalized. Participant data has been frozen.');
    } catch (err) { handleError(res, err); }
};

export const setParticipantsBulk = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const { volunteerIds } = req.body;
        await campService.setParticipantsBulk(Number(req.params.campId), volunteerIds, adminId);
        ok(res, null, 'Participants updated.');
    } catch (err) { handleError(res, err); }
};

export const unlockCamp = async (req: Request, res: Response) => {
    try {
        const adminId = (req as AuthRequest).user!.id;
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }
        const camp = await campService.unlockCamp(Number(req.params.campId), password, adminId);
        ok(res, camp, 'Camp unlocked.');
    } catch (err) { handleError(res, err); }
};
