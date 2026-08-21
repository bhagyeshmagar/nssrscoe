import { Router } from 'express';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { requireAYUnlocked } from '../middleware/ayLock';
import { validateRequest } from '../middleware/validate';
import {
    createCampSchema,
    updateCampSchema,
    addParticipantSchema,
    setParticipantsBulkSchema,
    unlockCampSchema,
} from '../lib/schemas/index';
import * as campCtrl from '../controllers/specialCampController';

// AY-scoped camps router (mergeParams: true, mounted under /:ayId/special-camps)
export const ayCampsRouter = Router({ mergeParams: true });

ayCampsRouter.get('/',  campCtrl.listCamps);
ayCampsRouter.post('/', authenticateToken, requireAdmin, requireAYUnlocked, validateRequest(createCampSchema), campCtrl.createCamp);

// Camp-level routes (flat, mounted at /api/special-camps)
const router = Router();

router.get('/:campId', campCtrl.getCamp);
router.put('/:campId',    authenticateToken, requireAdmin, validateRequest(updateCampSchema), campCtrl.updateCamp);
router.delete('/:campId', authenticateToken, requireSuperAdmin, campCtrl.deleteCamp);

router.post('/:campId/participants',                   authenticateToken, requireAdmin, validateRequest(addParticipantSchema), campCtrl.addParticipant);
router.delete('/:campId/participants/:participantId',  authenticateToken, requireAdmin, campCtrl.removeParticipant);
router.put('/:campId/participants/bulk',               authenticateToken, requireAdmin, validateRequest(setParticipantsBulkSchema), campCtrl.setParticipantsBulk);

router.post('/:campId/finalize', authenticateToken, requireSuperAdmin, campCtrl.finalizeCamp);
router.post('/:campId/unlock',   authenticateToken, requireSuperAdmin, validateRequest(unlockCampSchema), campCtrl.unlockCamp);

export default router;
