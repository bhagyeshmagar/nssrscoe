import { db } from '../db';
import { auditLogs } from '../db/schema';

type LogActionParams = {
    adminId?: number | null;
    volunteerId?: number | null;
    performedById?: number | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    performedByRole?: string;
    academicYearId?: number | null;
    details?: any;
};

export const logAudit = async (params: LogActionParams) => {
    try {
        await db.insert(auditLogs).values({
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            performedById: params.adminId || params.volunteerId || params.performedById,
            performedByRole: params.performedByRole || 'admin',
            academicYearId: params.academicYearId,
            details: params.details ? JSON.stringify(params.details) : null,
        });
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
};

export const auditAYLock = (ayId: number, adminId: number, label: string) => logAudit({ action: 'LOCK_AY', entityType: 'AcademicYear', entityId: ayId, adminId, academicYearId: ayId, details: { label } });
export const auditAYArchive = (ayId: number, adminId: number, label: string) => logAudit({ action: 'ARCHIVE_AY', entityType: 'AcademicYear', entityId: ayId, adminId, academicYearId: ayId, details: { label } });
export const auditCampFinalize = (campId: number, adminId: number, ayId: number) => logAudit({ action: 'FINALIZE_CAMP', entityType: 'SpecialCamp', entityId: campId, adminId, academicYearId: ayId });
export const auditVolunteerCreate = (volunteerId: number, adminId: number, ayId: number, name: string) => logAudit({ action: 'CREATE_VOLUNTEER', entityType: 'Volunteer', entityId: volunteerId, adminId, academicYearId: ayId, details: { name } });
