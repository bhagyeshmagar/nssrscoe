import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

let rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
rawApiUrl = rawApiUrl.replace(/\/+$/, ''); // trim trailing slashes
if (!rawApiUrl.endsWith('/api')) {
    rawApiUrl = `${rawApiUrl}/api`;
}
const API_BASE_URL = rawApiUrl;
const UPLOAD_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: any;
    message?: string;
}

interface CustomAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> {
    get<T = any, R = AxiosResponse<ApiResponse<T>>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    post<T = any, R = AxiosResponse<ApiResponse<T>>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    put<T = any, R = AxiosResponse<ApiResponse<T>>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    patch<T = any, R = AxiosResponse<ApiResponse<T>>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    delete<T = any, R = AxiosResponse<ApiResponse<T>>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
}) as CustomAxiosInstance;

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().clearAuth();
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const decodeToken = (token: string): { id: number; role: 'admin' | 'superadmin' | 'volunteer'; isSuperadmin?: boolean; username?: string; email?: string } | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(jsonPayload);
    } catch { return null; }
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
    login: (email: string, password: string) =>
        api.post<{ token: string; role: 'admin' | 'volunteer'; user: { id: number; name?: string; username?: string; email?: string } }>('/auth/login', { email, password }),
    verify: () => api.get<{ valid: boolean; role: 'admin' | 'volunteer'; user: unknown }>('/auth/verify'),
};

// ── Academic Years ────────────────────────────────────────────────────────────
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

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface AuditLog {
    id: number;
    action: string;
    entityType: string;
    entityId: number | null;
    performedById: number | null;
    performedByRole: string;
    details: string | null;
    createdAt: string;
}

// ── Audit Logs ──────────────────────────────────────────────────────────────
export const auditAPI = {
    getLogs: (page: number, limit: number) =>
        api.get<PaginatedResponse<AuditLog>>(`/audit-logs?page=${page}&limit=${limit}`),
};

// ── Activity Calendar ────────────────────────────────────────────────────────
export const activityCalendarAPI = {
    getByAcademicYear: (ayId: number) => api.get<ActivityCalendarItem[]>(`/activity-calendar/${ayId}`),
    create: (ayId: number, data: Omit<ActivityCalendarItem, 'id' | 'academicYearId' | 'createdAt'>) => api.post<ActivityCalendarItem>(`/activity-calendar/${ayId}`, data),
    update: (id: number, data: Omit<ActivityCalendarItem, 'id' | 'academicYearId' | 'createdAt'>) => api.put<ActivityCalendarItem>(`/activity-calendar/${id}`, data),
    delete: (id: number) => api.delete(`/activity-calendar/${id}`),
};

// ── Volunteers (AY-scoped admin) ──────────────────────────────────────────────
export const volunteersAPI = {
    // Admin AY-scoped operations
    getByAY:     (ayId: number, params?: VolunteerFilters) =>
        api.get<{ data: VolunteerWithProfile[], meta?: any }>(`/academic-years/${ayId}/volunteers`, { params }),
    create:      (ayId: number, data: CreateVolunteerData) =>
        api.post<VolunteerData>(`/academic-years/${ayId}/volunteers`, data),
    getById:     (ayId: number, id: number) =>
        api.get<VolunteerWithProfile>(`/academic-years/${ayId}/volunteers/${id}`),
    update:      (ayId: number, id: number, data: Partial<CreateVolunteerData>) =>
        api.put<VolunteerData>(`/academic-years/${ayId}/volunteers/${id}`, data),
    delete:      (ayId: number, id: number) =>
        api.delete(`/academic-years/${ayId}/volunteers/${id}`),
    changeStatus:(ayId: number, id: number, status: 'regular' | 'backup') =>
        api.patch<VolunteerData>(`/academic-years/${ayId}/volunteers/${id}/status`, { status }),
    toggleActive:(ayId: number, id: number) =>
        api.patch<VolunteerData>(`/academic-years/${ayId}/volunteers/${id}/toggle-active`),
    import:      (ayId: number, data: ImportVolunteerData) =>
        api.post(`/academic-years/${ayId}/volunteers/import`, data),
    // Legacy public/self-service
    getExperiences: () => api.get<ExperienceData[]>('/volunteers/experiences'),
    getAllPublic:    () => api.get<VolunteerData[]>('/volunteers/public'),
};

