import { Router } from 'express';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { requireAYUnlocked } from '../middleware/ayLock';
import { validateRequest } from '../middleware/validate';
import { assignRoleSchema, updateAssignmentSchema } from '../lib/schemas/index';
import * as ctCtrl from '../controllers/coreTeamController';

// ── AY-scoped core team router (mergeParams: true, mounted under /:ayId) ──────
export const ayCoreTeamRouter = Router({ mergeParams: true });

ayCoreTeamRouter.get('/',    authenticateToken, requireAdmin, ctCtrl.getCoreTeam);
ayCoreTeamRouter.post('/',   authenticateToken, requireAdmin, requireAYUnlocked, validateRequest(assignRoleSchema), ctCtrl.assignRole);
ayCoreTeamRouter.put('/:id', authenticateToken, requireAdmin, requireAYUnlocked, validateRequest(updateAssignmentSchema), ctCtrl.updateAssignment);
ayCoreTeamRouter.delete('/:id', authenticateToken, requireAdmin, requireAYUnlocked, ctCtrl.removeAssignment);

// ── Flat role reference router (mounted under /api/core-team) ─────────────────
const router = Router();
router.get('/roles', ctCtrl.listRoles);
router.delete('/roles/:id', authenticateToken, requireAdmin, ctCtrl.deleteCustomRole);

export default router;
