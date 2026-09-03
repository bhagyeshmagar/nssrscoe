import { Router } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import * as approvalsCtrl from '../controllers/approvalsController';

const router = Router();

// Only Superadmins can view and manage approvals
router.use(authenticateToken, requireSuperAdmin);

router.get('/pending', approvalsCtrl.getPendingApprovals);

router.patch('/events/:id/approve', approvalsCtrl.approveEvent);
router.patch('/events/:id/reject', approvalsCtrl.rejectEvent);

router.patch('/sliders/:id/approve', approvalsCtrl.approveSlider);
router.patch('/sliders/:id/reject', approvalsCtrl.rejectSlider);

router.patch('/innovative-ideas/:id/approve', approvalsCtrl.approveInnovativeIdea);
router.patch('/innovative-ideas/:id/reject', approvalsCtrl.rejectInnovativeIdea);

router.patch('/gallery/:id/approve', approvalsCtrl.approveGallery);
router.patch('/gallery/:id/reject', approvalsCtrl.rejectGallery);

export default router;
