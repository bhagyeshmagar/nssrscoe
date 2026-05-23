import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const UPLOAD_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Create axios instance with defaults
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
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

// Helper to decode JWT token
export const decodeToken = (token: string): { id: number; role: 'admin' | 'volunteer'; username?: string; email?: string } | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

// Auth API - unified login for admin and volunteer
export const authAPI = {
    login: (email: string, password: string) =>
        api.post<{ token: string; role: 'admin' | 'volunteer'; user: { id: number; name?: string; username?: string; email?: string } }>('/auth/login', { email, password }),
    verify: () => api.get<{ valid: boolean; role: 'admin' | 'volunteer'; user: any }>('/auth/verify'),
};

// Events API
export const eventsAPI = {
    getAll: () => api.get('/events'),
    create: (data: EventData) => api.post('/events', data),
    update: (id: number, data: Partial<EventData>) => api.put(`/events/${id}`, data),
    delete: (id: number) => api.delete(`/events/${id}`),
};

// Gallery API
export const galleryAPI = {
    getAll: () => api.get('/gallery'),
    create: (data: GalleryData) => api.post('/gallery', data),
    update: (id: number, data: Partial<GalleryData>) => api.put(`/gallery/${id}`, data),
    delete: (id: number) => api.delete(`/gallery/${id}`),
};

// Members API
export const membersAPI = {
    getAll: () => api.get('/members'),
    create: (data: MemberData) => api.post('/members', data),
    update: (id: number, data: Partial<MemberData>) => api.put(`/members/${id}`, data),
    delete: (id: number) => api.delete(`/members/${id}`),
};

export const registrationsAPI = {
    create: (data: Omit<EventRegistration, 'id' | 'createdAt' | 'visitorPassId'>) => api.post<{visitorPassId: string, id: number}>('/registrations', data),
    getByVisitorId: (visitorId: string) => api.get<RegistrationWithEvent>(`/registrations/visitor/${visitorId}`),
    getByEventId: (eventId: number) => api.get<EventRegistration[]>(`/registrations/event/${eventId}`),
};

// Settings API
export const settingsAPI = {
    get: () => api.get('/settings'),
    update: (data: SiteSettings) => api.put('/settings', data),
};

// Upload API
export const uploadAPI = {
    uploadFile: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/upload/single', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    uploadMultiple: async (files: File[]): Promise<{ files: { url: string }[] }> => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const response = await api.post('/upload/multiple', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    getFullUrl: (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${UPLOAD_BASE_URL}${path}`;
    }
};

// Event Images API
export const eventImagesAPI = {
    getByEvent: (eventId: number) => api.get(`/event-images/${eventId}`),
    add: (eventId: number, images: EventImageData[]) => api.post(`/event-images/${eventId}`, { images }),
    setMaster: (eventId: number, imageId: number) => api.put(`/event-images/${eventId}/master/${imageId}`),
    update: (imageId: number, data: Partial<EventImageData>) => api.put(`/event-images/${imageId}`, data),
    delete: (imageId: number) => api.delete(`/event-images/${imageId}`),
};

// Volunteers API - Admin CRUD operations
export const volunteersAPI = {
    getAll: () => api.get<VolunteerData[]>('/volunteers'),
    getById: (id: number) => api.get<VolunteerWithProfile>(`/volunteers/admin/${id}`),
    create: (data: CreateVolunteerData) => api.post<VolunteerData>('/volunteers', data),
    update: (id: number, data: Partial<CreateVolunteerData>) => api.put<VolunteerData>(`/volunteers/admin/${id}`, data),
    delete: (id: number) => api.delete(`/volunteers/admin/${id}`),
    toggleStatus: (id: number) => api.patch<{ id: number; isActive: boolean; message: string }>(`/volunteers/admin/${id}/toggle-status`),
    getExperiences: () => api.get<any[]>('/volunteers/experiences'),
    getAllPublic: () => api.get<any[]>('/volunteers/public'),
};

// Volunteer Profile API - Volunteer self-service
export const volunteerProfileAPI = {
    getMyProfile: () => api.get<VolunteerWithProfile>('/volunteers/me'),
    updateProfile: (data: VolunteerProfileData) => api.put('/volunteers/me/profile', data),
    updatePassword: (currentPassword: string, newPassword: string) =>
        api.put('/volunteers/me/password', { currentPassword, newPassword }),
};

// Types
export interface EventData {
    id: number;
    title: string;
    description: string;
    date: string;
    location: string;
    type: 'upcoming' | 'past';
    volunteersCount?: number;
    images?: EventImage[];
    reportUrl?: string;
}

export interface EventImageData {
    url: string;
    isMaster?: boolean;
    caption?: string;
}

export interface EventImage extends EventImageData {
    id: number;
    eventId: number;
    createdAt: string;
}

export interface GalleryData {
    title?: string;
    url: string;
    type?: 'image' | 'video';
    eventId?: number | null;
}

export interface MemberData {
    id?: number;
    name: string;
    role: string;
    photoUrl?: string;
    year?: string;
}

export interface SiteSettings {
    heroTitle?: string;
    heroSubtitle?: string;
    heroCTA?: string;
    heroCta?: string;
    statEventsCount?: string;
    statEventsLabel?: string;
    statVolunteersCount?: string;
    statVolunteersLabel?: string;
    statImpactCount?: string;
    statImpactLabel?: string;
    aboutMission?: string;
    aboutHistory?: string;
    aboutText?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    socialInstagram?: string;
    socialFacebook?: string;
    socialTwitter?: string;
    homeSliderImages?: string; // JSON string of slider images
}

export interface EventRegistration {
    id: number;
    eventId: number;
    name: string;
    email: string;
    phone: string;
    department: string;
    year: string;
    visitorPassId?: string;
    createdAt?: string;
}

export interface RegistrationWithEvent {
    registration: EventRegistration;
    event: EventData;
}

export interface VolunteerData {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
}

export interface CreateVolunteerData {
    name: string;
    email: string;
    password?: string;
}

export interface VolunteerProfileData {
    fullName: string;
    prnNo: string;
    department: string;
    academicYear: string;   // FE, SE, TE, BE
    nssYear?: number;       // 1 or 2
    marksheetUrl?: string;  // File path
    cgpa?: string;
    eligibilityNo?: string;
    religion?: string;
    caste?: string;
    casteCategory?: string; // Open, OBC, SC, ST etc
    phoneNo: string;
    emailId: string;
    profilePhotoUrl?: string;
    experienceText?: string;
}

export interface VolunteerWithProfile extends VolunteerData {
    profile: VolunteerProfileData | null;
}

export default api;

