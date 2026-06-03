import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const UPLOAD_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            window.location.href = '/login';
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
        api.get<VolunteerWithProfile[]>(`/academic-years/${ayId}/volunteers`, { params }),
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

// ── Volunteer self-service ────────────────────────────────────────────────────
export const volunteerProfileAPI = {
    getMyProfile:   () => api.get<VolunteerWithProfile>('/volunteers/me'),
    updateProfile:  (data: VolunteerProfileData) => api.put('/volunteers/me/profile', data),
    updatePassword: (currentPassword: string, newPassword: string) =>
        api.put('/volunteers/me/password', { currentPassword, newPassword }),
};

// ── Core Team ─────────────────────────────────────────────────────────────────
export const coreTeamAPI = {
    getRoles:         () => api.get<CoreTeamRole[]>('/core-team/roles'),
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

// ── Existing APIs (unchanged) ─────────────────────────────────────────────────
export const adminsAPI = {
    getMe:   () => api.get('/admins/me'),
    updateMe: (data: Record<string, unknown>) => api.put('/admins/me', data),
    getAll:  () => api.get('/admins'),
    create:  (data: Record<string, unknown>) => api.post('/admins', data),
    update:  (id: number, data: Record<string, unknown>) => api.put(`/admins/${id}`, data),
    delete:  (id: number) => api.delete(`/admins/${id}`),
};

export const eventsAPI = {
    getAll:  ()                              => api.get('/events'),
    create:  (data: EventData)               => api.post('/events', data),
    update:  (id: number, data: Partial<EventData>) => api.put(`/events/${id}`, data),
    delete:  (id: number)                    => api.delete(`/events/${id}`),
};

export const galleryAPI = {
    getAll:  () => api.get('/gallery'),
    create:  (data: GalleryData) => api.post('/gallery', data),
    update:  (id: number, data: Partial<GalleryData>) => api.put(`/gallery/${id}`, data),
    delete:  (id: number) => api.delete(`/gallery/${id}`),
};

export const membersAPI = {
    getAll:  () => api.get('/members'),
    create:  (data: MemberData) => api.post('/members', data),
    update:  (id: number, data: Partial<MemberData>) => api.put(`/members/${id}`, data),
    delete:  (id: number) => api.delete(`/members/${id}`),
};

export const registrationsAPI = {
    create:         (data: Omit<EventRegistration, 'id' | 'createdAt' | 'visitorPassId'>) =>
        api.post<{ visitorPassId: string; id: number }>('/registrations', data),
    getByVisitorId: (visitorId: string) => api.get<RegistrationWithEvent>(`/registrations/visitor/${visitorId}`),
    getByEventId:   (eventId: number)   => api.get<EventRegistration[]>(`/registrations/event/${eventId}`),
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
        return response.data;
    },
    uploadMultiple: async (files: File[]): Promise<{ files: { url: string }[] }> => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const response = await api.post('/upload/multiple', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return response.data;
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
    isUniquePerAy: boolean;
    displayOrder: number;
}

export interface AssignRoleData {
    coreTeamRoleId: number;
    volunteerId?: number;
    displayName?: string;
    displayPhotoUrl?: string;
    department?: string;
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
    }>;
}

export interface CreateCampData {
    name: string;
    location: string;
    startDate: string;
    endDate: string;
    description?: string;
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
    academicYearId?: number;
}

export interface EventImageData { url: string; isMaster?: boolean; caption?: string; }
export interface EventImage extends EventImageData { id: number; eventId: number; createdAt: string; }
export interface GalleryData { title?: string; url: string; type?: 'image' | 'video'; eventId?: number | null; }
export interface MemberData { id?: number; name: string; role: string; photoUrl?: string; year?: string; }
export interface SiteSettings {
    heroTitle?: string; heroSubtitle?: string; heroCta?: string;
    statEventsCount?: string; statEventsLabel?: string;
    statVolunteersCount?: string; statVolunteersLabel?: string;
    statImpactCount?: string; statImpactLabel?: string;
    aboutMission?: string; aboutHistory?: string; aboutText?: string; aboutTeamPhoto?: string;
    contactEmail?: string; contactPhone?: string; contactAddress?: string;
    socialInstagram?: string; socialFacebook?: string; socialTwitter?: string; socialYoutube?: string;
    homeSliderImages?: string;
}
export interface EventRegistration {
    id: number; eventId: number; name: string; email: string;
    phone: string; department: string; year: string;
    visitorPassId?: string; createdAt?: string;
}
export interface RegistrationWithEvent { registration: EventRegistration; event: EventData; }

export default api;
