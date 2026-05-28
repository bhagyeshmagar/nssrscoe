import { db } from '../db';
import { auditLogs } from '../db/schema';

interface AuditPayload {
    action: string;         // 'volunteer.create', 'academic_year.lock', etc.
    entityType: string;     // 'volunteer', 'academic_year', etc.
    entityId?: number;
    performedById?: number;
    performedByRole?: 'admin' | 'volunteer';
    academicYearId?: number;
    details?: Record<string, unknown>;
}

/** Fire-and-forget audit log writer. Never throws — audit failures must not
 *  interrupt the primary operation. */
export const logAudit = async (payload: AuditPayload): Promise<void> => {
    try {
        await db.insert(auditLogs).values({
            action: payload.action,
            entityType: payload.entityType,
            entityId: payload.entityId,
            performedById: payload.performedById,
            performedByRole: payload.performedByRole ?? 'admin',
            academicYearId: payload.academicYearId,
            details: payload.details ? JSON.stringify(payload.details) : undefined,
        });
    } catch (err) {
        console.error('[AuditLog] Failed to write audit log:', err);
    }
};

// ── Convenience wrappers ──────────────────────────────────────────────────────

export const auditVolunteerCreate = (
    volunteerId: number,
    adminId: number,
    ayId: number,
    name: string,
) => logAudit({
    action: 'volunteer.create',
    entityType: 'volunteer',
    entityId: volunteerId,
    performedById: adminId,
    academicYearId: ayId,
    details: { name },
});

export const auditAYLock = (ayId: number, adminId: number, label: string) =>
    logAudit({
        action: 'academic_year.lock',
        entityType: 'academic_year',
        entityId: ayId,
        performedById: adminId,
        academicYearId: ayId,
        details: { label },
    });

export const auditAYArchive = (ayId: number, adminId: number, label: string) =>
    logAudit({
        action: 'academic_year.archive',
        entityType: 'academic_year',
        entityId: ayId,
        performedById: adminId,
        academicYearId: ayId,
        details: { label },
    });

export const auditCampFinalize = (campId: number, adminId: number, ayId: number) =>
    logAudit({
        action: 'special_camp.finalize',
        entityType: 'special_camp',
        entityId: campId,
        performedById: adminId,
        academicYearId: ayId,
    });
