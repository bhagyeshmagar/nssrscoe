import { Router } from 'express';
import { getGallery, createGalleryItem, updateGalleryItem, deleteGalleryItem } from '../controllers/galleryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', getGallery);
router.post('/', authenticateToken, createGalleryItem);
router.put('/:id', authenticateToken, updateGalleryItem);
router.delete('/:id', authenticateToken, deleteGalleryItem);

export default router;
