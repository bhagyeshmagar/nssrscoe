import { Router } from 'express';
import express from 'express';
import { authenticateToken, requireAdmin, requireVolunteer } from '../middleware/auth';
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
// Mounted at /api/volunteers.
// requireVolunteer enforces: role === 'volunteer', isActive, AY not locked/archived.

router.get('/me',            authenticateToken, requireVolunteer, volCtrl.getMyProfile);
router.get('/me/attendance', authenticateToken, requireVolunteer, volCtrl.getMyAttendance);
router.put('/me/profile',    richTextJson, authenticateToken, requireVolunteer, volCtrl.updateMyProfile);
router.put('/me/password',   authenticateToken, requireVolunteer, volCtrl.updateMyPassword);

// /public is volunteer-facing (used in the core team dashboard to show peers);
// restrict to volunteers so admins cannot use a volunteer JWT to enumerate profiles.
router.get('/public',        authenticateToken, requireVolunteer, volCtrl.getPublicVolunteers);
router.get('/experiences',   volCtrl.getExperiences); // fully public — no auth needed

export default router;
