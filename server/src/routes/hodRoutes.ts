import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import * as hodService from '../services/hodService';
import { ok, noContent, handleError } from '../lib/response';

const router = Router();

// GET /api/hod-contacts — list all HODs (any admin can view)
router.get(
    '/',
    authenticateToken, requireAdmin,
    async (req: Request, res: Response) => {
        try {
            const data = await hodService.listHods();
            ok(res, data);
        } catch (err) { handleError(res, err); }
    }
);

// PUT /api/hod-contacts/:department — upsert HOD for dept (superadmin only)
router.put(
    '/:department',
    authenticateToken, requireSuperAdmin,
    async (req: Request, res: Response) => {
        try {
            const { department } = req.params;
            const { name, email } = req.body;
            if (!name || !email) {
                return res.status(400).json({ success: false, message: 'name and email are required.' });
            }
            const data = await hodService.upsertHod(decodeURIComponent(department), name, email);
            ok(res, data, 'HOD contact saved.');
        } catch (err) { handleError(res, err); }
    }
);

// PATCH /api/hod-contacts/:id — toggle active or update fields (superadmin only)
router.patch(
    '/:id',
    authenticateToken, requireSuperAdmin,
    async (req: Request, res: Response) => {
        try {
            const data = await hodService.updateHod(Number(req.params.id), req.body);
            ok(res, data, 'HOD contact updated.');
        } catch (err) { handleError(res, err); }
    }
);

// DELETE /api/hod-contacts/:id (superadmin only)
router.delete(
    '/:id',
    authenticateToken, requireSuperAdmin,
    async (req: Request, res: Response) => {
        try {
            await hodService.deleteHod(Number(req.params.id));
            noContent(res);
        } catch (err) { handleError(res, err); }
    }
);

export default router;
