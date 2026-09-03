import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../services/api';
import type { SiteSettings } from '../services/api';
import { toast } from 'react-hot-toast';

export const settingsKeys = {
    all: ['settings'] as const,
};

export const useSettings = () => {
    return useQuery({
        queryKey: settingsKeys.all,
        queryFn: async () => {
            const response = await settingsAPI.get();
            return response.data.data;
        }
    });
};

export const useUpdateSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<SiteSettings>) => settingsAPI.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.all });
            toast.success('Settings updated successfully');
        },
        onError: (error: any) => {
            console.error('Update settings error:', error);
            toast.error(error.response?.data?.message || 'Failed to update settings');
        }
    });
};
