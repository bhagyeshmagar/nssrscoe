import api from '../core/http';
import type { InnovativeIdea } from '../../types/innovativeIdea';
import type { GalleryItem } from './admin';
// ── Types ─────────────────────────────────────────────────────────────────────

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
    approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface SliderImageData {
    id: number;
    url: string;
    description: string;
    eventId?: number;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface EventImageData { url: string; isMaster?: boolean; caption?: string; }
export interface EventImage extends EventImageData { id: number; eventId: number; createdAt: string; }

export interface EventRegistration {
    id: number; eventId: number; name: string; email: string;
    phone: string; department: string; year: string;
    visitorPassId?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: string | null;
    approvedById?: number | null;
    hasAttended: boolean;
    createdAt?: string;
}

export interface RegistrationWithEvent { registration: EventRegistration; event: EventData; }

// ── APIs ──────────────────────────────────────────────────────────────────────

export const authAPI = {
    login: (email: string, password: string) =>
        api.post<{ token: string; role: 'admin' | 'volunteer'; user: { id: number; name?: string; username?: string; email?: string } }>('/auth/login', { email, password }),
    verify: () => api.get<{ valid: boolean; role: 'admin' | 'volunteer'; user: unknown }>('/auth/verify'),
};

export const eventsAPI = {
    getAll:  ()                              => api.get<EventData[]>('/events'),
    create:  (data: EventData)               => api.post<EventData>('/events', data),
    update:  (id: number, data: Partial<EventData>) => api.put<EventData>(`/events/${id}`, data),
    delete:  (id: number)                    => api.delete(`/events/${id}`),
};

export const sliderAPI = {
    getAll: () => api.get<SliderImageData[]>('/slider'),
    create: (data: Partial<SliderImageData>) => api.post<SliderImageData>('/slider', data),
    update: (id: number, data: Partial<SliderImageData>) => api.put<SliderImageData>(`/slider/${id}`, data),
    delete: (id: number) => api.delete<void>(`/slider/${id}`),
};

export const approvalsAPI = {
    getPending: () => api.get<{ events: EventData[]; sliderImages: SliderImageData[]; innovativeIdeas: InnovativeIdea[]; gallery: GalleryItem[]; totalPending: number }>('/approvals/pending'),
    approveEvent: (id: number) => api.patch(`/approvals/events/${id}/approve`),
    rejectEvent: (id: number) => api.patch(`/approvals/events/${id}/reject`),
    approveSlider: (id: number) => api.patch(`/approvals/sliders/${id}/approve`),
    rejectSlider: (id: number) => api.patch(`/approvals/sliders/${id}/reject`),
    approveInnovativeIdea: (id: number) => api.patch(`/approvals/innovative-ideas/${id}/approve`),
    rejectInnovativeIdea: (id: number) => api.patch(`/approvals/innovative-ideas/${id}/reject`),
    approveGallery: (id: number) => api.patch(`/approvals/gallery/${id}/approve`),
    rejectGallery: (id: number) => api.patch(`/approvals/gallery/${id}/reject`),
};

export const eventImagesAPI = {
    getByEvent: (eventId: number) => api.get<EventImage[]>(`/event-images/${eventId}`),
    add:        (eventId: number, images: EventImageData[]) => api.post<EventImage[]>(`/event-images/${eventId}`, { images }),
    setMaster:  (eventId: number, imageId: number) => api.put<EventImage>(`/event-images/${eventId}/master/${imageId}`),
    update:     (imageId: number, data: Partial<EventImageData>) => api.put<EventImage>(`/event-images/${imageId}`, data),
    delete:     (imageId: number) => api.delete(`/event-images/${imageId}`),
};

export const registrationsAPI = {
    create:         (data: Omit<EventRegistration, 'id' | 'createdAt' | 'visitorPassId' | 'status' | 'approvedAt' | 'approvedById' | 'hasAttended'>) =>
        api.post<EventRegistration>('/registrations', data),
    getByVisitorId: (visitorId: string) => api.get<EventRegistration>(`/registrations/visitor/${visitorId}`),
    getByEventId:   (eventId: number)   => api.get<EventRegistration[]>(`/registrations/event/${eventId}`),
    approve:        (id: number)        => api.patch(`/registrations/${id}/approve`),
    reject:         (id: number)        => api.patch(`/registrations/${id}/reject`),
    toggleAttendance: (id: number, hasAttended: boolean) => api.patch(`/registrations/${id}/attendance`, { hasAttended }),
};
