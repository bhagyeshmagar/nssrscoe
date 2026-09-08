import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { Server as HttpServer } from 'http';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
        },
    });

    // ── Redis adapter (optional) ─────────────────────────────────────────────
    // When REDIS_URL is set, Socket.IO events are routed through Redis so that
    // emitting from any server instance reaches clients connected to any instance.
    // Without Redis (local dev), Socket.IO works fine in single-process mode.
    if (process.env.REDIS_URL) {
        try {
            const pubClient = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true });
            const subClient = pubClient.duplicate();

            Promise.all([pubClient.connect(), subClient.connect()])
                .then(() => {
                    io.adapter(createAdapter(pubClient, subClient));
                    console.log('[socket.io] Redis adapter enabled — multi-instance ready');
                })
                .catch((err) => {
                    console.error('[socket.io] Redis adapter failed, falling back to in-memory adapter:', err.message);
                });
        } catch (err) {
            console.error('[socket.io] Could not initialise Redis adapter:', err);
        }
    } else {
        console.log('[socket.io] No REDIS_URL — using single-process in-memory adapter');
    }

    // ── JWT authentication middleware ────────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
            if (err) return next(new Error('Authentication error'));
            socket.data.user = decoded;
            next();
        });
    });

    // ── Connection handler ───────────────────────────────────────────────────
    io.on('connection', (socket: Socket) => {
        const user = socket.data.user;
        if (user && user.role === 'volunteer') {
            // Join personal room and shared volunteers room.
            // Room membership is managed by Socket.IO (via Redis adapter in prod)
            // so no manual Map tracking is needed — emitToVolunteer() works
            // across all instances automatically.
            socket.join(`volunteer_${user.id}`);
            socket.join('volunteers');
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
        io.to('volunteers').emit(event, data);
    }
};
