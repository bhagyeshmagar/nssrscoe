/**
 * Shared constant arrays that are used both in the Drizzle schema (for DB
 * CHECK constraints) and in Zod validation schemas. Keeping them here avoids
 * circular-import issues between db/schema.ts and lib/schemas/*.
 */

// IMPORTANT: Keep DEPARTMENTS in sync with client/src/lib/constants.ts
export const DEPARTMENTS = [
    'Computer Engineering',
    'Computer Science and Business Systems',
    'Information Technology',
    'Electronics and Telecommunication',
    'Electrical Engineering',
    'Automation and Robotics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Bachelor of Computer Applications',
] as const;

export type Department = typeof DEPARTMENTS[number];

export const EVENT_TYPES = ['upcoming', 'past'] as const;
export type EventType = typeof EVENT_TYPES[number];

export const REGISTRATION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type RegistrationStatus = typeof REGISTRATION_STATUSES[number];

export const MEDIA_TYPES = ['image', 'video'] as const;
export type MediaType = typeof MEDIA_TYPES[number];

export const ROLE_TYPES = ['institution', 'student'] as const;
export type RoleType = typeof ROLE_TYPES[number];
export const VOLUNTEER_STATUSES = ['regular', 'backup'] as const;
export type VolunteerStatus = typeof VOLUNTEER_STATUSES[number];

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late'] as const;
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

export const MEETING_TYPES = ['regular', 'core_team', 'special_camp'] as const;
export type MeetingType = typeof MEETING_TYPES[number];

export const MEETING_STATUSES = ['scheduled', 'active', 'ended'] as const;
export type MeetingStatus = typeof MEETING_STATUSES[number];
