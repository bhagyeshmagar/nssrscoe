import { Router } from 'express';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { requireAYUnlocked } from '../middleware/ayLock';
import * as ctCtrl from '../controllers/coreTeamController';

// ── AY-scoped core team router (mergeParams: true, mounted under /:ayId) ──────
export const ayCoreTeamRouter = Router({ mergeParams: true });

ayCoreTeamRouter.get('/',    ctCtrl.getCoreTeam);
ayCoreTeamRouter.post('/',   authenticateToken, requireSuperAdmin, requireAYUnlocked, ctCtrl.assignRole);
ayCoreTeamRouter.put('/:id', authenticateToken, requireSuperAdmin, requireAYUnlocked, ctCtrl.updateAssignment);
ayCoreTeamRouter.delete('/:id', authenticateToken, requireSuperAdmin, requireAYUnlocked, ctCtrl.removeAssignment);

// ── Flat role reference router (mounted under /api/core-team) ─────────────────
const router = Router();
router.get('/roles', ctCtrl.listRoles);
router.delete('/roles/:id', authenticateToken, requireSuperAdmin, ctCtrl.deleteCustomRole);

export default router;
