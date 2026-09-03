import api from '../core/http';
import type { PaginatedResponse } from '../types/response';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AcademicYear {
    id: number;
    label: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    isLocked: boolean;
    isArchived: boolean;
    volunteerCap: number;
    lockedAt?: string;
    createdAt: string;
    regularActivityReportUrl?: string;
    specialCampReportUrl?: string;
}

export interface AYStats {
    volunteers: { total: number; regular: number; backup: number; active: number };
    byDepartment: { department: string; total: number; regular: number }[];
    coreTeamAssignments: number;
    specialCamps: number;
    events: number;
}

export interface CreateAYData {
    label: string;
    startDate: string;
    endDate: string;
    volunteerCap?: number;
    regularActivityReportUrl?: string;
    specialCampReportUrl?: string;
}

export interface ActivityCalendarItem {
    id: number;
    academicYearId: number;
    month: string;
    tentativeDate: string;
    activity: string;
    type: string;
    createdAt: string;
}

export interface AuditLog {
    id: number;
    action: string;
    entityType: string; 
    entityId: number | null;
    performedById: number | null;
    performedByUsername?: string;
    performedByRole: string | null;
    details: string | null;
    createdAt: string; 
}

// ── APIs ──────────────────────────────────────────────────────────────────────

export const academicYearsAPI = {
    getAll:    ()          => api.get<AcademicYear[]>('/academic-years'),
    getCurrent:()          => api.get<AcademicYear>('/academic-years/current'),
    getById:   (id: number)=> api.get<AcademicYear>(`/academic-years/${id}`),
    getStats:  (id: number)=> api.get<AYStats>(`/academic-years/${id}/stats`),
    create:    (data: CreateAYData) => api.post<AcademicYear>('/academic-years', data),
    update:    (id: number, data: Partial<CreateAYData>) => api.put<AcademicYear>(`/academic-years/${id}`, data),
    activate:  (id: number)=> api.post<AcademicYear>(`/academic-years/${id}/activate`),
    lock:      (id: number)=> api.post<AcademicYear>(`/academic-years/${id}/lock`),
    unlock:    (id: number, password: string) => api.post<AcademicYear>(`/academic-years/${id}/unlock`, { password }),
    archive:   (id: number)=> api.post<AcademicYear>(`/academic-years/${id}/archive`),
    unarchive: (id: number)=> api.post<AcademicYear>(`/academic-years/${id}/unarchive`),
    delete:    (id: number)=> api.delete(`/academic-years/${id}`),
};

export const activityCalendarAPI = {
    getByAcademicYear: (ayId: number) => api.get<ActivityCalendarItem[]>(`/activity-calendar/${ayId}`),
    create: (ayId: number, data: Omit<ActivityCalendarItem, 'id' | 'academicYearId' | 'createdAt'>) => api.post<ActivityCalendarItem>(`/activity-calendar/${ayId}`, data),
    update: (id: number, data: Omit<ActivityCalendarItem, 'id' | 'academicYearId' | 'createdAt'>) => api.put<ActivityCalendarItem>(`/activity-calendar/${id}`, data),
    delete: (id: number) => api.delete(`/activity-calendar/${id}`),
};

export const auditAPI = {
    getLogs: (page: number, limit: number, filters?: { action?: string; entityType?: string; performedById?: number | string; startDate?: string; endDate?: string; }) => {
        const search = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (filters?.action) search.append('action', filters.action);
        if (filters?.entityType) search.append('entityType', filters.entityType);
        if (filters?.performedById) search.append('performedById', String(filters.performedById));
        if (filters?.startDate) search.append('startDate', filters.startDate);
        if (filters?.endDate) search.append('endDate', filters.endDate);
        return api.get<PaginatedResponse<AuditLog>>(`/audit-logs?${search.toString()}`);
    }
};
