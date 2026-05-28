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
import registrationRoutes from './routes/registrationRoutes';

// New AY-scoped route imports
import academicYearRoutes from './routes/academicYearRoutes';
import volunteerRoutes, { ayVolunteerRouter } from './routes/volunteerRoutes';
import coreTeamRoutes, { ayCoreTeamRouter } from './routes/coreTeamRoutes';
import attendanceRoutes, { ayAttendanceRouter } from './routes/attendanceRoutes';
import specialCampRoutes, { ayCampsRouter } from './routes/specialCampRoutes';
// import { apiRateLimiter } from './middleware/rateLimiter';

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
// app.use('/api', apiRateLimiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server is running');
});

// ── Academic Year — root resource ─────────────────────────────────────────────
app.use('/api/academic-years', academicYearRoutes);

// ── AY-scoped sub-resources (mounted under /api/academic-years/:ayId/...) ─────
// All three use mergeParams so their controllers see req.params.ayId
app.use('/api/academic-years/:ayId/volunteers',    ayVolunteerRouter);
app.use('/api/academic-years/:ayId/core-team',     ayCoreTeamRouter);
app.use('/api/academic-years/:ayId/attendance',    ayAttendanceRouter);
app.use('/api/academic-years/:ayId/special-camps', ayCampsRouter);

// ── Flat / self-service routes ────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/gallery',       galleryRoutes);
app.use('/api/members',       membersRoutes);
app.use('/api/settings',      settingsRoutes);
app.use('/api/upload',        uploadRoutes);
app.use('/api/event-images',  eventImagesRoutes);
app.use('/api/registrations', registrationRoutes);

app.use('/api/volunteers',    volunteerRoutes);     // /me, /me/profile, /me/password, /public, /experiences
app.use('/api/core-team',     coreTeamRoutes);      // /roles
app.use('/api/attendance',    attendanceRoutes);    // /sessions/:id, /sessions/:id/records
app.use('/api/special-camps', specialCampRoutes);   // /:campId, /:campId/participants, /:campId/finalize

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
