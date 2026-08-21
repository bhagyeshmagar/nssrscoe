import { db } from '../db';
import { auditLogs } from '../db/schema';
import type { MsSqlTransaction } from 'drizzle-orm/mssql-core';
import type { NodeMsSqlQueryResultHKT, NodeMsSqlPreparedQueryHKT } from 'drizzle-orm/node-mssql';

// Covers both the top-level `db` and any transaction object from db.transaction().
// The 4th generic matches what Drizzle infers: ExtractTablesWithRelations<Record<string, never>>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = typeof db | MsSqlTransaction<NodeMsSqlQueryResultHKT, NodeMsSqlPreparedQueryHKT, Record<string, never>, any>;

type LogActionParams = {
    adminId?: number | null;
    volunteerId?: number | null;
    performedById?: number | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    performedByRole?: string;
    academicYearId?: number | null;
    details?: Record<string, unknown>;
};

export const logAudit = async (params: LogActionParams, tx: Db = db) => {
    try {
        await tx.insert(auditLogs).values({
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

export const auditAYLock = (ayId: number, adminId: number, label: string, tx: Db = db) => logAudit({ action: 'academic_year.lock', entityType: 'academic_year', entityId: ayId, adminId, academicYearId: ayId, details: { label } }, tx);
export const auditAYArchive = (ayId: number, adminId: number, label: string, tx: Db = db) => logAudit({ action: 'academic_year.archive', entityType: 'academic_year', entityId: ayId, adminId, academicYearId: ayId, details: { label } }, tx);
export const auditCampFinalize = (campId: number, adminId: number, ayId: number, tx: Db = db) => logAudit({ action: 'special_camp.finalize', entityType: 'special_camp', entityId: campId, adminId, academicYearId: ayId }, tx);
export const auditVolunteerCreate = (volunteerId: number, adminId: number, ayId: number, name: string, tx: Db = db) => logAudit({ action: 'volunteer.create', entityType: 'volunteer', entityId: volunteerId, adminId, academicYearId: ayId, details: { name } }, tx);
