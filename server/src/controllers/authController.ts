import { Request, Response } from 'express';
import { db } from '../db';
import { admins, volunteers } from '../db/schema';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';

// Unified login for both admin and volunteer
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // First check admin table (admin can login with username as email)
        const admin = await db.select().from(admins)
            .where(eq(admins.username, email))
            .limit(1);

        if (admin.length > 0) {
            const validPassword = await bcrypt.compare(password, admin[0].passwordHash);
            if (validPassword) {
                const token = jwt.sign(
                    { id: admin[0].id, username: admin[0].username, role: 'admin' },
                    process.env.JWT_SECRET as string,
                    { expiresIn: '1d' }
                );
                return res.json({ token, role: 'admin', user: { id: admin[0].id, username: admin[0].username } });
            }
        }

        // Then check volunteer table
        const volunteer = await db.select().from(volunteers)
            .where(eq(volunteers.email, email))
            .limit(1);

        if (volunteer.length > 0) {
            // Check if volunteer is active
            if (!volunteer[0].isActive) {
                return res.status(403).json({ message: 'Your account has been deactivated. Please contact admin.' });
            }

            const validPassword = await bcrypt.compare(password, volunteer[0].passwordHash);
            if (validPassword) {
                const token = jwt.sign(
                    { id: volunteer[0].id, email: volunteer[0].email, role: 'volunteer' },
                    process.env.JWT_SECRET as string,
                    { expiresIn: '1d' }
                );
                return res.json({
                    token,
                    role: 'volunteer',
                    user: { id: volunteer[0].id, name: volunteer[0].name, email: volunteer[0].email }
                });
            }
        }

        // No valid credentials found
        return res.status(401).json({ message: 'Invalid credentials' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Verify current token and return user info
export const verifyToken = async (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        return res.json({
            valid: true,
            role: decoded.role,
            user: {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email,
            }
        });
    } catch (error) {
        return res.status(401).json({ valid: false, message: 'Invalid token' });
    }
};
