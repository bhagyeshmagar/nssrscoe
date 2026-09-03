import { Request, Response } from 'express';
import { db } from '../db';
import { admins, volunteers } from '../db/schema';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';

interface JwtPayload {
    id: number;
    role: 'admin' | 'superadmin' | 'volunteer';
    isSuperadmin?: boolean;
    username?: string;
    email?: string;
}

// Unified login for both admin and volunteer
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
        // Check admin table first (admins log in with their username)
        const [admin] = await db.select().top(1).from(admins)
            .where(eq(admins.username, normalizedEmail));

        if (admin) {
            const validPassword = await bcrypt.compare(password, admin.passwordHash);
            if (validPassword) {
                const role = admin.isSuperadmin ? 'superadmin' : 'admin';
                const token = jwt.sign(
                    { id: admin.id, username: admin.username, role, isSuperadmin: !!admin.isSuperadmin },
                    process.env.JWT_SECRET as string,
                    { expiresIn: '1d' }
                );
                return res.json({
                    success: true,
                    data: {
                        token,
                        role,
                        isSuperadmin: !!admin.isSuperadmin,
                        user: { id: admin.id, username: admin.username, isSuperadmin: !!admin.isSuperadmin },
                    }
                });
            }
        }

        // Check volunteer table
        const [volunteer] = await db.select().top(1).from(volunteers)
            .where(eq(volunteers.email, normalizedEmail));

        if (volunteer) {
            if (!volunteer.isActive) {
                return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact admin.' });
            }

            const validPassword = await bcrypt.compare(password, volunteer.passwordHash);
            if (validPassword) {
                const token = jwt.sign(
                    { id: volunteer.id, email: volunteer.email, role: 'volunteer' },
                    process.env.JWT_SECRET as string,
                    { expiresIn: '1d' }
                );
                return res.json({
                    success: true,
                    data: {
                        token,
                        role: 'volunteer',
                        user: { id: volunteer.id, name: volunteer.name, email: volunteer.email },
                    }
                });
            }
        }

        // Generic message to avoid username enumeration
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    } catch (error) {
        console.error('[login] Error:', error);
        return res.status(500).json({ success: false, message: 'An error occurred during authentication.' });
    }
};

// Verify current token and return user info
export const verifyToken = async (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        return res.json({
            success: true,
            data: {
                valid: true,
                role: decoded.role,
                isSuperadmin: decoded.isSuperadmin,
                user: {
                    id: decoded.id,
                    username: decoded.username,
                    email: decoded.email,
                    isSuperadmin: decoded.isSuperadmin,
                },
            }
        });
    } catch {
        return res.status(401).json({ valid: false, success: false, message: 'Token is invalid or expired.' });
    }
};
