import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { requireAYUnlocked } from '../middleware/ayLock';
import * as campCtrl from '../controllers/specialCampController';

// AY-scoped camps router (mergeParams: true, mounted under /:ayId/special-camps)
export const ayCampsRouter = Router({ mergeParams: true });

ayCampsRouter.get('/',   campCtrl.listCamps);
ayCampsRouter.post('/',  authenticateToken, requireAdmin, requireAYUnlocked, campCtrl.createCamp);

// Camp-level routes (flat, mounted at /api/special-camps)
const router = Router();

router.get('/:campId',                              campCtrl.getCamp);
router.put('/:campId',                              authenticateToken, requireAdmin, campCtrl.updateCamp);
router.delete('/:campId',                           authenticateToken, requireAdmin, campCtrl.deleteCamp);
router.post('/:campId/participants',                authenticateToken, requireAdmin, campCtrl.addParticipant);
router.delete('/:campId/participants/:participantId', authenticateToken, requireAdmin, campCtrl.removeParticipant);
router.put('/:campId/participants/bulk',            authenticateToken, requireAdmin, campCtrl.setParticipantsBulk);
router.post('/:campId/finalize',                    authenticateToken, requireAdmin, campCtrl.finalizeCamp);
router.post('/:campId/unlock',                      authenticateToken, requireAdmin, campCtrl.unlockCamp);

export default router;
