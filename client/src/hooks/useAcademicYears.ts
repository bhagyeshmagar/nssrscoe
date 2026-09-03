import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { academicYearsAPI } from '../services/api';
import type { CreateAYData } from '../services/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export const academicYearKeys = {
    all: ['academicYears'] as const,
    current: () => [...academicYearKeys.all, 'current'] as const,
    detail: (id: number) => [...academicYearKeys.all, 'detail', id] as const,
    stats: (id: number) => [...academicYearKeys.all, 'stats', id] as const,
};

export const useAcademicYears = () => {
    return useQuery({
        queryKey: academicYearKeys.all,
        queryFn: async () => {
            const response = await academicYearsAPI.getAll();
            return response.data.data;
        }
    });
};

export const useCurrentAcademicYear = () => {
    return useQuery({
        queryKey: academicYearKeys.current(),
        queryFn: async () => {
            try {
                const response = await academicYearsAPI.getCurrent();
                return response.data.data;
            } catch (error) {
                // If there's no current academic year, the API might return 404
                // We don't want to throw this as a hard error for React Query
                return null;
            }
        },
        retry: false, // Don't retry if 404
    });
};

export const useAcademicYearStats = (ayId: number | null) => {
    return useQuery({
        queryKey: ayId ? academicYearKeys.stats(ayId) : [...academicYearKeys.all, 'stats', 'none'] as const,
        queryFn: async () => {
            try {
                const response = await academicYearsAPI.getStats(ayId!);
                return response.data.data;
            } catch (error) {
                if (error instanceof AxiosError && error.response?.status === 404) {
                    return null;
                }
                throw error;
            }
        },
        enabled: !!ayId,
    });
};

export const useCreateAY = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateAYData) => academicYearsAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: academicYearKeys.all });
            toast.success('Academic Year created successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Create AY error:', error);
            toast.error(error.response?.data?.message || 'Failed to create academic year');
        }
    });
};

export const useUpdateAY = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateAYData> }) => academicYearsAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: academicYearKeys.all });
            toast.success('Academic Year updated successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Update AY error:', error);
            toast.error(error.response?.data?.message || 'Failed to update academic year');
        }
    });
};

const useAYAction = <TArgs>(
    action: (args: TArgs) => Promise<unknown>,
    successMessage: string,
    errorFallback: string,
    extraInvalidate?: readonly QueryKey[]
) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (args: TArgs) => action(args),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: academicYearKeys.all });
            extraInvalidate?.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
            toast.success(successMessage);
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error(`${successMessage} error:`, error);
            toast.error(error.response?.data?.message || errorFallback);
        }
    });
};

export const useActivateAY = () =>
    useAYAction((id: number) => academicYearsAPI.activate(id), 'Academic Year activated', 'Failed to activate academic year');

export const useLockAY = () =>
    useAYAction((id: number) => academicYearsAPI.lock(id), 'Academic Year locked successfully', 'Failed to lock academic year');

export const useUnlockAY = () =>
    useAYAction(({ id, password }: { id: number; password: string }) => academicYearsAPI.unlock(id, password), 'Academic Year unlocked successfully', 'Failed to unlock academic year');

export const useArchiveAY = () =>
    useAYAction((id: number) => academicYearsAPI.archive(id), 'Academic Year archived', 'Failed to archive academic year');

export const useUnarchiveAY = () =>
    useAYAction((id: number) => academicYearsAPI.unarchive(id), 'Academic Year unarchived', 'Failed to unarchive academic year');

export const useDeleteAY = () =>
    useAYAction((id: number) => academicYearsAPI.delete(id), 'Academic Year deleted', 'Failed to delete academic year');