export interface MyAttendanceItem {
    id: number;
    status: 'present' | 'absent' | 'late';
    date: string;
    eventId: number;
    title: string;
    type: 'event' | 'meeting';
    location?: string;
}

// ── Volunteer self-service ────────────────────────────────────────────────────
export const volunteerProfileAPI = {
    getMyProfile:   () => api.get<VolunteerWithProfile>('/volunteers/me'),
    updateProfile:  (data: VolunteerProfileData) => api.put('/volunteers/me/profile', data),
    updatePassword: (currentPassword: string, newPassword: string) =>
        api.put('/volunteers/me/password', { currentPassword, newPassword }),
    getMyAttendance:  () => api.get<MyAttendanceItem[]>('/volunteers/me/attendance'),
};

// ── Core Team ─────────────────────────────────────────────────────────────────
export const coreTeamAPI = {
    getRoles:         () => api.get<CoreTeamRole[]>('/core-team/roles'),
    deleteRole:       (id: number) => api.delete(`/core-team/roles/${id}`),
    getByAY:          (ayId: number) => api.get<CoreTeamAssignment[]>(`/academic-years/${ayId}/core-team`),
    assign:           (ayId: number, data: AssignRoleData) =>
        api.post<CoreTeamAssignment>(`/academic-years/${ayId}/core-team`, data),
    updateAssignment: (ayId: number, id: number, data: Partial<AssignRoleData>) =>
        api.put<CoreTeamAssignment>(`/academic-years/${ayId}/core-team/${id}`, data),
    removeAssignment: (ayId: number, id: number) =>
        api.delete(`/academic-years/${ayId}/core-team/${id}`),
};

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceAPI = {
    getSessions:     (ayId: number, params?: { eventId?: number }) =>
        api.get<AttendanceSession[]>(`/academic-years/${ayId}/attendance/sessions`, { params }),
    createSession:   (ayId: number, data: CreateSessionData) =>
        api.post<AttendanceSession>(`/academic-years/${ayId}/attendance/sessions`, data),
    getSession:      (sessionId: number) =>
        api.get<AttendanceSessionWithRecords>(`/attendance/sessions/${sessionId}`),
    deleteSession:   (sessionId: number) =>
        api.delete(`/attendance/sessions/${sessionId}`),
    markAttendance:  (sessionId: number, records: AttendanceRecordInput[]) =>
        api.post<AttendanceSessionWithRecords>(`/attendance/sessions/${sessionId}/records`, { records }),
    getSummary:      (ayId: number) =>
        api.get<AttendanceSummary>(`/academic-years/${ayId}/attendance/summary`),
    getVolunteer:    (ayId: number, volunteerId: number) =>
        api.get<VolunteerAttendanceRecord[]>(`/academic-years/${ayId}/attendance/volunteer/${volunteerId}`),
    getEventAttendance: (ayId: number, eventId: number) =>
        api.get<AttendanceSessionWithRecords>(`/academic-years/${ayId}/attendance/events/${eventId}/attendance`),
    saveEventAttendance: (ayId: number, eventId: number, records: AttendanceRecordInput[]) =>
        api.put<AttendanceSessionWithRecords>(`/academic-years/${ayId}/attendance/events/${eventId}/attendance`, { records }),
};

