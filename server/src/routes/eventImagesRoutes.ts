import { Router } from 'express';
import {
    getEventImages,
    addEventImages,
    setMasterImage,
    deleteEventImage,
    updateEventImage,
} from '../controllers/eventImagesController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { addEventImagesSchema, updateEventImageSchema } from '../lib/schemas/index';

const router = Router();

// Public: anyone can view event images
router.get('/:eventId', getEventImages);

// Admin-only mutations
router.post('/:eventId',
    authenticateToken, requireAdmin,
    validateRequest(addEventImagesSchema),
    addEventImages,
);
router.put('/:eventId/master/:imageId',
    authenticateToken, requireAdmin,
    setMasterImage,
);
router.put('/:imageId',
    authenticateToken, requireAdmin,
    validateRequest(updateEventImageSchema),
    updateEventImage,
);
router.delete('/:imageId',
    authenticateToken, requireAdmin,
    deleteEventImage,
);

export default router;
