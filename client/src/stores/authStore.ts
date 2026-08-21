import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Decode the JWT payload without verifying signature (verification happens server-side). */
const getTokenExpiry = (token: string): number | null => {
    try {
        const payload = token.split('.')[1];
        if (!payload) return null;
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        return typeof decoded.exp === 'number' ? decoded.exp : null;
    } catch {
        return null;
    }
};

const isTokenExpired = (token: string): boolean => {
    const exp = getTokenExpiry(token);
    if (exp === null) return true; // treat unreadable tokens as expired
    // Add a 30-second buffer so we don't use a token about to expire
    return Date.now() / 1000 >= exp - 30;
};

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
            getIsLoggedIn: () => {
                const { token } = get();
                if (!token) return false;
                if (isTokenExpired(token)) {
                    // Auto-clear stale token
                    set({ token: null, userRole: null });
                    return false;
                }
                return true;
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
