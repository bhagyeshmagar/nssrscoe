/**
 * AY Lock Middleware
 *
 * requireAYUnlocked — blocks all writes when the target AY is locked.
 * requireAYNotArchived — blocks writes to archived AYs.
 * requireCurrentAY — restricts to the currently active AY only.
 *
 * Resolution priority for AY id:
 *   1. req.params.ayId
 *   2. req.params.academicYearId
 *   3. req.body.academicYearId
 *   4. req.query.academicYearId
 */
import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { academicYears } from '../db/schema';

type AYRow = { isLocked: boolean; isArchived: boolean; isCurrent: boolean; label: string };

const resolveAYId = (req: Request): number | null => {
    const raw =
        req.params.ayId ??
        req.params.academicYearId ??
        req.body?.academicYearId ??
        req.query?.academicYearId;
    if (!raw) return null;
    const id = parseInt(String(raw), 10);
    return isNaN(id) ? null : id;
};

const fetchAY = async (id: number): Promise<AYRow | null> => {
    const [row] = await db
        .select({
            isLocked: academicYears.isLocked,
            isArchived: academicYears.isArchived,
            isCurrent: academicYears.isCurrent,
            label: academicYears.label,
        })
        .from(academicYears)
        .where(eq(academicYears.id, id))
        .limit(1);
    return row ?? null;
};

/** Blocks write routes when the AY is locked. Read routes pass through. */
export const requireAYUnlocked = async (
    req: Request, res: Response, next: NextFunction,
): Promise<void> => {
    const ayId = resolveAYId(req);
    if (!ayId) {
        res.status(400).json({ success: false, code: 'MISSING_AY_ID', message: 'Academic year identifier is required.' });
        return;
    }
    try {
        const ay = await fetchAY(ayId);
        if (!ay) {
            res.status(404).json({ success: false, code: 'NOT_FOUND', message: `Academic year ${ayId} not found.` });
            return;
        }
        if (ay.isLocked) {
            res.status(403).json({ success: false, code: 'AY_LOCKED', message: `Academic year "${ay.label}" is locked and cannot be modified.` });
            return;
        }
        next();
    } catch (err) {
        console.error('requireAYUnlocked error:', err);
        res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Server error checking AY lock status.' });
    }
};

/** Blocks writes when the AY is archived. */
export const requireAYNotArchived = async (
    req: Request, res: Response, next: NextFunction,
): Promise<void> => {
    const ayId = resolveAYId(req);
    if (!ayId) {
        res.status(400).json({ success: false, code: 'MISSING_AY_ID', message: 'Academic year identifier is required.' });
        return;
    }
    try {
        const ay = await fetchAY(ayId);
        if (!ay) {
            res.status(404).json({ success: false, code: 'NOT_FOUND', message: `Academic year ${ayId} not found.` });
            return;
        }
        if (ay.isArchived) {
            res.status(403).json({ success: false, code: 'AY_ARCHIVED', message: `Academic year "${ay.label}" is archived.` });
            return;
        }
        next();
    } catch (err) {
        console.error('requireAYNotArchived error:', err);
        res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Server error checking AY archive status.' });
    }
};

/** Restricts to the currently active AY only. */
export const requireCurrentAY = async (
    req: Request, res: Response, next: NextFunction,
): Promise<void> => {
    const ayId = resolveAYId(req);
    if (!ayId) {
        res.status(400).json({ success: false, code: 'MISSING_AY_ID', message: 'Academic year identifier is required.' });
        return;
    }
    try {
        const ay = await fetchAY(ayId);
        if (!ay) {
            res.status(404).json({ success: false, code: 'NOT_FOUND', message: `Academic year ${ayId} not found.` });
            return;
        }
        if (!ay.isCurrent) {
            res.status(403).json({ success: false, code: 'AY_NOT_CURRENT', message: `Academic year "${ay.label}" is not the active year. Switch to the current AY to perform this action.` });
            return;
        }
        next();
    } catch (err) {
        console.error('requireCurrentAY error:', err);
        res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Server error checking AY status.' });
    }
};
