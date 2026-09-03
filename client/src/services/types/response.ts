/**
 * Shared API response envelope types.
 * Import from here (not from core/http.ts) when you only need types, not the axios instance.
 */

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: unknown;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
