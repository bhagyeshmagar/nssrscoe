import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { admins, volunteers, academicYears } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../lib/errors';

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

    jwt.verify(token, process.env.JWT_SECRET as string, (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
        if (err) return res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
        (req as AuthRequest).user = decoded as AuthRequest['user'];
        next();
    });
};
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return next();

    jwt.verify(token, process.env.JWT_SECRET as string, (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
        if (!err && decoded) {
            (req as AuthRequest).user = decoded as AuthRequest['user'];
        }
        next();
    });
};

// Middleware to check if user is admin
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || (authReq.user.role !== 'admin' && authReq.user.role !== 'superadmin')) {
        return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Admin access required.' });
    }
    try {
        const [admin] = await db.select().top(1).from(admins).where(eq(admins.id, authReq.user.id));
        if (!admin) {
            return res.status(403).json({ success: false, message: 'Admin account no longer exists.' });
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
        const [admin] = await db.select().top(1).from(admins).where(eq(admins.id, authReq.user.id));
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
        return res.status(403).json({ success: false, message: 'Volunteer access required.' });
    }
    
    try {
        // Join academicYears so we can enforce AY-level access in one query.
        // This prevents a volunteer from continuing to use the portal for up to
        // 24 hours (JWT lifetime) after their AY is locked or archived.
        const [row] = await db
            .select({
                volunteer: volunteers,
                ay: { isLocked: academicYears.isLocked, isArchived: academicYears.isArchived },
            })
            .from(volunteers)
            .innerJoin(academicYears, eq(volunteers.academicYearId, academicYears.id))
            .where(eq(volunteers.id, authReq.user.id));
        // id is the primary key — at most one row returned, no .top() needed

        if (!row || !row.volunteer.isActive) {
            return res.status(403).json({ success: false, message: 'Volunteer account no longer exists or is inactive.' });
        }
        if (row.ay.isArchived) {
            return res.status(403).json({ success: false, message: 'Your academic year has been archived. Access to the volunteer portal is no longer available for this year.' });
        }
        if (row.ay.isLocked) {
            return res.status(403).json({ success: false, message: 'Your academic year is locked. Please contact your admin if you need access.' });
        }

        next();
    } catch (err) {
        console.error('[requireVolunteer] Error:', err);
        return res.status(500).json({ success: false, message: 'Error verifying volunteer permissions.' });
    }
};

export const getAdminId = (req: Request): number => {
    const user = (req as AuthRequest).user;
    if (!user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    return user.id;
};
