import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { academicYears } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Middleware: requireAYUnlocked
 *
 * Protects write routes (POST, PUT, PATCH, DELETE) that modify data scoped to
 * an academic year.  Reads the `ayId` from `req.params` (or falls back to
 * `req.body.academicYearId`) and checks whether the AY is locked.
 *
 * Usage (in any router where ayId is a route param):
 *   router.post('/:ayId/volunteers', authenticateToken, requireAdmin, requireAYUnlocked, createVolunteer);
 *
 * Returns 403 if the AY is locked, 404 if the AY does not exist,
 * 400 if no AY identifier can be resolved.
 */
export const requireAYUnlocked = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    // Resolve the AY id from route param or request body
    const rawId = req.params.ayId ?? req.params.academicYearId ?? req.body?.academicYearId;

    if (!rawId) {
        res.status(400).json({ message: 'Academic year identifier is required for this operation.' });
        return;
    }

    const ayId = parseInt(rawId, 10);
    if (isNaN(ayId)) {
        res.status(400).json({ message: 'Academic year identifier must be a number.' });
        return;
    }

    try {
        const [ay] = await db
            .select({ isLocked: academicYears.isLocked, label: academicYears.label })
            .from(academicYears)
            .where(eq(academicYears.id, ayId))
            .limit(1);

        if (!ay) {
            res.status(404).json({ message: `Academic year with id ${ayId} not found.` });
            return;
        }

        if (ay.isLocked) {
            res.status(403).json({
                message: `Academic year "${ay.label}" is locked and cannot be modified.`,
                code: 'AY_LOCKED',
            });
            return;
        }

        next();
    } catch (error) {
        console.error('requireAYUnlocked error:', error);
        res.status(500).json({ message: 'Server error while checking academic year lock status.' });
    }
};

/**
 * Middleware: requireCurrentAY
 *
 * Ensures the targeted AY is the currently active one.
 * Use on routes that should only operate on the active AY
 * (e.g. creating new volunteers, assigning core team).
 *
 * Must be used AFTER requireAYUnlocked (or combine both as needed).
 */
export const requireCurrentAY = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const rawId = req.params.ayId ?? req.params.academicYearId ?? req.body?.academicYearId;

    if (!rawId) {
        res.status(400).json({ message: 'Academic year identifier is required for this operation.' });
        return;
    }

    const ayId = parseInt(rawId, 10);
    if (isNaN(ayId)) {
        res.status(400).json({ message: 'Academic year identifier must be a number.' });
        return;
    }

    try {
        const [ay] = await db
            .select({ isCurrent: academicYears.isCurrent, label: academicYears.label })
            .from(academicYears)
            .where(eq(academicYears.id, ayId))
            .limit(1);

        if (!ay) {
            res.status(404).json({ message: `Academic year with id ${ayId} not found.` });
            return;
        }

        if (!ay.isCurrent) {
            res.status(403).json({
                message: `Academic year "${ay.label}" is not the current active year. Switch to the current AY to perform this action.`,
                code: 'AY_NOT_CURRENT',
            });
            return;
        }

        next();
    } catch (error) {
        console.error('requireCurrentAY error:', error);
        res.status(500).json({ message: 'Server error while checking academic year status.' });
    }
};
