import api from '../core/http';
import type { PaginatedResponse } from '../types/response';

// ── Types ─────────────────────────────────────────────────────────────────────

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
    isExperienceApproved?: boolean;
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

export interface ExperienceData {
    id: number;
    name: string;
    role: string;
    text: string;
    image: string;
}

export interface MyAttendanceItem {
    id: number;
    status: 'present' | 'absent' | 'late';
    date: string;
    eventId: number;
    title: string;
    type: 'event' | 'meeting';
    location?: string;
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

// ── APIs ──────────────────────────────────────────────────────────────────────

export const volunteersAPI = {
    // Admin AY-scoped operations
    getByAY:     (ayId: number, params?: VolunteerFilters) =>
        api.get<PaginatedResponse<VolunteerWithProfile>>(`/academic-years/${ayId}/volunteers`, { params }),
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
    approveExperience:(ayId: number, id: number) =>
        api.patch<VolunteerData>(`/academic-years/${ayId}/volunteers/${id}/approve-experience`),
    import:      (ayId: number, data: ImportVolunteerData) =>
        api.post<unknown>(`/academic-years/${ayId}/volunteers/import`, data),
    // Legacy public/self-service
    getExperiences: () => api.get<ExperienceData[]>('/volunteers/experiences'),
    getAllPublic:    () => api.get<VolunteerData[]>('/volunteers/public'),
};

export const volunteerProfileAPI = {
    getMyProfile:   () => api.get<VolunteerWithProfile>('/volunteers/me'),
    updateProfile:  (data: VolunteerProfileData) => api.put<VolunteerWithProfile>('/volunteers/me/profile', data),
    updatePassword: (currentPassword: string, newPassword: string) =>
        api.put<unknown>('/volunteers/me/password', { currentPassword, newPassword }),
    getMyAttendance:  () => api.get<MyAttendanceItem[]>('/volunteers/me/attendance'),
};

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

export const coreTeamDashboardAPI = {
    getDashboard: () => api.get<{ volunteers: unknown[] }>('/core-team-dashboard/dashboard'),
};
