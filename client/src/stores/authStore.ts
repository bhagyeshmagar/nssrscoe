import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    token: string | null;
    userRole: string | null;
    setAuth: (token: string, userRole: string) => void;
    clearAuth: () => void;
    getIsLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            userRole: null,
            setAuth: (token, userRole) => set({ token, userRole }),
            clearAuth: () => set({ token: null, userRole: null }),
            getIsLoggedIn: () => !!get().token,
        }),
        {
            name: 'auth-storage', // name of the item in the storage (must be unique)
        }
    )
);
