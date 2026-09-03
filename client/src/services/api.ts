/**
 * api.ts — barrel re-export.
 * All implementation lives in:
 *   services/core/http.ts          — axios instance, ApiResponse, PaginatedResponse, decodeToken, uploadAPI
 *   services/domains/academic.ts   — AcademicYear*, ActivityCalendarItem, AuditLog + APIs
 *   services/domains/volunteers.ts — Volunteer*, CoreTeam*, Department, DEPARTMENTS + APIs
 *   services/domains/attendance.ts — AttendanceSession*, AttendanceSummary* + attendanceAPI
 *   services/domains/events.ts     — EventData, SliderImageData, EventImage*, EventRegistration* + APIs
 *   services/domains/meetings.ts   — Meeting*, SpecialCamp* + APIs
 *   services/domains/admin.ts      — AdminData, SiteSettings, Gallery*, Member*, HodContact, Email*, AppNotification + APIs
 */

export { default } from './core/http';
export * from './core/http';
export * from './types/response';
export * from './domains/academic';
export * from './domains/volunteers';
export * from './domains/attendance';
export * from './domains/events';
export * from './domains/meetings';
export * from './domains/admin';
