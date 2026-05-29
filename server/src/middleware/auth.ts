import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
        if (err) return res.sendStatus(401);
        (req as AuthRequest).user = user;
        next();
    });
};

// Middleware to check if user is admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || (authReq.user.role !== 'admin' && authReq.user.role !== 'superadmin')) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Middleware to check if user is a superadmin
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || !authReq.user.isSuperadmin) {
        return res.status(403).json({ message: 'Superadmin access required' });
    }
    next();
};

// Middleware to check if user is volunteer
export const requireVolunteer = (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || authReq.user.role !== 'volunteer') {
        return res.status(403).json({ message: 'Volunteer access required' });
    }
    next();
};
