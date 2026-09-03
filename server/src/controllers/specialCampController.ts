import { Request, Response } from 'express';
import * as campService from '../services/specialCampService';
import { ok, created, noContent, handleError } from '../lib/response';
import { AuthRequest, getAdminId } from '../middleware/auth';
import { positiveIntParam } from '../lib/schemas';
import { ValidationError } from '../lib/errors';
import { z } from 'zod';

export const listCamps = async (req: Request, res: Response) => {
    try {
        ok(res, await campService.listCamps(positiveIntParam.parse(req.params.ayId)));
    } catch (err) { handleError(res, err); }
};

export const createCamp = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const { name, location, startDate, endDate, description, volunteerCap } = req.body;
        const camp = await campService.createCamp(positiveIntParam.parse(req.params.ayId), { name, location, startDate, endDate, description, volunteerCap }, adminId);
        created(res, camp, 'Special camp created.');
    } catch (err) { handleError(res, err); }
};

export const getCamp = async (req: Request, res: Response) => {
    try {
        ok(res, await campService.getCamp(positiveIntParam.parse(req.params.campId)));
    } catch (err) { handleError(res, err); }
};

export const updateCamp = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const { name, location, startDate, endDate, description, volunteerCap } = req.body;
        ok(res, await campService.updateCamp(positiveIntParam.parse(req.params.campId), { name, location, startDate, endDate, description, volunteerCap }, adminId), 'Camp updated.');
    } catch (err) { handleError(res, err); }
};

export const deleteCamp = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        await campService.deleteCamp(positiveIntParam.parse(req.params.campId), adminId);
        noContent(res);
    } catch (err) { handleError(res, err); }
};

export const addParticipant = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const { volunteerId } = z.object({ volunteerId: z.coerce.number().int().positive() }).parse(req.body);
        const p = await campService.addParticipant(positiveIntParam.parse(req.params.campId), volunteerId, adminId);
        created(res, p, 'Participant added.');
    } catch (err) { handleError(res, err); }
};

export const removeParticipant = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        await campService.removeParticipant(positiveIntParam.parse(req.params.campId), positiveIntParam.parse(req.params.participantId), adminId);
        noContent(res);
    } catch (err) { handleError(res, err); }
};

export const finalizeCamp = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const camp = await campService.finalizeCamp(positiveIntParam.parse(req.params.campId), adminId);
        ok(res, camp, 'Camp finalized. Participant data has been frozen.');
    } catch (err) { handleError(res, err); }
};

export const setParticipantsBulk = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const { volunteerIds } = req.body;
        if (!Array.isArray(volunteerIds) || volunteerIds.length === 0 || !volunteerIds.every(id => Number.isInteger(Number(id)))) {
            throw new ValidationError('volunteerIds must be a non-empty array of integers.');
        }
        await campService.setParticipantsBulk(positiveIntParam.parse(req.params.campId), volunteerIds, adminId);
        ok(res, null, 'Participants updated.');
    } catch (err) { handleError(res, err); }
};

export const unlockCamp = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const { password } = req.body;
        if (!password) {
            throw new ValidationError('Password is required');
        }
        const camp = await campService.unlockCamp(positiveIntParam.parse(req.params.campId), password, adminId);
        ok(res, camp, 'Camp unlocked.');
    } catch (err) { handleError(res, err); }
};
