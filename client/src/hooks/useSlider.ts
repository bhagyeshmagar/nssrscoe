import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sliderAPI } from '../services/api';
import type { SliderImageData } from '../services/api';

export const useSliderImages = () => {
    return useQuery({
        queryKey: ['sliderImages'],
        queryFn: async () => {
            const response = await sliderAPI.getAll();
            return response.data.data as SliderImageData[];
        },
    });
};

export const useCreateSliderImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<SliderImageData>) => {
            const response = await sliderAPI.create(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sliderImages'] });
        },
    });
};

export const useUpdateSliderImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<SliderImageData> }) => {
            const response = await sliderAPI.update(id, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sliderImages'] });
        },
    });
};

export const useDeleteSliderImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await sliderAPI.delete(id);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sliderImages'] });
        },
    });
};
