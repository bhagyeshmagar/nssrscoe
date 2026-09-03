import api from '../core/http';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── APIs ──────────────────────────────────────────────────────────────────────

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
    markAttendance:   (meetingId: number, volunteerId: number, data: MarkMeetingAttendanceData) => api.post<unknown>(`/meetings/${meetingId}/attendance/volunteers/${volunteerId}`, data),
    getStats:         (meetingId: number) => api.get<{ stats: MeetingAttendanceStats }>(`/meetings/${meetingId}/attendance/stats`),
    exportAttendance: (meetingId: number) => api.get<MeetingAttendanceExportData>(`/meetings/${meetingId}/attendance/export`),
};

export const specialCampsAPI = {
    getByAY:          (ayId: number) => api.get<SpecialCamp[]>(`/academic-years/${ayId}/special-camps`),
    create:           (ayId: number, data: CreateCampData) =>
        api.post<SpecialCamp>(`/academic-years/${ayId}/special-camps`, data),
    getById:          (campId: number) => api.get<SpecialCampWithParticipants>(`/special-camps/${campId}`),
    update:           (campId: number, data: Partial<CreateCampData>) =>
        api.put<SpecialCamp>(`/special-camps/${campId}`, data),
    delete:           (campId: number) => api.delete(`/special-camps/${campId}`),
    addParticipant:   (campId: number, volunteerId: number) =>
        api.post<unknown>(`/special-camps/${campId}/participants`, { volunteerId }),
    removeParticipant:(campId: number, participantId: number) =>
        api.delete<unknown>(`/special-camps/${campId}/participants/${participantId}`),
    setParticipantsBulk: (campId: number, volunteerIds: number[]) =>
        api.put<unknown>(`/special-camps/${campId}/participants/bulk`, { volunteerIds }),
    finalize:         (campId: number) => api.post<SpecialCamp>(`/special-camps/${campId}/finalize`),
    unlock:           (campId: number, password: string) => api.post<SpecialCamp>(`/special-camps/${campId}/unlock`, { password }),
};
