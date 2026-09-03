import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminsAPI } from '../services/api';
import type { AdminData } from '../services/api';

export const adminKeys = {
    all: ['admins'] as const,
    me: ['admins', 'me'] as const,
};

// ── Admin Management (Superadmin Only) ────────────────────────────────────────

export const useAdmins = () => {
    return useQuery({
        queryKey: adminKeys.all,
        queryFn: async () => {
            const response = await adminsAPI.getAll();
            return response.data.data as AdminData[];
        }
    });
};

export const useAdminMutations = () => {
    const queryClient = useQueryClient();

    const createAdmin = useMutation({
        mutationFn: async (data: any) => {
            const response = await adminsAPI.create(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.all });
        }
    });

    const updateAdmin = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: any }) => {
            const response = await adminsAPI.update(id, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.all });
        }
    });

    const deleteAdmin = useMutation({
        mutationFn: async (id: number) => {
            const response = await adminsAPI.delete(id);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.all });
        }
    });

    return {
        createAdmin: createAdmin.mutateAsync,
        updateAdmin: updateAdmin.mutateAsync,
        deleteAdmin: deleteAdmin.mutateAsync,
        isCreating: createAdmin.isPending,
        isUpdating: updateAdmin.isPending,
        isDeleting: deleteAdmin.isPending,
    };
};

// ── Profile Management (Any Admin) ────────────────────────────────────────────

export const useProfile = () => {
    return useQuery({
        queryKey: adminKeys.me,
        queryFn: async () => {
            const response = await adminsAPI.getMe();
            return response.data.data;
        }
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const response = await adminsAPI.updateMe(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.me });
            queryClient.invalidateQueries({ queryKey: adminKeys.all });
        }
    });
};
