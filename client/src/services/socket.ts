import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket: Socket | null = null;

export const connectSocket = () => {
    const { token, userRole } = useAuthStore.getState();

    if (!token) return;

    if (!socket) {
        socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
            auth: { token },
            query: { role: userRole }
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket?.id);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;
