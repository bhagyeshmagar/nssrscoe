import { Router } from 'express';
import { 
    getGallery, 
    getGalleryAdmin, 
    createGalleryItem, 
    updateGalleryItem, 
    deleteGalleryItem, 
    approveGalleryItem, 
    rejectGalleryItem 
} from '../controllers/galleryController';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// Public route (approved only)
router.get('/', getGallery);

// Admin routes
router.get('/admin', authenticateToken, requireAdmin, getGalleryAdmin);
router.post('/', authenticateToken, requireAdmin, createGalleryItem);
router.put('/:id', authenticateToken, requireAdmin, updateGalleryItem);
router.delete('/:id', authenticateToken, requireAdmin, deleteGalleryItem);

// Superadmin routes (approval workflow)
router.put('/:id/approve', authenticateToken, requireSuperAdmin, approveGalleryItem);
router.put('/:id/reject', authenticateToken, requireSuperAdmin, rejectGalleryItem);

export default router;
