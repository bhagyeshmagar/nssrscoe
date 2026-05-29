import { Router } from 'express';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import * as ayCtrl from '../controllers/academicYearController';

const router = Router();

// Public read endpoints
router.get('/',         ayCtrl.listAcademicYears);
router.get('/current',  ayCtrl.getCurrentAcademicYear);
router.get('/:id',      ayCtrl.getAcademicYear);
router.get('/:id/stats', ayCtrl.getAcademicYearStats);

// Admin-only mutation endpoints
router.post('/',               authenticateToken, requireAdmin, ayCtrl.createAcademicYear);
router.put('/:id',             authenticateToken, requireAdmin, ayCtrl.updateAcademicYear);
router.post('/:id/activate',   authenticateToken, requireAdmin, ayCtrl.activateAcademicYear);
router.post('/:id/lock',       authenticateToken, requireAdmin, ayCtrl.lockAcademicYear);
router.post('/:id/unlock',     authenticateToken, requireSuperAdmin, ayCtrl.unlockAcademicYear);
router.post('/:id/archive',    authenticateToken, requireAdmin, ayCtrl.archiveAcademicYear);

export default router;
