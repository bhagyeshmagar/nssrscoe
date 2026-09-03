import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registrationsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

export const registrationKeys = {
    all: ['registrations'] as const,
    byEvent: (eventId: number | null) => [...registrationKeys.all, eventId] as const,
};

export const useRegistrationsByEvent = (eventId: number | null) => {
    return useQuery({
        queryKey: registrationKeys.byEvent(eventId),
        queryFn: async () => {
            if (!eventId) return [];
            const response = await registrationsAPI.getByEventId(eventId);
            return response.data.data;
        },
        enabled: !!eventId,
    });
};

export const useApproveRegistration = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => registrationsAPI.approve(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: registrationKeys.all });
            toast.success('Registration approved successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Approve registration error:', error);
            toast.error(error.response?.data?.message || 'Failed to approve registration');
        }
    });
};

export const useRejectRegistration = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => registrationsAPI.reject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: registrationKeys.all });
            toast.success('Registration rejected successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Reject registration error:', error);
            toast.error(error.response?.data?.message || 'Failed to reject registration');
        }
    });
};

export const useToggleAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, hasAttended }: { id: number; hasAttended: boolean }) => registrationsAPI.toggleAttendance(id, hasAttended),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: registrationKeys.all });
            toast.success('Attendance updated');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Toggle attendance error:', error);
            toast.error(error.response?.data?.message || 'Failed to update attendance');
        }
    });
};
