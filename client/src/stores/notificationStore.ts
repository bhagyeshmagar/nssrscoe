import { create } from 'zustand';
import type { AppNotification } from '../services/api';
import { notificationsAPI } from '../services/api';

interface NotificationState {
    notifications: AppNotification[];
    loading: boolean;
    setNotifications: (notifications: AppNotification[]) => void;
    addNotification: (notification: AppNotification) => void;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    loading: false,
    
    setNotifications: (notifications) => set({ notifications }),
    
    addNotification: (notification) => set((state) => ({ 
        notifications: [notification, ...state.notifications] 
    })),
    
    markAsRead: async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            set((state) => ({
                notifications: state.notifications.map((n) => 
                    n.id === id ? { ...n, isRead: true } : n
                )
            }));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    },
    
    markAllAsRead: async () => {
        try {
            await notificationsAPI.markAllAsRead();
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
            }));
        } catch (error) {
            console.error('Failed to mark all notifications as read', error);
        }
    },

    fetchNotifications: async () => {
        set({ loading: true });
        try {
            const res = await notificationsAPI.getMy();
            set({ notifications: res.data.data?.notifications || [] });
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            set({ loading: false });
        }
    }
}));
