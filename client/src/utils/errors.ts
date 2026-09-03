import axios from 'axios';

export const getErrorMessage = (e: unknown): string | null => {
    if (axios.isAxiosError<{ message?: string }>(e)) {
        return e.response?.data?.message ?? e.message ?? null;
    }
    return null;
};
