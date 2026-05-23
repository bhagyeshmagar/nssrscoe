import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import galleryRoutes from './routes/galleryRoutes';
import membersRoutes from './routes/membersRoutes';
import settingsRoutes from './routes/settingsRoutes';
import uploadRoutes from './routes/uploadRoutes';
import eventImagesRoutes from './routes/eventImagesRoutes';
import volunteerRoutes from './routes/volunteerRoutes';
import registrationRoutes from './routes/registrationRoutes';
import { apiRateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving images
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json());

// Apply general rate limiting to all API routes
app.use('/api', apiRateLimiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server is running');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/event-images', eventImagesRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/registrations', registrationRoutes);

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
