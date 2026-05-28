import { Response } from 'express';
import { AppError } from './errors';
import { ZodError } from 'zod';

interface PaginatedMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const ok = <T>(res: Response, data: T, message?: string, statusCode = 200): Response =>
    res.status(statusCode).json({ success: true, message, data });

export const created = <T>(res: Response, data: T, message = 'Created successfully'): Response =>
    res.status(201).json({ success: true, message, data });

export const paginated = <T>(
    res: Response,
    data: T[],
    meta: PaginatedMeta,
): Response =>
    res.status(200).json({ success: true, data, meta });

export const noContent = (res: Response): Response => res.status(204).send();

/** Central error responder. Handles AppError, ZodError, and unknown errors. */
export const handleError = (res: Response, error: unknown): Response => {
    if (error instanceof AppError) {
        const body: Record<string, unknown> = {
            success: false,
            code: error.code,
            message: error.message,
        };
        if ('issues' in error && error.issues) body.issues = error.issues;
        return res.status(error.statusCode).json(body);
    }

    if (error instanceof ZodError) {
        return res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            issues: error.issues,
        });
    }

    // Unexpected errors — log and return generic 500
    console.error('[UnhandledError]', error);
    return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
    });
};
