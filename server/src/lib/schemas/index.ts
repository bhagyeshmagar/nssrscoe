  /**
 * Centralised Zod request schemas.
 *
 * Each schema validates { body?, query?, params? } so the validateRequest
 * middleware can check the entire request object in one call.
 *
 * Conventions:
 *   - body fields are trimmed at the type level via .trim()
 *   - IDs that come from URL params are validated as positive integers
 *   - All enums mirror the DB CHECK constraints in schema.ts exactly
 */

import { z } from 'zod';
import { DEPARTMENTS } from '../db-constants';

// ── Re-export domain schemas ─────────────────────────────────────────────────
export { createVolunteerSchema, updateVolunteerStatusSchema, updateVolunteerProfileSchema } from './volunteer.schema';
export { createMeetingSchema, updateMeetingSchema } from './meeting.schema';

// ── Common reusables ──────────────────────────────────────────────────────────

/** Coerces a URL param or query string to a positive integer. */
export const positiveIntParam = z.string().regex(/^\d+$/, 'Must be a positive integer').transform(Number);

/** Pagination query params with sane bounds. */
export const paginationQuery = z.object({
    page:  z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// ── Academic Years ────────────────────────────────────────────────────────────

export const createAYSchema = z.object({
    body: z.object({
        label:        z.string().trim().regex(/^\d{4}-\d{2}$/, 'Label must be in "YYYY-YY" format (e.g. "2024-25")'),
        startDate:    z.string().trim().min(1, 'Start date is required'),
        endDate:      z.string().trim().min(1, 'End date is required'),
        volunteerCap: z.number().int().min(1).max(1000).optional(),
    }),
});

export const updateAYSchema = z.object({
    body: z.object({
        label:                    z.string().trim().regex(/^\d{4}-\d{2}$/).optional(),
        startDate:                z.string().trim().optional(),
        endDate:                  z.string().trim().optional(),
        volunteerCap:             z.number().int().min(1).max(1000).optional(),
        regularActivityReportUrl: z.string().trim().url().optional().or(z.literal('')),
        specialCampReportUrl:     z.string().trim().url().optional().or(z.literal('')),
    }),
});

export const unlockAYSchema = z.object({
    body: z.object({
        password: z.string().min(1, 'Password is required to unlock.'),
    }),
});

// ── Events ────────────────────────────────────────────────────────────────────

export const createEventSchema = z.object({
    body: z.object({
        title:       z.string().trim().min(1, 'Title is required').max(255),
        description: z.string().trim().min(1, 'Description is required'),
        location:    z.string().trim().min(1, 'Location is required').max(255),
        date:        z.string().min(1, 'Date is required'),
        reportUrl:   z.string().trim().url().optional().or(z.literal('')).nullable(),
        driveLink:   z.string().trim().url().optional().or(z.literal('')).nullable(),
    }),
});

export const updateEventSchema = z.object({
    body: z.object({
        title:       z.string().trim().min(1).max(255).optional(),
        description: z.string().trim().optional(),
        location:    z.string().trim().min(1).max(255).optional(),
        date:        z.string().optional(),
        reportUrl:   z.string().trim().url().optional().or(z.literal('')).nullable(),
        driveLink:   z.string().trim().url().optional().or(z.literal('')).nullable(),
    }),
});

// ── Event Images ──────────────────────────────────────────────────────────────

const eventImageItem = z.object({
    url:      z.string().trim().min(1, 'Image URL is required'),
    isMaster: z.boolean().optional().default(false),
    caption:  z.string().trim().max(255).optional().nullable(),
});

export const addEventImagesSchema = z.object({
    body: z.object({
        images: z.array(eventImageItem).min(1, 'At least one image is required').max(20, 'Maximum 20 images per request'),
    }),
});

export const updateEventImageSchema = z.object({
    body: z.object({
        caption:  z.string().trim().max(255).optional().nullable(),
        isMaster: z.boolean().optional(),
    }),
});

// ── Gallery ───────────────────────────────────────────────────────────────────

export const createGallerySchema = z.object({
    body: z.object({
        title:       z.string().trim().max(255).optional().nullable(),
        description: z.string().trim().default(''),
        url:         z.string().trim().min(1, 'URL is required'),
        type:        z.enum(['image', 'video']).default('image'),
    }),
});

export const rejectGallerySchema = z.object({
    body: z.object({
        reason: z.string().trim().max(500).optional().nullable(),
    }),
});

// ── Registrations ─────────────────────────────────────────────────────────────

export const createRegistrationSchema = z.object({
    body: z.object({
        eventId:    z.number({ error: 'Event ID is required' }).int().positive(),
        name:       z.string().trim().min(1, 'Name is required').max(255),
        email:      z.string().trim().email('Invalid email address'),
        phone:      z.string().trim().min(7, 'Phone number too short').max(20),
        department: z.string().trim().min(1, 'Department is required').max(100),
        year:       z.string().trim().min(1, 'Year is required').max(20),
    }),
});

// ── Attendance ────────────────────────────────────────────────────────────────

const attendanceStatusEnum = z.enum(['present', 'absent', 'late']);

export const createSessionSchema = z.object({
    body: z.object({
        title:       z.string().trim().min(1, 'Title is required').max(255),
        date:        z.string().trim().min(1, 'Date is required'),
        eventId:     z.number().int().positive().optional(),
        description: z.string().trim().optional(),
    }),
});

export const markAttendanceSchema = z.object({
    body: z.object({
        records: z.array(z.object({
            volunteerId: z.number().int().positive(),
            status:      attendanceStatusEnum,
            notes:       z.string().trim().max(500).optional(),
        })).min(1, 'At least one record is required'),
    }),
});

// ── Special Camps ─────────────────────────────────────────────────────────────

export const createCampSchema = z.object({
    body: z.object({
        name:         z.string().trim().min(1, 'Camp name is required').max(255),
        location:     z.string().trim().min(1, 'Location is required').max(255),
        startDate:    z.string().trim().min(1, 'Start date is required'),
        endDate:      z.string().trim().min(1, 'End date is required'),
        description:  z.string().trim().optional(),
        volunteerCap: z.number().int().min(1).max(500).optional(),
    }),
});

export const updateCampSchema = z.object({
    body: z.object({
        name:         z.string().trim().min(1).max(255).optional(),
        location:     z.string().trim().min(1).max(255).optional(),
        startDate:    z.string().trim().optional(),
        endDate:      z.string().trim().optional(),
        description:  z.string().trim().optional(),
        volunteerCap: z.number().int().min(1).max(500).optional(),
    }),
});

export const addParticipantSchema = z.object({
    body: z.object({
        volunteerId: z.number({ error: 'volunteerId is required' }).int().positive(),
    }),
});

export const setParticipantsBulkSchema = z.object({
    body: z.object({
        volunteerIds: z.array(z.number().int().positive())
            .min(1, 'At least one volunteer is required')
            .max(500, 'Too many volunteers'),
    }),
});

export const unlockCampSchema = z.object({
    body: z.object({
        password: z.string().min(1, 'Password is required to unlock the camp.'),
    }),
});

// ── Site Settings ─────────────────────────────────────────────────────────────

/** Exhaustive list of allowed setting keys — prevents arbitrary key injection. */
export const ALLOWED_SETTING_KEYS = new Set([
    'heroTitle', 'heroSubtitle', 'heroCta',
    'statEventsCount', 'statEventsLabel',
    'statVolunteersCount', 'statVolunteersLabel',
    'statImpactCount', 'statImpactLabel',
    'statCampsCount', 'statCampsLabel',
    'statHoursCount', 'statHoursLabel',
    'aboutMission', 'aboutHistory', 'aboutText', 'aboutTeamPhoto',
    'aboutDirectorMessage', 'aboutDirectorName', 'aboutDirectorPhoto',
    'aboutPoMessage', 'aboutPoName', 'aboutPoPhoto',
    'aboutTitle',
    'registrationOpen', 'contactEmail', 'contactPhone', 'contactAddress',
    'socialInstagram', 'socialFacebook', 'socialTwitter', 'socialYoutube',
    'homeSliderImages',
]);

export const updateSettingsSchema = z.object({
    body: z.record(z.string(), z.string().max(50000))
        .refine(
            (obj) => Object.keys(obj).every(k => ALLOWED_SETTING_KEYS.has(k)),
            { message: 'One or more setting keys are not allowed.' }
        ),
});

// ── Admin management ──────────────────────────────────────────────────────────

export const createAdminSchema = z.object({
    body: z.object({
        username:     z.string().trim().min(3, 'Username must be at least 3 characters').max(100),
        password:     z.string().min(8, 'Password must be at least 8 characters'),
        isSuperadmin: z.boolean().optional().default(false),
    }),
});

export const updateAdminSchema = z.object({
    body: z.object({
        username:     z.string().trim().min(3).max(100).optional(),
        password:     z.string().min(8).optional(),
        isSuperadmin: z.boolean().optional(),
    }),
});

// ── Core team ─────────────────────────────────────────────────────────────────

export const assignRoleSchema = z.object({
    body: z.object({
        coreTeamRoleId:  z.number().int(),
        volunteerId:     z.number().int().positive().optional(),
        displayName:     z.string().trim().max(255).optional(),
        displayPhotoUrl: z.string().trim().url().optional().or(z.literal('')).nullable(),
        department:      z.string().trim().max(100).optional(),
        customRoleName:  z.string().trim().max(100).optional(),
        customCategory:  z.string().trim().max(100).optional(),
        displayOrder:    z.number().int().min(0).optional(),
    }),
});

export const updateAssignmentSchema = z.object({
    body: z.object({
        displayName:     z.string().trim().max(255).optional(),
        displayPhotoUrl: z.string().trim().url().optional().or(z.literal('')).nullable(),
        displayOrder:    z.number().int().min(0).optional(),
        volunteerId:     z.number().int().positive().optional(),
    }),
});