// ── Special Camps ─────────────────────────────────────────────────────────────
export const specialCampsAPI = {
    getByAY:          (ayId: number) => api.get<SpecialCamp[]>(`/academic-years/${ayId}/special-camps`),
    create:           (ayId: number, data: CreateCampData) =>
        api.post<SpecialCamp>(`/academic-years/${ayId}/special-camps`, data),
    getById:          (campId: number) => api.get<SpecialCampWithParticipants>(`/special-camps/${campId}`),
    update:           (campId: number, data: Partial<CreateCampData>) =>
        api.put<SpecialCamp>(`/special-camps/${campId}`, data),
    delete:           (campId: number) => api.delete(`/special-camps/${campId}`),
    addParticipant:   (campId: number, volunteerId: number) =>
        api.post(`/special-camps/${campId}/participants`, { volunteerId }),
    removeParticipant:(campId: number, participantId: number) =>
        api.delete(`/special-camps/${campId}/participants/${participantId}`),
    setParticipantsBulk: (campId: number, volunteerIds: number[]) =>
        api.put(`/special-camps/${campId}/participants/bulk`, { volunteerIds }),
    finalize:         (campId: number) => api.post<SpecialCamp>(`/special-camps/${campId}/finalize`),
    unlock:           (campId: number, password: string) => api.post<SpecialCamp>(`/special-camps/${campId}/unlock`, { password }),
};

