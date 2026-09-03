import { Router } from 'express';
import { authenticateToken, optionalAuth, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import * as sliderCtrl from '../controllers/sliderController';

const router = Router();

// Publicly accessible but filters internally based on user context
router.get('/', optionalAuth, sliderCtrl.getSliderImages);

// Admin operations
router.post('/', authenticateToken, requireAdmin, sliderCtrl.addSliderImage);
router.put('/:id', authenticateToken, requireAdmin, sliderCtrl.updateSliderImage);
router.delete('/:id', authenticateToken, requireAdmin, sliderCtrl.deleteSliderImage);

export default router;
