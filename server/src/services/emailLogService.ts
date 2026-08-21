import { eq, desc, count, sql, and, SQL } from 'drizzle-orm';
import { db } from '../db';
import { emailLogs, EMAIL_TYPES } from '../db/schema';

export interface EmailLogFilters {
    emailType?: string;
    status?: 'sent' | 'failed';
    page?: number;
    limit?: number;
}

const parseMetadata = (metadata: string | null) => {
    if (!metadata) return null;
    try { return JSON.parse(metadata); } catch { return metadata; }
};

export const getEmailLogs = async (filters: EmailLogFilters = {}) => {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 25));
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (filters.emailType && EMAIL_TYPES.includes(filters.emailType as any)) {
        conditions.push(eq(emailLogs.emailType, filters.emailType));
    }
    if (filters.status) {
        conditions.push(eq(emailLogs.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const query = db
        .select()
        .from(emailLogs)
        .where(whereClause)
        .orderBy(desc(emailLogs.sentAt))
        .offset(offset)
        .fetch(limit);

    const [{ total }] = await db
        .select({ total: count() })
        .from(emailLogs)
        .where(whereClause);

    const rows = await query;
    const totalPages = Math.ceil(Number(total) / limit);

    // Parse JSON metadata for client consumption
    const data = rows.map((r: any) => ({
        ...r,
        metadata: parseMetadata(r.metadata),
    }));

    return { data, page, limit, total: Number(total), totalPages };
};

export const getEmailStats = async () => {
    // Total counts by type
    const byType = await db
        .select({
            emailType: emailLogs.emailType,
            total: count(),
            sent: sql<number>`SUM(CASE WHEN ${emailLogs.status} = 'sent' THEN 1 ELSE 0 END)`,
            failed: sql<number>`SUM(CASE WHEN ${emailLogs.status} = 'failed' THEN 1 ELSE 0 END)`,
        })
        .from(emailLogs)
        .groupBy(emailLogs.emailType);

    const totalSent = byType.reduce((acc, r) => acc + Number(r.sent), 0);
    const totalFailed = byType.reduce((acc, r) => acc + Number(r.failed), 0);

    // Recent 5 logs
    const recent = await db
        .select()
        .top(5)
        .from(emailLogs)
        .orderBy(desc(emailLogs.sentAt));

    return {
        total: totalSent + totalFailed,
        totalSent,
        totalFailed,
        successRate: totalSent + totalFailed > 0
            ? Math.round((totalSent / (totalSent + totalFailed)) * 100)
            : 100,
        byType: byType.map(r => ({
            emailType: r.emailType,
            total: Number(r.total),
            sent: Number(r.sent),
            failed: Number(r.failed),
        })),
        recentLogs: recent.map((r: any) => ({
            ...r,
            metadata: parseMetadata(r.metadata),
        })),
        emailTypes: EMAIL_TYPES,
    };
};
