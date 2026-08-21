import { eq } from 'drizzle-orm';
import { db } from '../db';
import { hodContacts } from '../db/schema';
import { NotFoundError } from '../lib/errors';

export const listHods = async () => {
    return db
        .select()
        .from(hodContacts)
        .orderBy(hodContacts.department);
};

export const getHodById = async (id: number) => {
    const [hod] = await db.select().from(hodContacts).where(eq(hodContacts.id, id));
    if (!hod) throw new NotFoundError(`HOD contact ${id} not found.`);
    return hod;
};

export const upsertHod = async (department: string, name: string, email: string) => {
    // Try to update first
    const [updated] = await db
        .update(hodContacts)
        .set({ name, email, updatedAt: new Date() })
        .where(eq(hodContacts.department, department))
        .output();
    
    if (updated) {
        return updated;
    }

    try {
        // If nothing was updated, it means it doesn't exist yet, so try to insert
        const [created] = await db
            .insert(hodContacts)
            .output()
            .values({ department, name, email });
        return created;
    } catch (e: any) {
        // If two concurrent requests try to insert the same department, one will throw a Unique Key/Index violation
        // MSSQL error codes: 2627 (Unique constraint), 2601 (Unique index)
        if (e.number === 2627 || e.number === 2601) {
            const [lateUpdate] = await db
                .update(hodContacts)
                .set({ name, email, updatedAt: new Date() })
                .where(eq(hodContacts.department, department))
                .output();
            if (lateUpdate) return lateUpdate;
        }
        throw e;
    }
};

export const updateHod = async (id: number, data: { name?: string; email?: string; isActive?: boolean }) => {
    await getHodById(id); // will throw NotFoundError if not found
    const [updated] = await db
        .update(hodContacts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(hodContacts.id, id))
        .output();
    return updated;
};

export const deleteHod = async (id: number) => {
    await getHodById(id);
    await db.delete(hodContacts).where(eq(hodContacts.id, id));
};
