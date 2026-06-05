import { z } from 'zod';

export const createMeetingSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').max(255),
        description: z.string().optional(),
        meetingType: z.enum(['regular', 'core_team']),
        scheduledDate: z.string().datetime({ message: 'Must be a valid ISO 8601 date string' }).or(z.string().min(1)), // Fallback since frontend passes slice(0, 16)
        location: z.string().min(1, 'Location is required').max(255),
        sendEmail: z.boolean().optional(),
    }),
});

export const updateMeetingSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        meetingType: z.enum(['regular', 'core_team']).optional(),
        scheduledDate: z.string().min(1).optional(),
        location: z.string().min(1).max(255).optional(),
    }),
});