// ── Meetings ──────────────────────────────────────────────────────────────────
export const meetingsAPI = {
    getByAY:          (ayId: number, params?: { type?: string; status?: string }) => api.get<Meeting[]>(`/academic-years/${ayId}/meetings`, { params }),
    create:           (ayId: number, data: CreateMeetingData) => api.post<Meeting>(`/academic-years/${ayId}/meetings`, data),
    getById:          (meetingId: number) => api.get<Meeting>(`/meetings/${meetingId}`),
    update:           (meetingId: number, data: Partial<CreateMeetingData>) => api.put<Meeting>(`/meetings/${meetingId}`, data),
    delete:           (meetingId: number) => api.delete(`/meetings/${meetingId}`),
    start:            (meetingId: number) => api.post<Meeting>(`/meetings/${meetingId}/start`),
    end:              (meetingId: number) => api.post<Meeting>(`/meetings/${meetingId}/end`),
    reopen:           (meetingId: number) => api.post<Meeting>(`/meetings/${meetingId}/reopen`),
    getAttendance:    (meetingId: number) => api.get<{ attendance: MeetingAttendanceWithVolunteer[]; stats: MeetingAttendanceStats }>(`/meetings/${meetingId}/attendance`),
    markAttendance:   (meetingId: number, volunteerId: number, data: MarkMeetingAttendanceData) => api.post(`/meetings/${meetingId}/attendance/volunteers/${volunteerId}`, data),
    getStats:         (meetingId: number) => api.get<{ stats: MeetingAttendanceStats }>(`/meetings/${meetingId}/attendance/stats`),
    exportAttendance: (meetingId: number) => api.get<MeetingAttendanceExportData>(`/meetings/${meetingId}/attendance/export`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
    getMy:            (params?: { limit?: number; offset?: number }) => api.get<{ notifications: AppNotification[] }>('/volunteers/me/notifications', { params }),
    getUnreadCount:   () => api.get<{ count: number }>('/volunteers/me/notifications/count'),
    markAsRead:       (id: number) => api.put(`/volunteers/me/notifications/${id}/read`),
    markAllAsRead:    () => api.put('/volunteers/me/notifications/read-all'),
};

// ── Core Team Dashboard ───────────────────────────────────────────────────────
export const coreTeamDashboardAPI = {
    getDashboard:       () => api.get<{ volunteers: unknown[] }>('/core-team-dashboard/dashboard'),
};

// ── Existing APIs (unchanged) ─────────────────────────────────────────────────
export const adminsAPI = {
    getMe:   () => api.get('/admins/me'),
    updateMe: (data: Record<string, unknown>) => api.put('/admins/me', data),
    getAll:  () => api.get<AdminData[]>('/admins'),
    create:  (data: Record<string, unknown>) => api.post<AdminData>('/admins', data),
    update:  (id: number, data: Record<string, unknown>) => api.put<AdminData>(`/admins/${id}`, data),
    delete:  (id: number) => api.delete(`/admins/${id}`),
};

export const eventsAPI = {
    getAll:  ()                              => api.get('/events'),
    create:  (data: EventData)               => api.post('/events', data),
    update:  (id: number, data: Partial<EventData>) => api.put(`/events/${id}`, data),
    delete:  (id: number)                    => api.delete(`/events/${id}`),
};

export interface GalleryData {
    title?: string;
    description?: string;
    url: string;
    type: 'image' | 'video';
    eventId?: number | null;
    status?: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string | null;
}

export const galleryAPI = {
    getAll: () => api.get('/gallery'),
    getAdminAll: () => api.get('/gallery/admin'),
    create: (data: GalleryData) => api.post('/gallery', data),
    update: (id: number, data: Partial<GalleryData>) => api.put(`/gallery/${id}`, data),
    delete: (id: number) => api.delete(`/gallery/${id}`),
    approve: (id: number) => api.put(`/gallery/${id}/approve`, {}),
    reject: (id: number, reason: string) => api.put(`/gallery/${id}/reject`, { reason })
};

export const membersAPI = {
    getAll:  () => api.get('/members'),
    create:  (data: MemberData) => api.post('/members', data),
    update:  (id: number, data: Partial<MemberData>) => api.put(`/members/${id}`, data),
    delete:  (id: number) => api.delete(`/members/${id}`),
};

export const registrationsAPI = {
    create:         (data: Omit<EventRegistration, 'id' | 'createdAt' | 'visitorPassId' | 'status' | 'approvedAt' | 'approvedById'>) =>
        api.post('/registrations', data),
    getByVisitorId: (visitorId: string) => api.get(`/registrations/visitor/${visitorId}`),
    getByEventId:   (eventId: number)   => api.get(`/registrations/event/${eventId}`),
    approve:        (id: number)        => api.patch(`/registrations/${id}/approve`),
    reject:         (id: number)        => api.patch(`/registrations/${id}/reject`),
};

export const settingsAPI = {
    get:    () => api.get('/settings'),
    update: (data: SiteSettings) => api.put('/settings', data),
};

export const uploadAPI = {
    uploadFile: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/upload/single', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return (response.data as any) as { url: string };
    },
    uploadMultiple: async (files: File[]): Promise<{ files: { url: string }[] }> => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const response = await api.post('/upload/multiple', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return (response.data as any) as { files: { url: string }[] };
    },
    getFullUrl: (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${UPLOAD_BASE_URL}${path}`;
    },
};

export const eventImagesAPI = {
    getByEvent: (eventId: number) => api.get(`/event-images/${eventId}`),
    add:        (eventId: number, images: EventImageData[]) => api.post(`/event-images/${eventId}`, { images }),
    setMaster:  (eventId: number, imageId: number) => api.put(`/event-images/${eventId}/master/${imageId}`),
    update:     (imageId: number, data: Partial<EventImageData>) => api.put(`/event-images/${imageId}`, data),
    delete:     (imageId: number) => api.delete(`/event-images/${imageId}`),
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminData {
    id: number;
    username: string;
    isSuperadmin: boolean;
    createdAt?: string;
}

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

export type Department =
    | 'Computer Engineering'
    | 'Computer Science and Business Systems'
    | 'Information Technology'
    | 'Electronics and Telecommunication'
    | 'Electrical Engineering'
    | 'Automation and Robotics'
    | 'Mechanical Engineering'
    | 'Civil Engineering'
    | 'Bachelor of Computer Applications';

export const DEPARTMENTS: Department[] = [
    'Computer Engineering',
    'Computer Science and Business Systems',
    'Information Technology',
    'Electronics and Telecommunication',
    'Electrical Engineering',
    'Automation and Robotics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Bachelor of Computer Applications',
];

export interface VolunteerData {
    id: number;
    name: string;
    email: string;
    department: Department;
    status: 'regular' | 'backup';
    isActive: boolean;
    academicYearId: number;
    createdAt: string;
    eventsAttendedCount?: number;
    profilePhotoUrl?: string;
}

export interface CreateVolunteerData {
    name: string;
    email: string;
    password: string;
    department: Department;
    status?: 'regular' | 'backup';
    academicYearId?: number;
}

export interface VolunteerFilters {
    department?: string;
    status?: 'regular' | 'backup';
    isActive?: boolean;
    search?: string;
    sortBy?: 'name' | 'department';
    page?: number;
    limit?: number;
}

export interface ImportVolunteerData {
    sourceVolunteerIds: number[];
    defaultStatus?: 'regular' | 'backup';
    resetPassword?: string;
}

export interface VolunteerProfileData {
    fullName?: string;
    prnNo?: string;
    collegeYearAtEnrollment?: string;  // FE / SE / TE / BE
    nssYear?: number;
    marksheetUrl?: string;
    cgpa?: string;
    eligibilityNo?: string;
    religion?: string;
    caste?: string;
    casteCategory?: string;
    phoneNo?: string;
    emailId?: string;
    profilePhotoUrl?: string;
    experienceText?: string;
    portfolioChoices?: string;
}

export interface VolunteerWithProfile extends VolunteerData {
    fullName?: string;
    prnNo?: string;
    phoneNo?: string;
    profilePhotoUrl?: string;
    collegeYearAtEnrollment?: string;
    nssYear?: number;
    profile?: VolunteerProfileData | null;
}

export interface CoreTeamRole {
    id: number;
    name: string;
    code: string;
    roleType: 'institution' | 'student';
    category?: string;
    isUniquePerAy: boolean;
    displayOrder: number;
}

export interface AssignRoleData {
    coreTeamRoleId: number;
    volunteerId?: number;
    displayName?: string;
    displayPhotoUrl?: string;
    department?: string;
    customRoleName?: string;
    customCategory?: string;
    displayOrder?: number;
}

export interface CoreTeamAssignment {
    id: number;
    academicYearId: number;
    role: { id: number; name: string; code: string; type: string; displayOrder: number };
    volunteer: { id: number; name: string; department: string; status: string; photoUrl?: string } | null;
    displayName?: string;
    displayPhotoUrl?: string;
    department?: string;
    displayOrder: number;
    createdAt: string;
}

export interface AttendanceSession {
    id: number;
    academicYearId: number;
    title: string;
    date: string;
    description?: string;
    eventId?: number;
    createdAt: string;
}

export interface AttendanceRecordInput {
    volunteerId: number;
    status: 'present' | 'absent' | 'late';
    notes?: string;
}

export interface AttendanceSessionWithRecords extends AttendanceSession {
    records: Array<{
        id: number;
        volunteerId: number;
        volunteerName?: string;
        department?: string;
        status: 'present' | 'absent' | 'late';
        notes?: string;
    }>;
}

export interface AttendanceSummary {
    totalSessions: number;
    volunteers: Array<{
        volunteerId: number;
        name: string;
        department: string;
        present: number;
        absent: number;
        late: number;
        total: number;
        attendanceRate: number;
    }>;
}

export interface VolunteerAttendanceRecord {
    sessionId: number;
    sessionTitle: string;
    date: string;
    status: 'present' | 'absent' | 'late' | null;
    notes?: string | null;
}

export interface CreateSessionData {
    title: string;
    date: string;
    eventId?: number;
    description?: string;
}

export interface SpecialCamp {
    id: number;
    academicYearId: number;
    name: string;
    location: string;
    startDate: string;
    endDate: string;
    description?: string;
    isFinalized: boolean;
    finalizedAt?: string;
    volunteerCap?: number;
    createdAt: string;
}

export interface SpecialCampWithParticipants extends SpecialCamp {
    participants: Array<{
        id: number;
        volunteerId?: number;
        snapName: string;
        snapPrnNo?: string;
        snapDepartment?: string;
        snapNssYear?: number;
        snapCgpa?: string;
        snapFinalizedAt?: string;
        currentName?: string;
        currentDept?: string;
        collegeYear?: string;
        nssYear?: number;
    }>;
}

export interface CreateCampData {
    name: string;
    location: string;
    startDate: string;
    endDate: string;
    description?: string;
    volunteerCap?: number;
}

export interface ExperienceData {
    id: number;
    name: string;
    role: string;
    text: string;
    image: string;
}

export interface EventData {
    id: number;
    title: string;
    description: string;
    date: string;
    location: string;
    type?: 'upcoming' | 'today' | 'past';
    volunteersCount?: number;
    images?: EventImage[];
    reportUrl?: string;
    driveLink?: string;
    academicYearId?: number;
}

export interface EventImageData { url: string; isMaster?: boolean; caption?: string; }
export interface EventImage extends EventImageData { id: number; eventId: number; createdAt: string; }

export interface GalleryItem extends GalleryData { id: number; createdAt?: string; }
export interface MemberData { id?: number; name: string; role: string; photoUrl?: string; year?: string; order?: number; category?: string; }
export interface SiteSettings {
    heroTitle?: string; heroSubtitle?: string; heroCta?: string;
    statEventsCount?: string; statEventsLabel?: string;
    statVolunteersCount?: string; statVolunteersLabel?: string;
    statImpactCount?: string; statImpactLabel?: string;
    aboutMission?: string; aboutHistory?: string; aboutText?: string; aboutTeamPhoto?: string;
    aboutDirectorMessage?: string; aboutDirectorName?: string; aboutDirectorPhoto?: string;
    aboutPoMessage?: string; aboutPoName?: string; aboutPoPhoto?: string;
    contactEmail?: string; contactPhone?: string; contactAddress?: string;
    socialInstagram?: string; socialFacebook?: string; socialTwitter?: string; socialYoutube?: string;
    homeSliderImages?: string;
}
export interface EventRegistration {
    id: number; eventId: number; name: string; email: string;
    phone: string; department: string; year: string;
    visitorPassId?: string;
    status?: 'pending' | 'approved' | 'rejected';
    approvedAt?: string;
    approvedById?: number;
    createdAt?: string;
}
export interface RegistrationWithEvent { registration: EventRegistration; event: EventData; }

// ── Meeting Types ─────────────────────────────────────────────────────────────
export interface Meeting {
    id: number;
    academicYearId: number;
    title: string;
    description?: string;
    meetingType: 'regular' | 'core_team' | 'special_camp';
    status: 'scheduled' | 'active' | 'ended';
    scheduledDate: string;
    location: string;
    startedAt?: string;
    endedAt?: string;
    durationMinutes?: number;
    specialCampId?: number | null;
    createdAt: string;
}

export interface CreateMeetingData {
    title: string;
    description?: string;
    meetingType: 'regular' | 'core_team' | 'special_camp';
    scheduledDate: string;
    location: string;
    sendEmail?: boolean;
    specialCampId?: number;
}

export interface MeetingAttendanceExportRow {
    srNo: number;
    name: string;
    prnNo: string;
    department: string;
    volunteerType: string;
    attendance: string;
    notes: string;
}

export interface MeetingAttendanceExportData {
    meetingTitle: string;
    meetingType: string;
    scheduledDate: string;
    location: string;
    status: string;
    rows: MeetingAttendanceExportRow[];
}

export interface MeetingAttendanceWithVolunteer {
    volunteer: {
        id: number;
        name: string;
        prnNo?: string | null;
        department: string;
        status: string;
    };
    attendance: {
        id: number;
        status: 'present' | 'absent' | 'late';
        notes?: string;
        volunteerType: string;
    } | null;
}

export interface MarkMeetingAttendanceData {
    status: 'present' | 'absent' | 'late';
    notes?: string | null;
}

export interface MeetingAttendanceStats {
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    regularPresent: number;
    backupPresent: number;
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


export default api;
