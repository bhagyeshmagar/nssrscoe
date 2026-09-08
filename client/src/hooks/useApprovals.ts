import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { approvalsAPI } from '../services/api';
import type { EventData, SliderImageData, GalleryItem } from '../services/api';
import type { InnovativeIdea } from '../types/innovativeIdea';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errors';

export interface PendingApprovals {
    events: EventData[];
    sliderImages: SliderImageData[];
    innovativeIdeas: InnovativeIdea[];
    gallery: GalleryItem[];
    eventRegistrations?: any[];
    totalPending: number;
}

export const usePendingApprovals = (options?: { enabled?: boolean }) => {
    return useQuery<PendingApprovals>({
        queryKey: ['pendingApprovals'],
        queryFn: async () => {
            const response = await approvalsAPI.getPending();
            return response.data.data;
        },
        retry: false,
        enabled: options?.enabled ?? true,
        staleTime: 0,             // Always re-fetch on mount — badge must be accurate
        refetchInterval: 30_000,  // Poll every 30s as backup to invalidateQueries
        refetchOnWindowFocus: true,
    });
};

const useApprovalMutation = <T,>(
    mutationFn: (id: number) => Promise<{ data: T }>,
    relatedKey: QueryKey,
    categoryKey: 'events' | 'sliderImages' | 'innovativeIdeas' | 'gallery'
) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => (await mutationFn(id)).data,
        onMutate: async (id: number) => {
            await queryClient.cancelQueries({ queryKey: ['pendingApprovals'] });
            const previousApprovals = queryClient.getQueryData<PendingApprovals>(['pendingApprovals']);
            
            if (previousApprovals) {
                queryClient.setQueryData<PendingApprovals>(['pendingApprovals'], {
                    ...previousApprovals,
                    [categoryKey]: (previousApprovals[categoryKey] as any[]).filter(item => item.id !== id),
                    totalPending: Math.max(0, previousApprovals.totalPending - 1),
                });
            }
            return { previousApprovals };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
            queryClient.invalidateQueries({ queryKey: relatedKey });
        },
        onError: (error: unknown, _id, context) => {
            if (context?.previousApprovals) {
                queryClient.setQueryData(['pendingApprovals'], context.previousApprovals);
            }
            console.error('Approval action failed:', error);
            const message = getErrorMessage(error) ?? 'Action failed';
            toast.error(message);
        }
    });
};

export const useApproveEvent = () => useApprovalMutation(approvalsAPI.approveEvent, ['events'], 'events');
export const useRejectEvent = () => useApprovalMutation(approvalsAPI.rejectEvent, ['events'], 'events');
export const useApproveSlider = () => useApprovalMutation(approvalsAPI.approveSlider, ['sliderImages'], 'sliderImages');
export const useRejectSlider = () => useApprovalMutation(approvalsAPI.rejectSlider, ['sliderImages'], 'sliderImages');
export const useApproveInnovativeIdea = () => useApprovalMutation(approvalsAPI.approveInnovativeIdea, ['adminInnovativeIdeas'], 'innovativeIdeas');
export const useRejectInnovativeIdea = () => useApprovalMutation(approvalsAPI.rejectInnovativeIdea, ['adminInnovativeIdeas'], 'innovativeIdeas');
export const useApproveGallery = () => useApprovalMutation(approvalsAPI.approveGallery, ['adminGallery'], 'gallery');
export const useRejectGallery = () => useApprovalMutation(approvalsAPI.rejectGallery, ['adminGallery'], 'gallery');
