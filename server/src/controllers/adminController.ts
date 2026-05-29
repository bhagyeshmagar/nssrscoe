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
        
        const updateData: any = { username, isSuperadmin };
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
            
        ok(res, updatedAdmin, 'Admin updated.');
    } catch (err) { handleError(res, err); }
};

export const deleteAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = Number(req.params.id);
        
        // Prevent deleting yourself (could add logic here if we know req.user.id)
        await db.delete(admins).where(eq(admins.id, adminId));
        ok(res, null, 'Admin deleted.');
    } catch (err) { handleError(res, err); }
};
