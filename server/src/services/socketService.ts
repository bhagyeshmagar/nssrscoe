import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server;

// Map to store connected clients: volunteerId -> socketId[]
const connectedClients = new Map<number, string[]>();

export const initSocket = (server: any) => {
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
            const volunteerId = user.id;
            
            // Add socket to connected clients
            const userSockets = connectedClients.get(volunteerId) || [];
            userSockets.push(socket.id);
            connectedClients.set(volunteerId, userSockets);

            // Join a personal room
            socket.join(`volunteer_${volunteerId}`);

            socket.on('disconnect', () => {
                const userSockets = connectedClients.get(volunteerId) || [];
                const index = userSockets.indexOf(socket.id);
                if (index !== -1) {
                    userSockets.splice(index, 1);
                    if (userSockets.length === 0) {
                        connectedClients.delete(volunteerId);
                    } else {
                        connectedClients.set(volunteerId, userSockets);
                    }
                }
            });
        }
    });
};

export const emitToVolunteer = (volunteerId: number, event: string, data: any) => {
    if (io) {
        io.to(`volunteer_${volunteerId}`).emit(event, data);
    }
};

export const broadcastToAllVolunteers = (event: string, data: any) => {
    if (io) {
        // Here we could either emit to a general 'volunteers' room or just broadcast if only volunteers connect
        // But for safety, we can just broadcast generally for now, or assume only volunteers use the socket
        io.emit(event, data);
    }
};
