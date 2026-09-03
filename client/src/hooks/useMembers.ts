import { useQuery } from '@tanstack/react-query';
import { membersAPI } from '../services/api';

export const memberKeys = {
    all: ['members'] as const,
};

export const useMembers = () => {
    return useQuery({
        queryKey: memberKeys.all,
        queryFn: async () => {
            const response = await membersAPI.getAll();
            return response.data.data;
        }
    });
};
