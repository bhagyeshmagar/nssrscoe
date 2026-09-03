import { Request, Response } from 'express';
import { db } from '../db';
import { admins } from '../db/schema';
import { eq, ne, sql } from 'drizzle-orm';
import { ok, created, handleError } from '../lib/response';
import { AuthRequest, getAdminId } from '../middleware/auth';
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors';
import { positiveIntParam } from '../lib/schemas';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const MIN_PASSWORD_LENGTH = 8;

const updateMeSchema = z.object({
    username: z.string().trim().min(1, 'Username is required.'),
    password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`).optional(),
});

export const getAdmins = async (req: Request, res: Response) => {
    try {
        const data = await db.select({
            id: admins.id,
            username: admins.username,
            isSuperadmin: admins.isSuperadmin,
            createdAt: admins.createdAt,
        }).from(admins);
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const [admin] = await db.select({
            id: admins.id,
            username: admins.username,
            isSuperadmin: admins.isSuperadmin,
            createdAt: admins.createdAt,
        }).top(1).from(admins).where(eq(admins.id, adminId));

        if (!admin) throw new NotFoundError('Admin not found.');
        ok(res, admin);
    } catch (err) { handleError(res, err); }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = getAdminId(req);
        const parsed = updateMeSchema.parse(req.body);
        const { username, password } = parsed;
        const cleanUsername = username;

        // Enforce username uniqueness
        const [dup] = await db
            .select({ id: admins.id })
            .top(1).from(admins)
            .where(eq(admins.username, cleanUsername));
        if (dup && dup.id !== adminId) {
            throw new ConflictError(`Username "${cleanUsername}" is already taken.`);
        }



        const updateData: Partial<typeof admins.$inferInsert> = { username: cleanUsername };
        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 12);
        }

        const [updatedAdmin] = await db.update(admins).set(updateData)
            .where(eq(admins.id, adminId))
            .output();

        ok(res, updatedAdmin, 'Profile updated.');
    } catch (err) { handleError(res, err); }
};

export const createAdmin = async (req: Request, res: Response) => {
    try {
        const { username, password, isSuperadmin } = req.body;

        if (!username || typeof username !== 'string' || !username.trim()) {
            throw new ValidationError('Username is required.');
        }
        if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
            throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        }

        // Username uniqueness check
        const [dup] = await db.select({ id: admins.id }).top(1).from(admins).where(eq(admins.username, username.trim()));
        if (dup) throw new ConflictError(`Username "${username.trim()}" is already taken.`);

        const passwordHash = await bcrypt.hash(password, 12);

        const [newAdmin] = await db.insert(admins).output().values({
            username: username.trim(),
            passwordHash,
            isSuperadmin: !!isSuperadmin,
        });

        created(res, { id: newAdmin.id, username: newAdmin.username, isSuperadmin: newAdmin.isSuperadmin, createdAt: newAdmin.createdAt }, 'Admin created successfully.');
    } catch (err) { handleError(res, err); }
};

export const updateAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = positiveIntParam.parse(req.params.id);
        const { username, password, isSuperadmin } = req.body;
        const currentAdminId = getAdminId(req);

        if (adminId === currentAdminId && isSuperadmin === false) {
            throw new ConflictError('You cannot demote your own account while logged in.');
        }

        if (password !== undefined) {
            if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
                throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
            }
        }

        if (username !== undefined) {
            if (typeof username !== 'string' || !username.trim()) {
                throw new ValidationError('Username cannot be empty.');
            }
            // Uniqueness check across other admins
            const [dup] = await db.select({ id: admins.id }).top(1).from(admins)
                .where(eq(admins.username, username.trim()));
            if (dup && dup.id !== adminId) {
                throw new ConflictError(`Username "${username.trim()}" is already taken.`);
            }
        }

        const updatedAdmin = await db.transaction(async (tx) => {
            if (isSuperadmin === false) {
                const [adminToUpdate] = await tx.select().top(1).from(admins).where(eq(admins.id, adminId));
                if (!adminToUpdate) throw new NotFoundError('Admin not found.');
                if (adminToUpdate.isSuperadmin) {
                    await tx.execute(sql`EXEC sp_getapplock @Resource = 'ADMIN_SUPERADMIN_COUNT', @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 5000`);
                    const superadmins = await tx.select().from(admins).where(eq(admins.isSuperadmin, true));
                    if (superadmins.length <= 1) {
                        throw new ValidationError('Cannot demote the last superadmin account.');
                    }
                }
            }

            const updateData: Partial<typeof admins.$inferInsert> = {};
            if (username !== undefined) updateData.username = username.trim();
            if (isSuperadmin !== undefined) updateData.isSuperadmin = !!isSuperadmin;
            if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

            const [updated] = await tx.update(admins).set(updateData)
                .where(eq(admins.id, adminId))
                .output();
            return updated;
        });
        ok(res, updatedAdmin, 'Admin updated.');
    } catch (err) { handleError(res, err); }
};

export const deleteAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = positiveIntParam.parse(req.params.id);
        const currentAdminId = getAdminId(req);

        if (adminId === currentAdminId) {
            throw new ConflictError('You cannot delete your own account while logged in.');
        }

        await db.transaction(async (tx) => {
            const [adminToDelete] = await tx.select().top(1).from(admins).where(eq(admins.id, adminId));
            if (!adminToDelete) throw new NotFoundError('Admin not found.');
            if (adminToDelete.isSuperadmin) {
                await tx.execute(sql`EXEC sp_getapplock @Resource = 'ADMIN_SUPERADMIN_COUNT', @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 5000`);
                const superadmins = await tx.select().from(admins).where(eq(admins.isSuperadmin, true));
                if (superadmins.length <= 1) {
                    throw new ValidationError('Cannot delete the last superadmin account.');
                }
            }
            await tx.delete(admins).where(eq(admins.id, adminId));
        });
        ok(res, null, 'Admin deleted.');
    } catch (err) { handleError(res, err); }
};
