import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { galleryAPI } from '../services/api';
import type { GalleryData } from '../services/api';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

export const galleryKeys = {
    all: ['gallery'] as const,
    admin: () => [...galleryKeys.all, 'admin'] as const,
};

export const useGallery = (isAdmin = false) => {
    return useQuery({
        queryKey: isAdmin ? galleryKeys.admin() : galleryKeys.all,
        queryFn: async () => {
            const response = isAdmin ? await galleryAPI.getAdminAll() : await galleryAPI.getAll();
            return response.data.data;
        }
    });
};

export const useCreateGalleryItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: GalleryData) => galleryAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: galleryKeys.all });
            toast.success('Gallery item added successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Create gallery error:', error);
            toast.error(error.response?.data?.message || 'Failed to add gallery item');
        }
    });
};

export const useUpdateGalleryItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<GalleryData> }) => galleryAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: galleryKeys.all });
            toast.success('Gallery item updated successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Update gallery error:', error);
            toast.error(error.response?.data?.message || 'Failed to update gallery item');
        }
    });
};

export const useDeleteGalleryItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => galleryAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: galleryKeys.all });
            toast.success('Gallery item deleted successfully');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Delete gallery error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete gallery item');
        }
    });
};

export const useApproveGalleryItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => galleryAPI.approve(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: galleryKeys.all });
            toast.success('Gallery item approved');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Approve gallery error:', error);
            toast.error(error.response?.data?.message || 'Failed to approve gallery item');
        }
    });
};

export const useRejectGalleryItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) => galleryAPI.reject(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: galleryKeys.all });
            toast.success('Gallery item rejected');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            console.error('Reject gallery error:', error);
            toast.error(error.response?.data?.message || 'Failed to reject gallery item');
        }
    });
};
