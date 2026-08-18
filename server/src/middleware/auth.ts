import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { admins, volunteers } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username?: string;
        email?: string;
        role: 'admin' | 'volunteer' | 'superadmin';
        isSuperadmin?: boolean;
    };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ success: false, message: 'No authentication token provided.' });

    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
        if (err) return res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
        (req as AuthRequest).user = user;
        next();
    });
};

// Middleware to check if user is admin
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || (authReq.user.role !== 'admin' && authReq.user.role !== 'superadmin')) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    try {
        const [admin] = await db.select().from(admins).where(eq(admins.id, authReq.user.id)).limit(1);
        if (!admin) {
            return res.status(403).json({ message: 'Admin account no longer exists' });
        }
        
        // Ensure the role and isSuperadmin on the request object matches the fresh DB state,
        // so downstream controllers don't trust a stale JWT claim.
        authReq.user.role = admin.isSuperadmin ? 'superadmin' : 'admin';
        authReq.user.isSuperadmin = admin.isSuperadmin;
        
        next();
    } catch (err) {
        console.error('[requireAdmin] Error:', err);
        return res.status(500).json({ success: false, message: 'Error verifying admin permissions' });
    }
};

// Middleware to check if user is a superadmin
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || (authReq.user.role !== 'admin' && authReq.user.role !== 'superadmin')) {
        return res.status(403).json({ success: false, message: 'Superadmin access required' });
    }
    try {
        const [admin] = await db.select().from(admins).where(eq(admins.id, authReq.user.id)).limit(1);
        if (!admin || !admin.isSuperadmin) {
            return res.status(403).json({ success: false, message: 'Superadmin access required' });
        }
        next();
    } catch (err) {
        console.error('[requireSuperAdmin] Error:', err);
        return res.status(500).json({ success: false, message: 'Error verifying superadmin permissions' });
    }
};

// Middleware to check if user is volunteer
export const requireVolunteer = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || authReq.user.role !== 'volunteer') {
        return res.status(403).json({ success: false, message: 'Volunteer access required' });
    }
    
    try {
        const [volunteer] = await db.select().from(volunteers).where(eq(volunteers.id, authReq.user.id)).limit(1);
        if (!volunteer || !volunteer.isActive) {
            return res.status(403).json({ success: false, message: 'Volunteer account no longer exists or is inactive' });
        }
        next();
    } catch (err) {
        console.error('[requireVolunteer] Error:', err);
        return res.status(500).json({ success: false, message: 'Error verifying volunteer permissions' });
    }
};
