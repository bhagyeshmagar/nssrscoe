import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';
import { innovativeIdeas, volunteers, volunteerProfiles } from '../db/schema';
import { eq, and, desc, asc, sql, isNull } from 'drizzle-orm';
import { ok, created, handleError } from '../lib/response';
import { ValidationError, UnauthorizedError, AppError } from '../lib/errors';
import { z } from 'zod';
import { deleteUploadedFile } from '../lib/fileUtils';
import { positiveIntParam } from '../lib/schemas';

const createIdeaSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required').max(255),
    article: z.string().optional(),
    methodology: z.string().optional(),
    benefits: z.string().optional(),
    supportingDocumentUrl: z.string().optional(),
});

const updateIdeaSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255).optional(),
    description: z.string().min(1, 'Description is required').optional(),
    category: z.string().min(1, 'Category is required').max(255).optional(),
    article: z.string().optional(),
    methodology: z.string().optional(),
    benefits: z.string().optional(),
    supportingDocumentUrl: z.string().optional(),
});

// Volunteer: Submit a new idea
export const submitIdea = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'volunteer') {
            throw new UnauthorizedError('Only volunteers can submit innovative ideas');
        }

        const data = createIdeaSchema.parse(req.body);

        const [inserted] = await db.insert(innovativeIdeas).output({ id: innovativeIdeas.id }).values({
            volunteerId: req.user.id,
            title: data.title,
            description: data.description,
            category: data.category,
            article: data.article,
            methodology: data.methodology,
            benefits: data.benefits,
            supportingDocumentUrl: data.supportingDocumentUrl,
            status: 'pending',
        });
        
        const [createdIdea] = await db.select().from(innovativeIdeas).where(eq(innovativeIdeas.id, inserted.id));

        created(res, createdIdea, 'Innovative idea submitted successfully');
    } catch (err) {
        handleError(res, err);
    }
};

// Volunteer: Get my ideas
export const getMyIdeas = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'volunteer') {
            throw new UnauthorizedError('Unauthorized');
        }

        // Note: We deliberately exclude soft-deleted ideas (isNull(deletedAt)) from the volunteer's view.
        // If an admin deletes a volunteer's idea (even an approved one), it simply vanishes from their dashboard
        // to prevent confusion or pushback regarding administrative removals.
        const myIdeas = await db.select()
            .from(innovativeIdeas)
            .where(and(eq(innovativeIdeas.volunteerId, req.user.id), isNull(innovativeIdeas.deletedAt)))
            .orderBy(desc(innovativeIdeas.createdAt));

        ok(res, myIdeas);
    } catch (err) {
        handleError(res, err);
    }
};

// Volunteer: Request update for an idea
export const requestUpdate = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'volunteer') {
            throw new UnauthorizedError('Unauthorized');
        }

        const ideaId = positiveIntParam.parse(req.params.id);

        const data = updateIdeaSchema.parse(req.body);

        const [existing] = await db.select().from(innovativeIdeas).where(and(
            eq(innovativeIdeas.id, ideaId),
            eq(innovativeIdeas.volunteerId, req.user.id),
            isNull(innovativeIdeas.deletedAt)
        ));

        if (!existing) {
            throw new AppError('Innovative idea not found', 404, 'NOT_FOUND');
        }

        if (existing.status !== 'approved') {
            // Pending/rejected ideas can be edited directly; approved ideas require admin review via pendingUpdateData
            await db.update(innovativeIdeas)
                .set({ ...data, status: 'pending' }) // Re-submit for approval if rejected
                .where(eq(innovativeIdeas.id, ideaId));
            
            const [updated] = await db.select().from(innovativeIdeas).where(eq(innovativeIdeas.id, ideaId));
            return ok(res, updated, 'Idea updated successfully');
        }

        // If approved, create a pending update
        const pendingUpdateData = JSON.stringify(data);
        await db.update(innovativeIdeas)
            .set({ pendingUpdateData })
            .where(eq(innovativeIdeas.id, ideaId));
            
        const [updated] = await db.select().from(innovativeIdeas).where(eq(innovativeIdeas.id, ideaId));

        ok(res, updated, 'Update requested successfully. Awaiting admin approval.');
    } catch (err) {
        handleError(res, err);
    }
};

