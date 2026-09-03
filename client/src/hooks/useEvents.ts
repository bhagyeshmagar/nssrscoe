import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '../services/api';
import type { EventData } from '../services/api';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

export const eventKeys = {
    all: ['events'] as const,
};

export const useEvents = () => {
    return useQuery({
        queryKey: eventKeys.all,
        queryFn: async () => {
            const response = await eventsAPI.getAll();
            return response.data.data;
        }
    }); 
};

export const useCreateEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: EventData) => eventsAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.all });
            toast.success('Event created successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Create event error:', error);
            toast.error(error.response?.data?.message || 'Failed to create event');
        }
    });
};

export const useUpdateEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<EventData> }) => eventsAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.all });
            toast.success('Event updated successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Update event error:', error);
            toast.error(error.response?.data?.message || 'Failed to update event');
        }
    });
};

export const useDeleteEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => eventsAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.all });
            toast.success('Event deleted successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Delete event error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete event');
        }
    });
};
