import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { Server as HttpServer } from 'http';

let io: Server;

// Map to store connected clients: volunteerId -> socketId[]
const connectedClients = new Map<number, string[]>();

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST']
        }
    });

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
            if (err) return next(new Error('Authentication error'));
            socket.data.user = decoded; // { id, role, email, etc. }
            next();
        });
    });

    io.on('connection', (socket: Socket) => {
        const user = socket.data.user;
        if (user && user.role === 'volunteer') {
            const volunteerId = user.id as number;

            // Add socket to connected clients
            const userSockets = connectedClients.get(volunteerId) || [];
            userSockets.push(socket.id);
            connectedClients.set(volunteerId, userSockets);

            // Join personal room AND a shared volunteers room for broadcasts
            socket.join(`volunteer_${volunteerId}`);
            socket.join('volunteers');

            socket.on('disconnect', () => {
                const sockets = connectedClients.get(volunteerId) || [];
                const index = sockets.indexOf(socket.id);
                if (index !== -1) {
                    sockets.splice(index, 1);
                    if (sockets.length === 0) {
                        connectedClients.delete(volunteerId);
                    } else {
                        connectedClients.set(volunteerId, sockets);
                    }
                }
            });
        }
    });
};

export const emitToVolunteer = (volunteerId: number, event: string, data: unknown) => {
    if (io) {
        io.to(`volunteer_${volunteerId}`).emit(event, data);
    }
};

export const broadcastToAllVolunteers = (event: string, data: unknown) => {
    if (io) {
        // Emit only to the 'volunteers' room so admins (if ever connected) are not affected
        io.to('volunteers').emit(event, data);
    }
};
