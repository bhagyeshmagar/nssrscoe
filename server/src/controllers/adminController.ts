import { Request, Response } from 'express';
import { db } from '../db';
import { admins } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ok, created, handleError } from '../lib/response';
import bcrypt from 'bcryptjs';

export const getAdmins = async (req: Request, res: Response) => {
    try {
        const data = await db.select({
            id: admins.id,
            username: admins.username,
            isSuperadmin: admins.isSuperadmin,
            createdAt: admins.createdAt
        }).from(admins);
        ok(res, data);
    } catch (err) { handleError(res, err); }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).user.id;
        const [admin] = await db.select({
            id: admins.id,
            username: admins.username,
            isSuperadmin: admins.isSuperadmin,
            createdAt: admins.createdAt
        }).from(admins).where(eq(admins.id, adminId)).limit(1);
        
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found.' });
        }
        ok(res, admin);
    } catch (err) { handleError(res, err); }
};

export const updateMe = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).user.id;
        const { username, password } = req.body;
        
        if (password && password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }
        
        const updateData: any = { username };
        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }
        
        const [updatedAdmin] = await db.update(admins).set(updateData)
            .where(eq(admins.id, adminId))
            .returning({
                id: admins.id,
                username: admins.username,
                isSuperadmin: admins.isSuperadmin
            });
            
        ok(res, updatedAdmin, 'Profile updated.');
    } catch (err) { handleError(res, err); }
};

export const createAdmin = async (req: Request, res: Response) => {
    try {
        const { username, password, isSuperadmin } = req.body;
        
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        const [newAdmin] = await db.insert(admins).values({
            username,
            passwordHash,
            isSuperadmin: isSuperadmin || false
        }).returning({
            id: admins.id,
            username: admins.username,
            isSuperadmin: admins.isSuperadmin
        });
        
        created(res, newAdmin, 'Admin created successfully.');
    } catch (err) { handleError(res, err); }
};

export const updateAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.params.id);
        const { username, password, isSuperadmin } = req.body;
        
        if (password && password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }
        
        try {
            const updatedAdmin = await db.transaction(async (tx) => {
                if (isSuperadmin === false) {
                    const [adminToUpdate] = await tx.select().from(admins).where(eq(admins.id, adminId)).limit(1).for('update');
                    if (adminToUpdate?.isSuperadmin) {
                        const superadmins = await tx.select().from(admins).where(eq(admins.isSuperadmin, true)).for('update');
                        if (superadmins.length <= 1) {
                            throw new Error('Cannot demote the last superadmin account.');
                        }
                    }
                }
                
                const updateData: any = { username, isSuperadmin };
                if (password) {
                    updateData.passwordHash = await bcrypt.hash(password, 10);
                }
                
                const [updated] = await tx.update(admins).set(updateData)
                    .where(eq(admins.id, adminId))
                    .returning({
                        id: admins.id,
                        username: admins.username,
                        isSuperadmin: admins.isSuperadmin
                    });
                return updated;
            });
            ok(res, updatedAdmin, 'Admin updated.');
        } catch (txErr: any) {
            return res.status(400).json({ success: false, message: txErr.message || 'Transaction failed.' });
        }
    } catch (err) { handleError(res, err); }
};

export const deleteAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.params.id);
        const currentAdminId = (req as any).user?.id;
        
        if (adminId === currentAdminId) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account while logged in.' });
        }

        try {
            await db.transaction(async (tx) => {
                const [adminToDelete] = await tx.select().from(admins).where(eq(admins.id, adminId)).limit(1).for('update');
                if (adminToDelete?.isSuperadmin) {
                    const superadmins = await tx.select().from(admins).where(eq(admins.isSuperadmin, true)).for('update');
                    if (superadmins.length <= 1) {
                        throw new Error('Cannot delete the last superadmin account.');
                    }
                }
                await tx.delete(admins).where(eq(admins.id, adminId));
            });
            ok(res, null, 'Admin deleted.');
        } catch (txErr: any) {
            return res.status(400).json({ success: false, message: txErr.message || 'Transaction failed.' });
        }
    } catch (err) { handleError(res, err); }
};
