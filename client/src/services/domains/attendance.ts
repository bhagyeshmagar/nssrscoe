import api from '../core/http';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── API ───────────────────────────────────────────────────────────────────────

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
