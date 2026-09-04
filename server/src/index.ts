import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import sliderRoutes from './routes/sliderRoutes';
import galleryRoutes from './routes/galleryRoutes';
import membersRoutes from './routes/membersRoutes';
import settingsRoutes from './routes/settingsRoutes';
import approvalsRoutes from './routes/approvalsRoutes';
import uploadRoutes from './routes/uploadRoutes';
import eventImagesRoutes from './routes/eventImagesRoutes';
import registrationRoutes from './routes/registrationRoutes';
import { errorHandler } from './middleware/errorHandler';
import { initSocket } from './services/socketService'; 
import { startCronJobs } from './services/cronService';

// New AY-scoped route imports
import academicYearRoutes from './routes/academicYearRoutes';
import volunteerRoutes, { ayVolunteerRouter } from './routes/volunteerRoutes';
import coreTeamRoutes, { ayCoreTeamRouter } from './routes/coreTeamRoutes';
import attendanceRoutes, { ayAttendanceRouter } from './routes/attendanceRoutes';
import specialCampRoutes, { ayCampsRouter } from './routes/specialCampRoutes';
import adminRoutes from './routes/adminRoutes';
import auditRoutes from './routes/auditRoutes';
import activityCalendarRoutes from './routes/activityCalendarRoutes';
import meetingRoutes from './routes/meetingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import coreTeamDashboardRoutes from './routes/coreTeamDashboardRoutes';
import hodRoutes from './routes/hodRoutes';
import emailRoutes from './routes/emailRoutes';
import innovativeIdeaRoutes from './routes/innovativeIdeaRoutes';
import adminInnovativeIdeaRoutes from './routes/adminInnovativeIdeaRoutes';
import achievementRoutes from './routes/achievementRoutes';
import adminAchievementRoutes from './routes/adminAchievementRoutes';
import { apiRateLimiter } from './middleware/rateLimiter';

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}

const app: Express = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 5000;

// Security middleware
app.use((req, res, next) => {
    console.log('[API Request]', req.method, req.url);
    next();
});

import hpp from 'hpp';
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving images
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline for some React dev tools, ideally removed in prod
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));
app.use(hpp()); // Protect against HTTP Parameter Pollution attacks

// CORS configuration — restrict to known origins
const ALLOWED_ORIGINS = (() => {
    const raw = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '';
    return raw.split(',').map(s => s.trim()).filter(Boolean);
})();

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. same-origin, mobile apps, curl in dev)
        if (!origin) return callback(null, true);
        // In production only allow whitelisted origins; in dev allow all
        if (process.env.NODE_ENV !== 'production' || ALLOWED_ORIGINS.length === 0) {
            return callback(null, true);
        }
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// Apply general rate limiting to all API routes
app.use('/api', apiRateLimiter);

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
app.use('/api/admins',        adminRoutes);
app.use('/api/audit-logs',    auditRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/slider',        sliderRoutes);
app.use('/api/gallery',       galleryRoutes);
app.use('/api/members',       membersRoutes);
app.use('/api/settings',      settingsRoutes);
app.use('/api/approvals',     approvalsRoutes);
app.use('/api/upload',        uploadRoutes);
app.use('/api/event-images',  eventImagesRoutes);

app.use('/api/registrations', registrationRoutes);
app.use('/api/activity-calendar', activityCalendarRoutes);

app.use('/api/volunteers',    volunteerRoutes);     // /me, /me/profile, /me/password, /public, /experiences
app.use('/api/core-team',     coreTeamRoutes);      // /roles
app.use('/api/attendance',    attendanceRoutes);    // /sessions/:id, /sessions/:id/records
app.use('/api/special-camps', specialCampRoutes);   // /:campId, /:campId/participants, /:campId/finalize
app.use('/api/core-team-dashboard', coreTeamDashboardRoutes);
app.use('/api',               meetingRoutes);       // handles both /academic-years/:ayId/meetings and /meetings/:id
app.use('/api',               notificationRoutes);  // handles /volunteers/me/notifications
app.use('/api/hod-contacts',  hodRoutes);           // HOD contact management
app.use('/api/email',         emailRoutes);          // email logs, stats, send-report
app.use('/api/innovative-ideas', innovativeIdeaRoutes);
app.use('/api/admin/innovative-ideas', adminInnovativeIdeaRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/admin/achievements', adminAchievementRoutes);

// Serve Frontend in Production (For Docker / Option B)
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// Error handling middleware
app.use(errorHandler);

export const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start Cron Jobs
if (process.env.NODE_ENV !== 'test') {
    startCronJobs();
}

if (process.env.NODE_ENV !== 'test') {
    server.listen(port, async () => {
        console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
}

export default app;
