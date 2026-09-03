import { Response, Request } from 'express';
import { db } from '../db';
import { innovativeIdeas, volunteers, volunteerProfiles } from '../db/schema';
import { eq, desc, asc, sql, and, isNull } from 'drizzle-orm';
import { ok, handleError } from '../lib/response';
import { ValidationError, AppError } from '../lib/errors';
import { z } from 'zod';
import { AuthRequest, getAdminId } from '../middleware/auth';
import { positiveIntParam } from '../lib/schemas';
import { deleteUploadedFile } from '../lib/fileUtils';

// Admin: Get all innovative ideas with filters
export const getAllIdeas = async (req: Request, res: Response) => {
    try {
        const { search, category, status, ayId, sort } = req.query;

        let query = db.select({
            id: innovativeIdeas.id,
            title: innovativeIdeas.title,
            description: innovativeIdeas.description,
            category: innovativeIdeas.category,
            article: innovativeIdeas.article,
            methodology: innovativeIdeas.methodology,
            benefits: innovativeIdeas.benefits,
            supportingDocumentUrl: innovativeIdeas.supportingDocumentUrl,
            status: innovativeIdeas.status,
            rejectionReason: innovativeIdeas.rejectionReason,
            deleteRequested: innovativeIdeas.deleteRequested,
            pendingUpdateData: innovativeIdeas.pendingUpdateData,
            createdAt: innovativeIdeas.createdAt,
            updatedAt: innovativeIdeas.updatedAt,
            updatedById: innovativeIdeas.updatedById,
            deletedAt: innovativeIdeas.deletedAt,
            deletedById: innovativeIdeas.deletedById,
            volunteerName: volunteers.name,
            academicYearLabel: sql<string>`ay.label`,
            department: volunteerProfiles.department,
            collegeYearAtEnrollment: volunteerProfiles.collegeYearAtEnrollment,
        })
        .from(innovativeIdeas)
        .innerJoin(volunteers, eq(innovativeIdeas.volunteerId, volunteers.id))
        .innerJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
        .innerJoin(sql`academic_years ay`, eq(volunteers.academicYearId, sql`ay.id`))
        .$dynamic();

        const conditions: any[] = [];

        if (search) {
            const safeSearch = String(search).replace(/[%_\[]/g, (m) => `[${m}]`);
            conditions.push(sql`${innovativeIdeas.title} LIKE ${`%${safeSearch}%`} OR ${innovativeIdeas.description} LIKE ${`%${safeSearch}%`}`);
        }

        if (category) {
            conditions.push(eq(innovativeIdeas.category, String(category)));
        }

        if (status) {
            conditions.push(eq(innovativeIdeas.status, String(status)));
        }

        if (ayId) {
            conditions.push(eq(volunteers.academicYearId, positiveIntParam.parse(ayId)));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        // Sort options
        if (sort === 'oldest') {
            query = query.orderBy(asc(innovativeIdeas.createdAt));
        } else if (sort === 'a-z') {
            query = query.orderBy(asc(innovativeIdeas.title));
        } else if (sort === 'z-a') {
            query = query.orderBy(desc(innovativeIdeas.title));
        } else {
            query = query.orderBy(desc(innovativeIdeas.createdAt));
        }

        const ideas = await query;
        ok(res, ideas);
    } catch (err) {
        handleError(res, err);
    }
};

const approvalSchema = z.object({
    approveType: z.enum(['idea', 'update', 'delete']),
});

// Admin: Approve Idea, Update Request, or Delete Request
export const approveIdea = async (req: AuthRequest, res: Response) => {
    try {
        const ideaId = positiveIntParam.parse(req.params.id);
        
        const data = approvalSchema.parse(req.body);

        const [existing] = await db.select().from(innovativeIdeas).where(and(eq(innovativeIdeas.id, ideaId), isNull(innovativeIdeas.deletedAt)));
        if (!existing) throw new AppError('Idea not found', 404, 'NOT_FOUND');

        const adminId = getAdminId(req);

        if (data.approveType === 'delete') {
            // Soft delete the idea
            await db.update(innovativeIdeas).set({
                deletedAt: new Date(),
                deletedById: adminId
            }).where(eq(innovativeIdeas.id, ideaId));
            
            // Delete the file. Note: if undeleted later, the document will be missing.
            if (existing.supportingDocumentUrl) {
                await deleteUploadedFile(existing.supportingDocumentUrl);
            }
            return ok(res, null, 'Deletion request approved. Idea removed.');
        }

        if (data.approveType === 'update') {
            // Apply pending update data
            if (!existing.pendingUpdateData) {
                throw new ValidationError('No pending update data found');
            }
            
            let updatePayload;
            try {
                updatePayload = JSON.parse(existing.pendingUpdateData);
            } catch {
                throw new AppError('Pending update data is corrupted', 500, 'CORRUPT_DATA');
            }
            
            await db.update(innovativeIdeas).set({
                ...updatePayload,
                pendingUpdateData: null,
                updatedAt: sql`getdate()`,
                updatedById: adminId,
                approvedById: adminId,
            }).where(eq(innovativeIdeas.id, ideaId));
            
            const [updated] = await db.select().from(innovativeIdeas).where(eq(innovativeIdeas.id, ideaId));
            return ok(res, updated, 'Update request approved.');
        }

        // Default: approve the idea itself
        await db.update(innovativeIdeas).set({
            status: 'approved',
            approvedAt: sql`getdate()`,
            approvedById: adminId,
            rejectionReason: null,
            updatedAt: sql`getdate()`,
        }).where(eq(innovativeIdeas.id, ideaId));
        
        const [updated] = await db.select().from(innovativeIdeas).where(eq(innovativeIdeas.id, ideaId));

        ok(res, updated, 'Idea approved successfully');
    } catch (err) {
        handleError(res, err);
    }
};

const rejectSchema = z.object({
    rejectType: z.enum(['idea', 'update', 'delete']),
    reason: z.string().optional(),
});

// Admin: Reject Idea, Update Request, or Delete Request
export const rejectIdea = async (req: AuthRequest, res: Response) => {
    try {
        const ideaId = positiveIntParam.parse(req.params.id);

        const data = rejectSchema.parse(req.body);

        const [existing] = await db.select().from(innovativeIdeas).where(and(eq(innovativeIdeas.id, ideaId), isNull(innovativeIdeas.deletedAt)));
        if (!existing) throw new AppError('Idea not found', 404, 'NOT_FOUND');

        if (data.rejectType === 'delete') {
            // Cancel delete request
            await db.update(innovativeIdeas).set({
                deleteRequested: false,
                updatedAt: sql`getdate()`,
            }).where(eq(innovativeIdeas.id, ideaId));
            
            const [updated] = await db.select().from(innovativeIdeas).where(eq(innovativeIdeas.id, ideaId));
            return ok(res, updated, 'Deletion request rejected.');
        }

        if (data.rejectType === 'update') {
            // Cancel update request
            await db.update(innovativeIdeas).set({
                pendingUpdateData: null,
                updatedAt: sql`getdate()`,
            }).where(eq(innovativeIdeas.id, ideaId));
            
            const [updated] = await db.select().from(innovativeIdeas).where(eq(innovativeIdeas.id, ideaId));
            return ok(res, updated, 'Update request rejected.');
        }

        // Default: reject the idea itself
        await db.update(innovativeIdeas).set({
            status: 'rejected',
            rejectionReason: data.reason || null,
            updatedAt: sql`getdate()`,
        }).where(eq(innovativeIdeas.id, ideaId));
        
        const [updated] = await db.select().from(innovativeIdeas).where(eq(innovativeIdeas.id, ideaId));

        ok(res, updated, 'Idea rejected successfully');
    } catch (err) {
        handleError(res, err);
    }
};

// Admin: Soft Delete Idea (previously Hard Delete)
export const deleteIdea = async (req: AuthRequest, res: Response) => {
    try {
        const ideaId = positiveIntParam.parse(req.params.id);

        const [existing] = await db.select().from(innovativeIdeas).where(and(eq(innovativeIdeas.id, ideaId), isNull(innovativeIdeas.deletedAt)));
        if (!existing) throw new AppError('Idea not found', 404, 'NOT_FOUND');

        if (existing.status !== 'rejected') {
            throw new ValidationError('Only rejected ideas can be deleted directly. Otherwise, use the approval workflow.');
        }

        const adminId = getAdminId(req);

        await db.update(innovativeIdeas).set({
            deletedAt: new Date(),
            deletedById: adminId
        }).where(eq(innovativeIdeas.id, ideaId));
        
        // Delete the file. Note: if undeleted later, the document will be missing.
        if (existing.supportingDocumentUrl) {
            await deleteUploadedFile(existing.supportingDocumentUrl);
        }
        
        ok(res, null, 'Idea deleted permanently');
    } catch (err) {
        handleError(res, err);
    }
};

export const restoreIdea = async (req: AuthRequest, res: Response) => {
    try {
        const ideaId = positiveIntParam.parse(req.params.id);

        const [existing] = await db.select({ id: innovativeIdeas.id, deletedAt: innovativeIdeas.deletedAt })
            .from(innovativeIdeas)
            .where(eq(innovativeIdeas.id, ideaId));
            
        if (!existing) throw new AppError('Idea not found', 404, 'NOT_FOUND');
        if (!existing.deletedAt) throw new AppError('Idea is not deleted', 400, 'BAD_REQUEST');

        await db.update(innovativeIdeas).set({
            deletedAt: null,
            deletedById: null,
            updatedAt: new Date(),
            updatedById: getAdminId(req),
        }).where(eq(innovativeIdeas.id, ideaId));
        
        const [updated] = await db.select({
            id: innovativeIdeas.id,
            title: innovativeIdeas.title,
            description: innovativeIdeas.description,
            category: innovativeIdeas.category,
            article: innovativeIdeas.article,
            methodology: innovativeIdeas.methodology,
            benefits: innovativeIdeas.benefits,
            supportingDocumentUrl: innovativeIdeas.supportingDocumentUrl,
            status: innovativeIdeas.status,
            rejectionReason: innovativeIdeas.rejectionReason,
            deleteRequested: innovativeIdeas.deleteRequested,
            pendingUpdateData: innovativeIdeas.pendingUpdateData,
            createdAt: innovativeIdeas.createdAt,
            updatedAt: innovativeIdeas.updatedAt,
            updatedById: innovativeIdeas.updatedById,
            deletedAt: innovativeIdeas.deletedAt,
            deletedById: innovativeIdeas.deletedById,
            volunteerName: volunteers.name,
            academicYearLabel: sql<string>`ay.label`,
            department: volunteerProfiles.department,
            collegeYearAtEnrollment: volunteerProfiles.collegeYearAtEnrollment,
        })
        .from(innovativeIdeas)
        .innerJoin(volunteers, eq(innovativeIdeas.volunteerId, volunteers.id))
        .innerJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
        .innerJoin(sql`academic_years ay`, eq(volunteers.academicYearId, sql`ay.id`))
        .where(eq(innovativeIdeas.id, ideaId));

        ok(res, updated, 'Idea restored successfully');
    } catch (err) {
        handleError(res, err);
    }
};
