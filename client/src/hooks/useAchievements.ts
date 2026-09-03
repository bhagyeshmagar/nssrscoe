import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Achievement } from '../types/achievement';

// ── Shared invalidation ──────────────────────────────────────────────────────

const invalidateAchievementQueries = (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['adminAchievements'] });
    queryClient.invalidateQueries({ queryKey: ['publicAchievements'] });
    queryClient.invalidateQueries({ queryKey: ['recentAchievements'] });
};

// ── Public ───────────────────────────────────────────────────────────────────

export const usePublicAchievements = (params?: { academicYearId?: number | string }) => {
    return useQuery({
        queryKey: ['publicAchievements', params],
        queryFn: async () => {
            const search = new URLSearchParams();
            if (params?.academicYearId && params.academicYearId !== 'all') {
                search.append('academicYearId', String(params.academicYearId));
            }
            const res = await api.get<Achievement[]>(`/achievements?${search.toString()}`);
            return res.data.data;
        },
    });
};

export const useRecentAchievements = (limit = 8) => {
    return useQuery({
        queryKey: ['recentAchievements', limit],
        queryFn: async () => {
            const search = new URLSearchParams();
            search.append('limit', String(limit));
            const res = await api.get<Achievement[]>(`/achievements?${search.toString()}`);
            return res.data.data;
        },
    });
};

// ── Admin ────────────────────────────────────────────────────────────────────

export const useAdminAchievements = (params?: { academicYearId?: number | string }) => {
    return useQuery({
        queryKey: ['adminAchievements', params],
        queryFn: async () => {
            const search = new URLSearchParams();
            if (params?.academicYearId && params.academicYearId !== 'all') {
                search.append('academicYearId', String(params.academicYearId));
            }
            const res = await api.get<Achievement[]>(`/admin/achievements?${search.toString()}`);
            return res.data.data;
        },
    });
};

type AchievementPayload = {
    title: string;
    description: string;
    imageUrl: string;
    date: string;
    academicYearId?: number | null;
};

export const useCreateAchievement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: AchievementPayload) => {
            const res = await api.post<Achievement>('/admin/achievements', data);
            return res.data.data;
        },
        onSuccess: () => invalidateAchievementQueries(queryClient),
    });
};

export const useUpdateAchievement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: AchievementPayload }) => {
            const res = await api.put<Achievement>(`/admin/achievements/${id}`, data);
            return res.data.data;
        },
        onSuccess: () => invalidateAchievementQueries(queryClient),
    });
};

export const useDeleteAchievement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/admin/achievements/${id}`);
        },
        onSuccess: () => invalidateAchievementQueries(queryClient),
    });
};

export const useRestoreAchievement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await api.put<Achievement>(`/admin/achievements/${id}/restore`);
            return res.data.data;
        },
        onSuccess: () => invalidateAchievementQueries(queryClient),
    });
};
