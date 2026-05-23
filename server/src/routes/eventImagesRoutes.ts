import { Router } from 'express';
import {
    getEventImages,
    addEventImages,
    setMasterImage,
    deleteEventImage,
    updateEventImage
} from '../controllers/eventImagesController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public route - get images for an event
router.get('/:eventId', getEventImages);

// Protected routes
router.post('/:eventId', authenticateToken, addEventImages);
router.put('/:eventId/master/:imageId', authenticateToken, setMasterImage);
router.put('/:imageId', authenticateToken, updateEventImage);
router.delete('/:imageId', authenticateToken, deleteEventImage);

export default router;
