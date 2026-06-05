/** Centralised error hierarchy. All custom errors extend AppError so that the
 *  error-handling middleware can produce consistent JSON responses. */
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

export class ValidationError extends AppError {
    public readonly issues?: unknown;
    constructor(message: string, issues?: unknown) {
        super(message, 400, 'VALIDATION_ERROR');
        this.issues = issues;
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT');
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string, code = 'FORBIDDEN') {
        super(message, 403, code);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

// ── AY-specific errors ────────────────────────────────────────────────────────

export class AYLockedError extends ForbiddenError {
    constructor(label?: string) {
        super(
            label
                ? `Academic year "${label}" is locked and cannot be modified.`
                : 'This academic year is locked and cannot be modified.',
            'AY_LOCKED',
        );
    }
}

export class AYNotCurrentError extends ForbiddenError {
    constructor(label?: string) {
        super(
            label
                ? `Academic year "${label}" is not the active year.`
                : 'This operation requires the currently active academic year.',
            'AY_NOT_CURRENT',
        );
    }
}

export class AYArchivedError extends ForbiddenError {
    constructor(label?: string) {
        super(
            label
                ? `Academic year "${label}" is archived.`
                : 'This academic year is archived.',
            'AY_ARCHIVED',
        );
    }
}

export class VolunteerCapExceededError extends ConflictError {
    constructor(cap: number) {
        super(`Regular volunteer limit of ${cap} for this academic year has been reached.`);
    }
}

export class RoleAssignmentError extends AppError {
    constructor(message: string) {
        super(message, 400, 'ROLE_ASSIGNMENT_ERROR');
    }
}

export const catchAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};
