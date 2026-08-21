import { z } from 'zod';

export const createMeetingSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').max(255),
        description: z.string().optional(),
        meetingType: z.enum(['regular', 'core_team', 'special_camp']),
        scheduledDate: z.string().min(1, 'Scheduled date is required'),
        location: z.string().min(1, 'Location is required').max(255),
        sendEmail: z.boolean().optional(),
        specialCampId: z.number().optional(),
    }),
});

export const updateMeetingSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        meetingType: z.enum(['regular', 'core_team', 'special_camp']).optional(),
        scheduledDate: z.string().min(1).optional(),
        location: z.string().min(1).max(255).optional(),
        specialCampId: z.number().optional().nullable(),
    }),
});
