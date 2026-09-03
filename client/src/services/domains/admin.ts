import api from '../core/http';
import type { PaginatedResponse } from '../types/response';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminData {
    id: number;
    username: string;
    isSuperadmin: boolean;
    createdAt?: string;
}

export interface SiteSettings {
    heroTitle?: string; heroSubtitle?: string; heroCta?: string;
    statEventsCount?: string; statEventsLabel?: string;
    statVolunteersCount?: string; statVolunteersLabel?: string;
    statImpactCount?: string; statImpactLabel?: string;
    statCampsCount?: string; statCampsLabel?: string;
    statHoursCount?: string; statHoursLabel?: string;
    aboutTitle?: string; aboutMission?: string; aboutHistory?: string; aboutText?: string; aboutTeamPhoto?: string;
    aboutDirectorMessage?: string; aboutDirectorName?: string; aboutDirectorPhoto?: string;
    aboutPoMessage?: string; aboutPoName?: string; aboutPoPhoto?: string;
    contactEmail?: string; contactPhone?: string; contactAddress?: string;
    socialInstagram?: string; socialFacebook?: string; socialTwitter?: string; socialYoutube?: string;
    homeAboutContent?: string;
}

export interface GalleryData {
    title?: string;
    description?: string;
    url: string;
    type: 'image' | 'video';
    eventId?: number | null;
    status?: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string | null;
}

export interface GalleryItem extends GalleryData { id: number; createdAt?: string; }

export interface MemberData { id?: number; name: string; role: string; photoUrl?: string; year?: string; order?: number; category?: string; }

export interface HodContact {
    id: number;
    department: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface EmailLog {
    id: number;
    emailType: string;
    subject: string;
    recipientEmail: string;
    recipientName?: string;
    status: 'sent' | 'failed';
    errorMessage?: string;
    metadata?: Record<string, unknown>;
    sentByAdminId?: number;
    sentAt: string;
}

export interface EmailStats {
    total: number;
    totalSent: number;
    totalFailed: number;
    successRate: number;
    byType: { emailType: string; total: number; sent: number; failed: number }[];
    recentLogs: EmailLog[];
    emailTypes: string[];
}

export interface AppNotification {
    id: number;
    type: string;
    title: string;
    body: string;
    referenceType?: string;
    referenceId?: number;
    isRead: boolean;
    createdAt: string;
}

// ── APIs ──────────────────────────────────────────────────────────────────────

export const adminsAPI = {
    getMe:   () => api.get<AdminData>('/admins/me'),
    updateMe: (data: Record<string, unknown>) => api.put<AdminData>('/admins/me', data),
    getAll:  () => api.get<AdminData[]>('/admins'),
    create:  (data: Record<string, unknown>) => api.post<AdminData>('/admins', data),
    update:  (id: number, data: Record<string, unknown>) => api.put<AdminData>(`/admins/${id}`, data),
    delete:  (id: number) => api.delete(`/admins/${id}`),
};

export const settingsAPI = {
    get:    () => api.get<SiteSettings>('/settings'),
    update: (data: SiteSettings) => api.put<SiteSettings>('/settings', data),
};

export const galleryAPI = {
    getAll: () => api.get<GalleryItem[]>('/gallery'),
    getAdminAll: () => api.get<GalleryItem[]>('/gallery/admin'),
    create: (data: GalleryData) => api.post<GalleryItem>('/gallery', data),
    update: (id: number, data: Partial<GalleryData>) => api.put<GalleryItem>(`/gallery/${id}`, data),
    delete: (id: number) => api.delete<void>(`/gallery/${id}`),
    approve: (id: number) => api.put<GalleryItem>(`/gallery/${id}/approve`, {}),
    reject: (id: number, reason: string) => api.put<GalleryItem>(`/gallery/${id}/reject`, { reason })
};

export const membersAPI = {
    getAll:  () => api.get<MemberData[]>('/members'),
    create:  (data: MemberData) => api.post<MemberData>('/members', data),
    update:  (id: number, data: Partial<MemberData>) => api.put<MemberData>(`/members/${id}`, data),
    delete:  (id: number) => api.delete(`/members/${id}`),
};

export const hodAPI = {
    getAll: () => api.get<HodContact[]>('/hod-contacts'),
    upsert: (department: string, name: string, email: string) =>
        api.put<HodContact>(`/hod-contacts/${encodeURIComponent(department)}`, { name, email }),
    update: (id: number, data: Partial<Pick<HodContact, 'name' | 'email' | 'isActive'>>) =>
        api.patch<HodContact>(`/hod-contacts/${id}`, data),
    delete: (id: number) => api.delete(`/hod-contacts/${id}`),
};

export const emailLogsAPI = {
    getLogs: (params?: { emailType?: string; status?: string; page?: number; limit?: number }) =>
        api.get<PaginatedResponse<EmailLog>>('/email/logs', { params }),
    getStats: () => api.get<EmailStats>('/email/logs/stats'),
    sendAttendanceReport: (ayId: number, eventId: number) =>
        api.post<{ sent: number; failed: number; results: unknown[] }>('/email/send-attendance-report', { ayId, eventId }),
};

export const notificationsAPI = {
    getMy:            (params?: { limit?: number; offset?: number }) => api.get<{ notifications: AppNotification[] }>('/volunteers/me/notifications', { params }),
    getUnreadCount:   () => api.get<{ count: number }>('/volunteers/me/notifications/count'),
    markAsRead:       (id: number) => api.put<unknown>(`/volunteers/me/notifications/${id}/read`),
    markAllAsRead:    () => api.put<unknown>('/volunteers/me/notifications/read-all'),
};
