import { Router } from 'express';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createAYSchema, updateAYSchema, unlockAYSchema } from '../lib/schemas/index';
import * as ayCtrl from '../controllers/academicYearController';

const router = Router();

// Public read endpoints
router.get('/',        ayCtrl.listAcademicYears);
router.get('/current', ayCtrl.getCurrentAcademicYear);
router.get('/:id',     ayCtrl.getAcademicYear);

// Stats are admin-only — they expose volunteer/camp counts
router.get('/:id/stats', authenticateToken, requireAdmin, ayCtrl.getAcademicYearStats);

// Admin-only mutation endpoints
router.post('/',              authenticateToken, requireAdmin, validateRequest(createAYSchema), ayCtrl.createAcademicYear);
router.put('/:id',            authenticateToken, requireAdmin, validateRequest(updateAYSchema), ayCtrl.updateAcademicYear);
router.post('/:id/activate',  authenticateToken, requireAdmin, ayCtrl.activateAcademicYear);
router.post('/:id/lock',      authenticateToken, requireAdmin, ayCtrl.lockAcademicYear);
router.post('/:id/unlock',    authenticateToken, requireSuperAdmin, validateRequest(unlockAYSchema), ayCtrl.unlockAcademicYear);
router.post('/:id/archive',   authenticateToken, requireAdmin, ayCtrl.archiveAcademicYear);
router.post('/:id/unarchive', authenticateToken, requireSuperAdmin, ayCtrl.unarchiveAcademicYear);
router.delete('/:id',         authenticateToken, requireAdmin, ayCtrl.deleteAcademicYear);

export default router;
