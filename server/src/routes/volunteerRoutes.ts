import { Router } from 'express';
import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { requireAYUnlocked } from '../middleware/ayLock';
import * as volCtrl from '../controllers/volunteerController';

// Rich-text routes (profile with experience field, bulk import CSV) need more than the global 50kb limit
const richTextJson = express.json({ limit: '200kb' });


const router = Router();

// ── AY-scoped admin routes ─────────────────────────────────────────────────────
// Mounted under /api/academic-years/:ayId/volunteers (see index.ts)

export const ayVolunteerRouter = Router({ mergeParams: true });

ayVolunteerRouter.get(
    '/',
    authenticateToken, requireAdmin,
    volCtrl.listVolunteersByAY,
);

ayVolunteerRouter.post(
    '/',
    authenticateToken, requireAdmin, requireAYUnlocked,
    volCtrl.createVolunteer,
);

ayVolunteerRouter.post(
    '/import',
    authenticateToken, requireAdmin, requireAYUnlocked,
    volCtrl.importVolunteers,
);

ayVolunteerRouter.get(
    '/:id',
    authenticateToken, requireAdmin,
    volCtrl.getVolunteer,
);

ayVolunteerRouter.put(
    '/:id',
    authenticateToken, requireAdmin, requireAYUnlocked,
    volCtrl.updateVolunteer,
);

ayVolunteerRouter.delete(
    '/:id',
    authenticateToken, requireAdmin, requireAYUnlocked,
    volCtrl.deleteVolunteer,
);

ayVolunteerRouter.patch(
    '/:id/status',
    authenticateToken, requireAdmin, requireAYUnlocked,
    volCtrl.changeVolunteerStatus,
);

ayVolunteerRouter.patch(
    '/:id/toggle-active',
    authenticateToken, requireAdmin, requireAYUnlocked,
    volCtrl.toggleVolunteerActive,
);

ayVolunteerRouter.patch(
    '/:id/approve-experience',
    authenticateToken, requireAdmin, requireAYUnlocked,
    volCtrl.approveVolunteerExperience,
);

// ── Volunteer self-service (flat routes under /api/volunteers) ─────────────────
// Mounted at /api/volunteers

router.get('/me',           authenticateToken, volCtrl.getMyProfile);
router.get('/me/attendance', authenticateToken, volCtrl.getMyAttendance);
router.put('/me/profile',   richTextJson, authenticateToken, volCtrl.updateMyProfile);
router.put('/me/password',  authenticateToken, volCtrl.updateMyPassword);

router.get('/public',       authenticateToken, volCtrl.getPublicVolunteers);
router.get('/experiences',  volCtrl.getExperiences);

export default router;
