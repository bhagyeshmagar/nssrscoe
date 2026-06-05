import { z } from 'zod';
import { departmentEnum, volunteerStatusEnum } from '../../db/schema';

// We extract enum values directly from the schema if possible, or redefine them here for zod
const DEPARTMENTS = [
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

export const createVolunteerSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').max(255),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        department: z.string().refine(val => DEPARTMENTS.includes(val as any), { message: 'Invalid department' }),
        status: z.enum(['regular', 'backup']).optional(),
    }),
});

export const updateVolunteerStatusSchema = z.object({
    body: z.object({
        status: z.enum(['regular', 'backup']),
    }),
});

export const updateVolunteerProfileSchema = z.object({
    body: z.object({
        fullName: z.string().min(1).max(255),
        prnNo: z.string().max(50).optional(),
        collegeYearAtEnrollment: z.string().max(20).optional(),
        nssYear: z.string().max(20).optional(),
        cgpa: z.string().max(10).optional(),
        eligibilityNo: z.string().max(50).optional(),
        religion: z.string().max(50).optional(),
        caste: z.string().max(50).optional(),
        casteCategory: z.string().max(50).optional(),
        phoneNo: z.string().max(20).optional(),
        experienceText: z.string().optional(),
    }),
});
