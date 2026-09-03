import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { volunteersAPI } from '../services/api';
import type { VolunteerFilters, CreateVolunteerData } from '../services/api';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

export const volunteerKeys = {
    all: ['volunteers'] as const,
    byAY: (ayId: number | null, filters?: VolunteerFilters) => 
        [...volunteerKeys.all, 'ay', ayId, filters] as const,
    detail: (ayId: number | null, id: number) => 
        [...volunteerKeys.all, 'ay', ayId, 'detail', id] as const,
};

export const useVolunteersByAY = (ayId: number | null, filters?: VolunteerFilters & { page?: number; limit?: number }) => {
    return useQuery({
        queryKey: volunteerKeys.byAY(ayId, filters),
        queryFn: async () => {
            if (!ayId) return { data: [], meta: null };
            const response = await volunteersAPI.getByAY(ayId, filters);
            return response.data.data;
        },
        enabled: !!ayId,
    });
};

export const useVolunteer = (ayId: number | null, id: number | null) => {
    return useQuery({
        queryKey: volunteerKeys.detail(ayId, id!),
        queryFn: async () => {
            if (!ayId || !id) return null;
            const response = await volunteersAPI.getById(ayId, id);
            return response.data.data;
        },
        enabled: !!ayId && !!id,
    });
};

export const useCreateVolunteer = (ayId: number | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateVolunteerData) => {
            if (!ayId) throw new Error("Academic Year ID is required");
            return volunteersAPI.create(ayId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
            toast.success('Volunteer added successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Create volunteer error:', error);
            toast.error(error.response?.data?.message || 'Failed to add volunteer');
        }
    });
};

export const useUpdateVolunteer = (ayId: number | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateVolunteerData> }) => {
            if (!ayId) throw new Error("Academic Year ID is required");
            return volunteersAPI.update(ayId, id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
            toast.success('Volunteer updated successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Update volunteer error:', error);
            toast.error(error.response?.data?.message || 'Failed to update volunteer');
        }
    });
};

export const useDeleteVolunteer = (ayId: number | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => {
            if (!ayId) throw new Error("Academic Year ID is required");
            return volunteersAPI.delete(ayId, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
            toast.success('Volunteer deleted successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Delete volunteer error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete volunteer');
        }
    });
};

export const useChangeVolunteerStatus = (ayId: number | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: 'regular' | 'backup' }) => {
            if (!ayId) throw new Error("Academic Year ID is required");
            return volunteersAPI.changeStatus(ayId, id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
            toast.success('Volunteer status updated');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Change volunteer status error:', error);
            toast.error(error.response?.data?.message || 'Failed to change volunteer status');
        }
    });
};

export const useToggleVolunteerActive = (ayId: number | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => {
            if (!ayId) throw new Error("Academic Year ID is required");
            return volunteersAPI.toggleActive(ayId, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
            toast.success('Volunteer active state toggled');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Toggle volunteer active error:', error);
            toast.error(error.response?.data?.message || 'Failed to toggle active state');
        }
    });
};
