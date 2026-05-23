import { Request, Response } from 'express';
import { db } from '../db';
import { coreMembers } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const getMembers = async (req: Request, res: Response) => {
    try {
        const members = await db.select().from(coreMembers).orderBy(desc(coreMembers.createdAt));
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching members', error });
    }
};

export const createMember = async (req: Request, res: Response) => {
    try {
        const newMember = await db.insert(coreMembers).values({
            ...req.body
        }).returning();
        res.json(newMember[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error creating member', error });
    }
};

export const updateMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const updated = await db.update(coreMembers).set(req.body).where(eq(coreMembers.id, Number(id))).returning();
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating member', error });
    }
};

export const deleteMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await db.delete(coreMembers).where(eq(coreMembers.id, Number(id)));
        res.json({ message: 'Member deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting member', error });
    }
};
