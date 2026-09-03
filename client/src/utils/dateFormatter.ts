import { format } from 'date-fns';

/**
 * Formats a date string, number, or Date object into 'dd/MMM/yyyy' format
 * (e.g., '27/Aug/2026').
 */
export const formatDate = (date: string | number | Date | null | undefined): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return format(d, 'dd/MMM/yyyy');
    } catch (e) {
        return '';
    }
};
