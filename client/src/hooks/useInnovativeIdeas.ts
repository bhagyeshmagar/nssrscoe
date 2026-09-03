import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { InnovativeIdea } from '../types/innovativeIdea';

export const useAdminInnovativeIdeas = (params: { search: string; status: string }) => {
    return useQuery({
        queryKey: ['adminInnovativeIdeas', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (params.search) searchParams.append('search', params.search);
            if (params.status !== 'all') searchParams.append('status', params.status);
            
            const res = await api.get<InnovativeIdea[]>(`/admin/innovative-ideas?${searchParams.toString()}`);
            return res.data.data;
        }
    });
};

export const usePublicInnovativeIdeas = (params: { category?: string; academicYearId?: number; search?: string; sort?: string }) => {
    return useQuery({
        queryKey: ['publicInnovativeIdeas', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (params.category && params.category !== 'all') searchParams.append('category', params.category);
            if (params.academicYearId) searchParams.append('academicYearId', params.academicYearId.toString());
            if (params.search) searchParams.append('search', params.search);
            if (params.sort && params.sort !== 'newest') searchParams.append('sort', params.sort);
            
            const res = await api.get<InnovativeIdea[]>(`/innovative-ideas/public?${searchParams.toString()}`);
            return res.data.data;
        }
    });
};

export const useVolunteerInnovativeIdeas = () => {
    return useQuery({
        queryKey: ['volunteerInnovativeIdeas'],
        queryFn: async () => {
            const res = await api.get<InnovativeIdea[]>('/innovative-ideas/me');
            return res.data.data;
        }
    });
};

export const useSubmitIdea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<InnovativeIdea>) => {
            const res = await api.post<InnovativeIdea>('/innovative-ideas', data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['volunteerInnovativeIdeas'] });
        }
    });
};

export const useUpdateIdea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InnovativeIdea> }) => {
            const res = await api.patch<InnovativeIdea>(`/innovative-ideas/${id}/request-update`, data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['volunteerInnovativeIdeas'] });
        }
    });
};

export const useRequestDeleteIdea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await api.patch<InnovativeIdea>(`/innovative-ideas/${id}/request-delete`);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['volunteerInnovativeIdeas'] });
        }
    });
};

export const useAdminDeleteIdea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await api.delete(`/admin/innovative-ideas/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminInnovativeIdeas'] });
        }
    });
};

export const useApproveIdea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, approveType }: { id: number; approveType: 'idea' | 'update' | 'delete' }) => {
            const res = await api.patch(`/admin/innovative-ideas/${id}/approve`, { approveType });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminInnovativeIdeas'] });
        }
    });
};

export const useRejectIdea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, rejectType, reason }: { id: number; rejectType: 'idea' | 'update' | 'delete'; reason?: string }) => {
            const res = await api.patch(`/admin/innovative-ideas/${id}/reject`, { rejectType, reason });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminInnovativeIdeas'] });
        }
    });
};

export const useAdminRestoreIdea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await api.put(`/admin/innovative-ideas/${id}/restore`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminInnovativeIdeas'] });
        }
    });
};
