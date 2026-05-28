import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { requireAYUnlocked } from '../middleware/ayLock';
import * as ctCtrl from '../controllers/coreTeamController';

// ── AY-scoped core team router (mergeParams: true, mounted under /:ayId) ──────
export const ayCoreTeamRouter = Router({ mergeParams: true });

ayCoreTeamRouter.get('/',    ctCtrl.getCoreTeam);
ayCoreTeamRouter.post('/',   authenticateToken, requireAdmin, requireAYUnlocked, ctCtrl.assignRole);
ayCoreTeamRouter.put('/:id', authenticateToken, requireAdmin, requireAYUnlocked, ctCtrl.updateAssignment);
ayCoreTeamRouter.delete('/:id', authenticateToken, requireAdmin, requireAYUnlocked, ctCtrl.removeAssignment);

// ── Flat role reference router (mounted under /api/core-team) ─────────────────
const router = Router();
router.get('/roles', ctCtrl.listRoles);

export default router;