// Volunteer: Request deletion
export const requestDelete = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'volunteer') {
            throw new UnauthorizedError('Unauthorized');
        }

        const ideaId = positiveIntParam.parse(req.params.id);

        const [existing] = await db.select().from(innovativeIdeas).where(and(
            eq(innovativeIdeas.id, ideaId),
            eq(innovativeIdeas.volunteerId, req.user.id),
            isNull(innovativeIdeas.deletedAt)
        ));

        if (!existing) {
            throw new AppError('Innovative idea not found', 404, 'NOT_FOUND');
        }

        if (existing.status !== 'approved') {
            // Note: Self-service deletes of pending/rejected ideas remain HARD deletes.
            // This is intentional: volunteers are not admins, so there is no valid admin ID
            // to place in `deletedById`, and full auditing is primarily for administrative actions.
            await db.delete(innovativeIdeas).where(eq(innovativeIdeas.id, ideaId));
            if (existing.supportingDocumentUrl) {
                await deleteUploadedFile(existing.supportingDocumentUrl);
            }
            return ok(res, null, 'Idea deleted successfully');
        }

        // If approved, set deleteRequested = true
        await db.update(innovativeIdeas)
            .set({ deleteRequested: true })
            .where(eq(innovativeIdeas.id, ideaId));
            
        const [updated] = await db.select().from(innovativeIdeas).where(eq(innovativeIdeas.id, ideaId));

        ok(res, updated, 'Deletion requested. Awaiting admin approval.');
    } catch (err) {
        handleError(res, err);
    }
};

// Public: Get all approved ideas
export const getPublicIdeas = async (req: Request, res: Response) => {
    try {
        const { search, category, ayId, sort } = req.query;

        let baseQuery = db.select({
            id: innovativeIdeas.id,
            title: innovativeIdeas.title,
            description: innovativeIdeas.description,
            category: innovativeIdeas.category,
            article: innovativeIdeas.article,
            methodology: innovativeIdeas.methodology,
            benefits: innovativeIdeas.benefits,
            supportingDocumentUrl: innovativeIdeas.supportingDocumentUrl,
            createdAt: innovativeIdeas.createdAt,
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

        const conditions = [eq(innovativeIdeas.status, 'approved'), isNull(innovativeIdeas.deletedAt)];

        if (search) {
            const safeSearch = String(search).replace(/[%_\[]/g, (m) => `[${m}]`);
            conditions.push(sql`${innovativeIdeas.title} LIKE ${`%${safeSearch}%`} OR ${innovativeIdeas.description} LIKE ${`%${safeSearch}%`}`);
        }

        if (category) {
            conditions.push(eq(innovativeIdeas.category, String(category)));
        }

        if (ayId) {
            conditions.push(eq(volunteers.academicYearId, positiveIntParam.parse(ayId)));
        }

        let query = baseQuery.where(and(...conditions));

        // Default sorting is newest first
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

// Public: Get a single idea by ID
export const getPublicIdea = async (req: Request, res: Response) => {
    try {
        const ideaId = positiveIntParam.parse(req.params.id);

        const [idea] = await db.select({
            id: innovativeIdeas.id,
            title: innovativeIdeas.title,
            description: innovativeIdeas.description,
            category: innovativeIdeas.category,
            article: innovativeIdeas.article,
            methodology: innovativeIdeas.methodology,
            benefits: innovativeIdeas.benefits,
            supportingDocumentUrl: innovativeIdeas.supportingDocumentUrl,
            status: innovativeIdeas.status,
            createdAt: innovativeIdeas.createdAt,
            volunteerName: volunteers.name,
            academicYearLabel: sql<string>`ay.label`,
            department: volunteerProfiles.department,
            collegeYearAtEnrollment: volunteerProfiles.collegeYearAtEnrollment,
        })
        .from(innovativeIdeas)
        .innerJoin(volunteers, eq(innovativeIdeas.volunteerId, volunteers.id))
        .innerJoin(volunteerProfiles, eq(volunteers.id, volunteerProfiles.volunteerId))
        .innerJoin(sql`academic_years ay`, eq(volunteers.academicYearId, sql`ay.id`))
        .where(and(eq(innovativeIdeas.id, ideaId), eq(innovativeIdeas.status, 'approved'), isNull(innovativeIdeas.deletedAt)));

        if (!idea) {
            throw new AppError('Innovative idea not found', 404, 'NOT_FOUND');
        }

        ok(res, idea);
    } catch (err) {
        handleError(res, err);
    }
};
