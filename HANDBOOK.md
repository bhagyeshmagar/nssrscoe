# NSS RSCOE — Complete Developer Handbook

> **Version**: 2.0 | **Last Updated**: September 2026  
> This is the single authoritative reference for everyone who develops, maintains, or deploys the NSS JSPM RSCOE platform. It covers architecture, development history, bugs and fixes, and full deployment instructions.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack and Architecture](#2-tech-stack-and-architecture)
3. [Full Directory Structure](#3-full-directory-structure)
4. [Database Schema](#4-database-schema)
5. [Security Architecture](#5-security-architecture)
6. [Authentication Flow](#6-authentication-flow)
7. [API Route Map](#7-api-route-map)
8. [Feature Development History](#8-feature-development-history)
9. [Bugs and Fixes](#9-bugs-and-fixes)
10. [Scalability for 10K Concurrent Users](#10-scalability-for-10k-concurrent-users)
11. [Local Development Setup](#11-local-development-setup)
12. [Azure Deployment Option A](#12-azure-deployment-option-a-static-web-apps--app-service)
13. [Azure Deployment Option B Docker](#13-azure-deployment-option-b-container-apps-docker)
14. [Docker Deployment Local or VPS](#14-docker-deployment-local--vps)
15. [GitHub Actions CICD](#15-github-actions-cicd)
16. [Environment Variable Reference](#16-environment-variable-reference)
17. [npm Scripts Reference](#17-npm-scripts-reference)
18. [Deployment Troubleshooting](#18-deployment-troubleshooting)
19. [Developer Workflow Conventions](#19-developer-workflow-conventions)

---

## 1. Project Overview

The **NSS JSPM RSCOE** platform is a full-stack web application for managing the National Service Scheme unit at JSPM Rajarshi Shahu College of Engineering (RSCOE), Pune.

| Module | Description |
|---|---|
| **Public Site** | Home, About, Events, Gallery, Volunteering Experiences, Achievements, Innovative Ideas |
| **Volunteer Dashboard** | Self-service portal: profile, attendance, notifications, pass, event registration |
| **Admin Dashboard** | Volunteer management, events, core team, attendance, special camps, gallery, slider, meetings, audit logs |
| **Superadmin Controls** | Hard-delete volunteers, manage admins, unlock academic years, approve experiences |

---

## 2. Tech Stack and Architecture

### Architecture

Decoupled SPA (React) communicating with REST API (Express) backed by Microsoft SQL Server.

```
+--------------------------------------+
|         React SPA (Vite)             |  <- Port 5173 dev / Azure Static Web Apps prod
|  React 18, TypeScript, TailwindCSS   |
|  Zustand (auth), React Query (data)  |
|  React Router v6, Axios              |
+--------------------------------------+
           |  REST + WebSocket
           v
+--------------------------------------+
|       Express Server (Node.js)       |  <- Port 5000 dev / Azure App Service prod
|  TypeScript, Drizzle ORM MSSQL       |
|  JWT, Multer, Socket.IO              |
|  Helmet, HPP, Rate-Limit, Resend     |
+--------------------------------------+
           |
           v
+--------------------------------------+
|   Microsoft SQL Server (MSSQL)       |  <- Port 1433
+--------------------------------------+
```

### Key Libraries

| Side | Library | Purpose |
|---|---|---|
| Client | react-query | Server state caching and invalidation |
| Client | zustand | Auth token in localStorage |
| Client | axios | HTTP client with auth interceptor |
| Client | react-hot-toast | Toast notifications |
| Client | html2canvas | Volunteer pass PNG download |
| Client | framer-motion | Page transitions |
| Client | vite-plugin-pwa | Installable PWA |
| Server | drizzle-orm | Type-safe MSSQL ORM |
| Server | jsonwebtoken | JWT signing/verification |
| Server | bcrypt | Password hashing (rounds 10) |
| Server | multer | File upload handling |
| Server | helmet | HTTP security headers + CSP |
| Server | hpp | HTTP Parameter Pollution protection |
| Server | express-rate-limit | Rate limiting |
| Server | socket.io | Real-time notifications |
| Server | resend | Transactional email |
| Server | node-cron | Scheduled tasks |
| Server | zod | Request body validation |

---

## 3. Full Directory Structure

```
nssrscoe/
+-- .github/workflows/
|   +-- azure-static-web-apps.yml   <- CI/CD pipeline
+-- client/                         <- React SPA
|   +-- public/assets/              <- Logos, static images
|   +-- src/
|       +-- App.tsx                 <- Root, all routes
|       +-- main.tsx                <- Entry, QueryClient, ErrorBoundary
|       +-- components/
|       |   +-- admin/              <- Admin dashboard tabs
|       |   |   +-- Shared.tsx      <- useAYSelector hook
|       |   |   +-- volunteers/     <- Volunteer management UI
|       |   +-- volunteer/
|       |   |   +-- ProfileTab.tsx
|       |   +-- register/
|       |       +-- PassLookup.tsx  <- Public pass lookup
|       |       +-- PassCard.tsx    <- Printable pass card
|       +-- hooks/                  <- React Query hooks per domain
|       +-- services/
|       |   +-- api.ts              <- Re-exports all APIs and types
|       |   +-- core/http.ts        <- Axios + auth interceptor
|       |   +-- domains/            <- One file per domain
|       +-- stores/authStore.ts     <- Zustand auth state
|       +-- pages/                  <- Route-level components
+-- server/                         <- Express API
|   +-- src/
|       +-- index.ts                <- App entry, middleware, routes
|       +-- db/schema.ts            <- All table definitions
|       +-- db/index.ts             <- Drizzle + mssql connection
|       +-- routes/                 <- 27 route files
|       +-- controllers/            <- Business logic
|       +-- services/               <- Multi-step service logic
|       +-- middleware/auth.ts      <- JWT + role guards
|       +-- lib/errors.ts           <- Error classes
|       +-- scripts/               <- DB seed and migration
+-- Dockerfile                      <- Multi-stage build
+-- docker-compose.yml
+-- HANDBOOK.md
```

---

## 4. Database Schema

All tables defined in `server/src/db/schema.ts`.

> [!IMPORTANT]
> MSSQL has no native ENUM type. All enum fields use `nvarchar` with `CHECK` constraints in DB and TypeScript `as const` arrays at the app layer.

| Table | Purpose |
|---|---|
| admins | Admin accounts. isSuperadmin bit for elevated access. |
| academic_years | AY records with isCurrent, isLocked, isArchived. Filtered unique index enforces one active AY. |
| volunteers | Auth + identity. Linked to AY. isActive, status (regular/backup). |
| volunteer_profiles | PII data split from auth: PRN, CGPA, caste, profilePhotoUrl, isExperienceApproved. |
| core_team_roles | Master role list (Principal, NSS-PO, Secretary). Seeded once. |
| core_team_assignments | Per-AY role assignments. |
| events | NSS events (upcoming/past). |
| event_registrations | Visitor registrations. visitorPassId, status (pending/approved/rejected). |
| attendance_sessions | Attendance session per event or standalone. |
| attendance_records | Per-volunteer attendance for a session. |
| special_camps | National camp records. |
| special_camp_participants | Finalized snapshot of camp participants. |
| activity_calendar | Monthly calendar entries per AY. |
| meetings | Meeting records with participants per AY. |
| notifications | In-app volunteer notifications. |
| gallery | Images/videos. |
| home_slider_images | Hero slider images. |
| site_settings | Key-value site configuration. |
| audit_logs | Immutable admin action trail. |
| achievements | NSS achievements. |
| innovative_ideas | Volunteer-submitted ideas. |
| hod_contacts | HOD contact info. |

### Critical MSSQL Query Rule

> [!CAUTION]
> MSSQL does NOT support `.limit()` chained at the end in Drizzle. Always use `.top(N)` right after `.select()`.

```typescript
// CORRECT
const [row] = await db.select().top(1).from(volunteers).where(eq(volunteers.id, id));

// WRONG - runtime error on MSSQL
const [row] = await db.select().from(volunteers).where(eq(volunteers.id, id)).limit(1);
```

---

## 5. Security Architecture

| Layer | Mechanism | Detail |
|---|---|---|
| Headers | helmet | CSP, HSTS, X-Content-Type-Options |
| CSP | Helmet directive | Blocks scripts outside self and Google Fonts |
| HPP | hpp middleware | Prevents HTTP Parameter Pollution via duplicate params |
| Rate Limiting | express-rate-limit | Global 3000/15min, Login 20/15min, Upload 50/5min |
| SQL Injection | Drizzle ORM | Parameterized queries everywhere |
| Passwords | bcrypt rounds 10 | Never stored plaintext. Re-verified for hard-delete |
| JWT | jsonwebtoken | Signed with JWT_SECRET min 32 chars |
| File Uploads | multer + timestamp rename | Original filenames never used for disk writes |
| CORS | cors middleware | Dev: all origins. Prod: ALLOWED_ORIGINS only |
| Proxy Trust | trust proxy 1 | Required for Azure load balancers and rate limiting |

---

## 6. Authentication Flow

```
POST /api/auth/login
  -> bcrypt.compare(password, hash)
  -> jwt.sign({ id, username, role })
  -> returns { token, user }

Token stored in Zustand -> localStorage

Every Request:
  Axios interceptor adds: Authorization: Bearer <token>
  -> authenticateToken middleware verifies JWT
  -> requireAdmin/requireVolunteer re-queries DB
     to confirm account still exists and is active
```

### Roles

| Role | JWT Value | Access |
|---|---|---|
| Regular Admin | admin | Dashboard, content approval, volunteer management |
| Superadmin | superadmin | Admin + delete volunteers, manage admins, unlock AYs |
| Volunteer | volunteer | Self-service dashboard and profile |

> [!NOTE]
> requireAdmin always does a fresh DB query. A deactivated admin is blocked even with a valid JWT.

---

## 7. API Route Map

All routes prefixed with `/api`.

### AY-Scoped

```
/api/academic-years
/api/academic-years/:ayId/volunteers
/api/academic-years/:ayId/core-team
/api/academic-years/:ayId/attendance
/api/academic-years/:ayId/special-camps
/api/academic-years/:ayId/meetings
```

### Flat Routes

```
/api/auth                    Login for admin and volunteer
/api/admins                  Admin CRUD superadmin only
/api/audit-logs              View audit trail
/api/events                  Event CRUD
/api/registrations           Visitor registrations and pass lookup
/api/volunteers              /me /me/profile /me/password /public /experiences
/api/slider                  Slider image management
/api/gallery                 Gallery management
/api/achievements            Public achievements
/api/admin/achievements      Admin achievement CRUD
/api/innovative-ideas        Public ideas
/api/admin/innovative-ideas  Admin idea approval
/api/approvals               Pending approvals queue
/api/upload                  File uploads
/api/settings                Site settings
/api/email                   Email logs and stats
/api/hod-contacts            HOD contact management
/api/core-team-dashboard     Core team summary
/api/activity-calendar       Activity calendar
```

---

## 8. Feature Development History

### Phase 1 - Foundation

- Express + Drizzle ORM setup with TypeScript and MSSQL
- JWT authentication for admin and volunteer roles
- Academic Year scoping: all data scoped by `academicYearId` so the platform can operate across multiple NSS years without collision
- Basic volunteer CRUD

### Phase 2 - Admin Dashboard

- Core Team Management: assign volunteers or external persons (Principal, NSS-PO) to per-AY roles
- Attendance Management: session-based with present/absent/late states
- Special Camps: camp management with participant finalization snapshot
- Event Registrations and Pass System: public registration, admin approval, email with visitorPassId, pass download at /register
- Approvals Dashboard: unified pending queue for events, gallery, ideas, slider
- Gallery and Slider with approval workflow

### Phase 3 - Volunteer Dashboard

- Self-Service Profile: PRN, CGPA, caste, photo. Data split from auth in separate volunteer_profiles table
- Volunteering Experience: volunteers write text, admins approve it for public display
- Innovative Ideas: submit and get approved for public display
- Real-time notifications via Socket.IO and daily meeting reminder cron
- Digital NSS Pass Card download as PNG

### Phase 4 - Optimizations

- React Query migration: all admin data fetching uses useQuery/useMutation with proper cache invalidation, eliminating manual hard-reloads
- Hard Delete with password gate: delete converted from soft-delete to hard DB delete with superadmin bcrypt re-verification
- AY dropdown default fix: defaults to isCurrent AY not oldest
- Pass Lookup crash fix: frontend restructured to match flat backend response

---

## 9. Bugs and Fixes

### Bug 1: Database Connection Timeout

**Symptom**: Server crashed with `TimeoutError: operation timed out` from tarn pool.

**Root Cause**: mssql pool not configured with min/max and timeout settings causing exhaustion.

**Fix**: Added explicit pool config in `server/src/db/index.ts`:

```typescript
{ pool: { min: 0, max: 10 }, options: { encrypt: true, connectTimeout: 30000 } }
```

---

### Bug 2: Core Team 409 Conflict Error

**Symptom**: Adding a Principal/NSS-PO to core team returned 409 even for new people.

**Root Cause**: Institution roles are unique per AY (isUniquePerAy). The uniqueness violation was an unhandled exception causing a 500 error instead of a clean 409.

**Fix**: Updated `coreTeamService.ts` to catch uniqueness violation and throw `ValidationError` with a descriptive message.

---

### Bug 3: Volunteer Image Upload No Preview

**Symptom**: Profile photo saved on server but no preview in UI.

**Root Cause**: `CoreTeamTab.tsx` was not reading the URL from the upload API response to update form state.

**Fix**: Added `onUploadSuccess` callback to update `displayPhotoUrl` with the URL returned by the server.

---

### Bug 4: Volunteer Activate/Deactivate Not Working

**Symptom**: Activate/Deactivate button clicks had no visible effect.

**Root Cause**: Handler not wired to API call. React Query cache not invalidated after mutation.

**Fix**: Added `handleToggleActive` in `AYVolunteersTab.tsx` calling `useToggleVolunteerActive`. Added `invalidateQueries({ queryKey: volunteerKeys.all })` in `onSuccess`.

---

### Bug 5: Volunteer Delete Converted to Hard Delete

**Symptom**: Delete only set `isActive = false`. Business requirement changed to real DB deletion.

**Fix**:

- `volunteerService.ts`: issue actual `DELETE` SQL statement instead of UPDATE.
- Added `bcrypt.compare` re-verification of superadmin password before deleting.
- `volunteerController.ts`: extract `password` from `req.body`.
- `AYVolunteersTab.tsx`: added confirmation dialog with password input field.

---

### Bug 6: Experience Approval Shows Pending After Admin Approves

**Symptom**: Volunteer dashboard still shows "Pending Admin Approval" after admin approves. Requires hard refresh.

**Root Cause 1 - Missing Field Mapping**: `ProfileTab.tsx` was not including `isExperienceApproved` when mapping the API response to state.

**Fix**: Added `isExperienceApproved: data.profile.isExperienceApproved ?? false` to the profile state mapping.

**Root Cause 2 - Cache Not Invalidated**: `AYVolunteersTab.tsx` called the approve API but did not invalidate the React Query cache.

**Fix**: Added `queryClient.invalidateQueries({ queryKey: volunteerKeys.all })` after successful approval.

---

### Bug 7: Pass Lookup Page Crash

**Error**: `TypeError: Cannot read properties of undefined (reading 'status')` in PassLookup.tsx line 93.

**Symptom**: Searching for a pass ID crashed the entire page.

**Root Cause**: Backend `getRegistrationByVisitorId` returns a FLAT object:

```json
{ "name": "...", "status": "approved", "eventTitle": "...", "visitorPassId": "..." }
```

Frontend `PassLookup.tsx` expected a NESTED structure:

```typescript
{ registration: EventRegistration; event: EventData }
```

So `lookupResult.registration.status` was `undefined.status` — crash.

**Fix**:

- Updated `PassLookup.tsx` state type to `any`.
- Changed all references from `lookupResult.registration.status` to `lookupResult.status`.
- Changed `lookupResult.event?.title` to `lookupResult.eventTitle`.
- Passed the flat object directly to `PassCard`.

---

### Bug 8: AY Dropdown Defaults to Wrong Year

**Symptom**: Admin dashboard AY dropdown always selected the oldest year.

**Root Cause**: `useAYSelector` in `Shared.tsx` used `years[0]` as default which is the oldest (lowest ID).

**Fix**: Changed default to `years.find(y => y.isCurrent)?.id` falling back to `years[0]`.

> [!NOTE]
> The property is `isCurrent` NOT `isActive`. An early fix accidentally used `isActive` causing a TypeScript error that was corrected.

---

### Bug 9: Approve/Reject Registration Does Not Update Sidebar Badge

**Symptom**: After approving/rejecting an event registration the pending count badge on the admin sidebar stays stale until hard refresh.

**Root Cause**: `useApproveRegistration` and `useRejectRegistration` only invalidated `registrationKeys.all` but not `['pendingApprovals']` which feeds the badge.

**Fix**: Added `queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] })` to both mutations' `onSuccess` handlers in `useRegistrations.ts`.

---

## 10. Scalability for 10K Concurrent Users

The platform has been audited and optimized to handle 10,000+ concurrent users across 5 architectural phases. All code is present in the repository, but Phase 2 and Phase 3 features are gated behind environment variables so local development remains lightweight.

| Phase | What It Fixes | Infrastructure Required | Environment Variables |
|---|---|---|---|
| **Phase 1: Zero-Infra Code Fixes** | - Shrinks global body limit to 50kb (anti-DoS)<br>- Sets `UV_THREADPOOL_SIZE=16` to prevent `bcrypt` from starving async I/O<br>- Wraps multi-step DB inserts in transactions | None (Code only) | `UV_THREADPOOL_SIZE=16` |
| **Phase 2: Azure Blob Uploads** | Prevents file loss on App Service restarts. Scales across multiple server instances. | Azure Blob Storage | `AZURE_STORAGE_CONNECTION_STRING`<br>`AZURE_STORAGE_CONTAINER` |
| **Phase 3: Redis Shared State** | - Backs rate limiters with Redis (avoids per-instance limits bypassing protection)<br>- Backs Socket.IO with Redis Adapter (rooms work across instances) | Azure Cache for Redis | `REDIS_URL` |
| **Phase 4: DB Pool & Query Tuning** | - Caps DB connections via env var (fails fast on timeout)<br>- Uses `uuidv7()` for visitor passes to completely eliminate collision retries<br>- Parallelizes cron job meeting fetching (fixes N+1 loop) | Azure SQL Tier Match | `DB_POOL_MAX` |
| **Phase 5: Admin Cache Tuning** | Forces critical admin data (volunteer list, pending approvals) to bypass `staleTime` and refetch on window focus to prevent multi-admin data corruption. | None (Code only) | None |

> [!TIP]
> **To activate true horizontal scaling**, you must provision a Redis instance and an Azure Storage account, then populate the environment variables. If these variables are omitted, the server gracefully falls back to local memory and local disk (suitable for dev and single-instance deployments).

---

## 11. Local Development Setup

### Prerequisites

| Tool | Min Version | Notes |
|---|---|---|
| Node.js | v20 LTS | nodejs.org |
| npm | v10 | Bundled with Node |
| SQL Server | 2019+ | Express Edition free |
| SSMS | Any | Optional, for DB inspection |
| Git | Any | For cloning |

### Step 1: Clone

```bash
git clone https://github.com/bhagyeshmagar/nssrscoe.git
cd nssrscoe
```

### Step 2: Install Dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### Step 3: Configure Server

Create `server/.env`:

```env
NODE_ENV=development
PORT=5000
DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=nss_db
DB_USER=your_sql_username
DB_PASSWORD=your_sql_password
DB_TRUST_CERT=true
JWT_SECRET=your_minimum_32_character_secret_here
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ALLOWED_ORIGINS=
DEFAULT_SEED_PASSWORD=changeme
```

> [!CAUTION]
> Generate JWT_SECRET with:
> `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Step 4: Configure Client

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### Step 5: Database Setup

```sql
-- In SSMS
CREATE DATABASE nss_db;
```

```bash
cd server
npm run db:push   # creates all tables
npm run db:seed   # creates default admins and roles
```

Default credentials after seed (change immediately):

| Username | Role | Password |
|---|---|---|
| superadmin | Superadmin | changeme |
| <admin@email.com> | Superadmin | changeme |
| <nsspo@email.com> | Admin | changeme |

### Step 6: Start Dev Servers

```bash
# Terminal 1
cd server && npm run dev    # http://localhost:5000

# Terminal 2
cd client && npm run dev    # http://localhost:5173
```

---

## 12. Azure Deployment Option A (Static Web Apps + App Service)

Best for production. Frontend on CDN (fast global), backend as managed Linux app.

### Architecture

```
Azure Static Web Apps (React SPA, CDN)
    |-- API calls to -->
Azure App Service (Express, Linux Node 20)
    |-- SQL to -->
Azure SQL Database
```

### Step 1: Provision Azure SQL Database

1. Azure Portal → Create resource → SQL Database
2. Create SQL Server (logical server) with SQL Authentication
3. Note server name: `your-server.database.windows.net`
4. Networking → Enable **Allow Azure services to access this server**
5. Add your local IP to firewall (for running db:push locally)

### Step 2: Push Schema From Local Machine

Update `server/.env` with Azure SQL credentials then:

```bash
cd server
npm run db:push
npm run db:seed
```

### Step 3: Deploy Backend to App Service

1. Create Web App: Node 20 LTS, Linux, B1 tier minimum
2. Set Environment Variables in Settings → Environment Variables:

```
NODE_ENV=production
PORT=8080
DB_SERVER=your-server.database.windows.net
DB_DATABASE=nss_db
DB_USER=your_user
DB_PASSWORD=your_password
DB_TRUST_CERT=false
JWT_SECRET=<64-char-secret>
RESEND_API_KEY=re_xxx
ALLOWED_ORIGINS=https://your-app.azurestaticapps.net
```

1. Startup Command: `npm run start`
2. Deployment Center: GitHub → main branch → App root `/server`

### Step 4: Deploy Frontend to Static Web Apps

1. Create Static Web App from GitHub
   - App location: `/client`
   - Output location: `dist`
2. Add GitHub secrets:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN` from Azure Portal
   - `VITE_API_URL` = `https://your-api.azurewebsites.net`
3. Add CORS in App Service: add Static Web App URL
4. Push to `main` to trigger deployment

### Azure Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| ECONNREFUSED connecting to DB | Firewall blocking App Service | Enable Allow Azure services in Azure SQL Networking |
| SSL certificate error | DB_TRUST_CERT=true in prod | Set DB_TRUST_CERT=false |
| CORS error in browser | Missing CORS config | Add Static Web App URL to App Service CORS |
| Build fails missing VITE_API_URL | Secret not set | Add to GitHub Actions secrets |
| JWT_SECRET too short | Short secret | Generate new one with crypto.randomBytes |
| App Service 503 | Server crashed | Check App Service Monitoring → Log stream |
| Static Web App blank page | Wrong output_location | Set output_location: dist in YAML |

---

## 13. Azure Deployment Option B (Container Apps / Docker)

Best for full portability. React + Express in one Docker image.

### Step 1: Test Locally

```bash
docker build -t nssrscoe:latest .
docker run -p 8080:8080 --env-file server/.env nssrscoe:latest
# Visit http://localhost:8080
```

### Step 2: Push to Azure Container Registry

```bash
az login
az acr create --name nssrscoeacr --resource-group nss-rg --sku Basic
az acr login --name nssrscoeacr
docker build -t nssrscoeacr.azurecr.io/nssrscoe:latest .
docker push nssrscoeacr.azurecr.io/nssrscoe:latest
```

### Step 3: Deploy to Container Apps

```bash
az containerapp env create --name nss-env --resource-group nss-rg --location eastus

az containerapp create \
  --name nss-app \
  --resource-group nss-rg \
  --environment nss-env \
  --image nssrscoeacr.azurecr.io/nssrscoe:latest \
  --registry-server nssrscoeacr.azurecr.io \
  --target-port 8080 \
  --ingress external \
  --env-vars NODE_ENV=production DB_SERVER=your-server.database.windows.net \
    DB_DATABASE=nss_db DB_USER=user DB_PASSWORD=pass \
    DB_TRUST_CERT=false JWT_SECRET=secret \
    ALLOWED_ORIGINS=https://your-domain.com
```

### How the Dockerfile Works

Multi-stage build:

1. Stage 1: builds React to `client/dist`
2. Stage 2: installs server Node.js dependencies
3. Stage 3: combines both. Express serves the API at `/api/*` AND serves React static files for all other routes in production.

The key code in `server/src/index.ts`:

```typescript
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}
```

---

## 14. Docker Deployment (Local / VPS)

### Root .env File

```env
DB_SERVER=host.docker.internal\SQLEXPRESS
DB_DATABASE=nss_db
DB_USER=your_sql_username
DB_PASSWORD=your_sql_password
JWT_SECRET=your_64_char_secret
RESEND_API_KEY=re_xxxxxxxxxxxx
ALLOWED_ORIGINS=http://localhost:3000
```

`host.docker.internal` resolves to the host machine. On Linux the `extra_hosts` entry in `docker-compose.yml` handles this.

### Enable SQL Server TCP/IP

1. SSMS → right-click server → Properties → Connections → Allow remote connections
2. SQL Server Config Manager → enable TCP/IP → restart SQL Server service
3. Windows Firewall → open port 1433

### Start

```bash
docker-compose up --build
# React: http://localhost:3000
# API:   http://localhost:5000
```

### First-time DB Init

```bash
docker exec -it nss_server npx tsx src/scripts/migrate.ts
docker exec -it nss_server npx tsx src/scripts/seedAll.ts
```

---

## 15. GitHub Actions CI/CD

File: `.github/workflows/azure-static-web-apps.yml`

### Trigger

Any push to `main` that changes files in `client/**`. Backend-only pushes do NOT trigger frontend deployment.

### What It Does

1. Checks out the code
2. Runs `npm run build` inside `/client` with `VITE_API_URL` injected from GitHub Secrets
3. Uploads the `dist/` folder to Azure Static Web Apps CDN

### Required GitHub Secrets

| Secret | Value |
|---|---|
| AZURE_STATIC_WEB_APPS_API_TOKEN | Azure Portal → Static Web App → Manage deployment token |
| VITE_API_URL | Backend URL e.g. <https://nss-rscoe-api.azurewebsites.net> |

### Troubleshooting

| Problem | Fix |
|---|---|
| VITE_API_URL is not defined at build | Add VITE_API_URL to GitHub Actions secrets |
| TypeScript build errors | Run `npm run build` in `/client` locally and fix errors first |
| Deployment token invalid | Regenerate in Azure Portal and update GitHub secret |
| Backend changes but no deploy | Expected: workflow only triggers on client/** changes |

---

## 16. Environment Variable Reference

### Server (server/.env)

| Variable | Required | Description |
|---|---|---|
| NODE_ENV | Yes | development or production |
| PORT | Yes | Express port. Default 5000. Azure App Service uses 8080. |
| DB_SERVER | Yes | MSSQL hostname e.g. `localhost\SQLEXPRESS` or Azure SQL FQDN |
| DB_DATABASE | Yes | Database name |
| DB_USER | Conditional | SQL auth user. Omit for Windows Auth. |
| DB_PASSWORD | Conditional | SQL auth password. Omit for Windows Auth. |
| DB_TRUST_CERT | Yes | `true` for local dev. `false` for Azure SQL. |
| JWT_SECRET | Yes | Min 32 chars. Server refuses to start if shorter. |
| RESEND_API_KEY | Optional | Meeting reminder emails |
| ALLOWED_ORIGINS | Prod only | Comma-separated CORS origins |
| DEFAULT_SEED_PASSWORD | Optional | Password for seeded admin accounts |

### Client (client/.env)

| Variable | Required | Description |
|---|---|---|
| VITE_API_URL | Yes | Full Express server URL. No trailing slash. |

---

## 17. npm Scripts Reference

### Server

| Command | Description |
|---|---|
| `npm run dev` | Hot-reload dev server via tsx watch |
| `npm run start` | Start server for production used in Docker and App Service |
| `npm run db:push` | Sync Drizzle schema to MSSQL. Safe to re-run. |
| `npm run db:seed` | Create default admins, roles, settings |
| `npm run db:studio` | Visual DB browser at localhost:4983 |
| `npm run test` | Vitest unit tests |
| `npm run lint` | ESLint |

### Client

| Command | Description |
|---|---|
| `npm run dev` | Vite dev at localhost:5173 |
| `npm run build` | TypeScript check + Vite bundle to dist/ |
| `npm run preview` | Serve dist/ locally |
| `npm run lint` | ESLint |

---

## 18. Deployment Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| JWT_SECRET must be at least 32 characters | Short secret | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| Cannot connect to SQL Server | Wrong DB_SERVER or TCP/IP disabled | Enable TCP/IP in SQL Server Config Manager |
| CORS error in browser | Wrong ALLOWED_ORIGINS or VITE_API_URL | Set ALLOWED_ORIGINS on server; check VITE_API_URL on client |
| db:push fails database not found | DB does not exist | `CREATE DATABASE nss_db;` in SSMS |
| Docker cannot reach SQL Server | host.docker.internal issue | On Linux add `extra_hosts: ["host.docker.internal:host-gateway"]` |
| Container uploads gone on restart | Volume not mounted | Verify server_uploads volume in docker-compose.yml |
| App Service 503 | Startup crash | App Service → Monitoring → Log stream |
| Static Web App blank page | Wrong output_location | Ensure `output_location: dist` in YAML |
| Azure SQL certificate error | DB_TRUST_CERT=true in prod | Set DB_TRUST_CERT=false |
| Rate limiting breaks on Azure | trust proxy not set | `app.set('trust proxy', 1)` in index.ts (already done) |
| top() is not a function | Using .limit() on MSSQL | Use `.top(N)` not `.limit(N)` in Drizzle MSSQL queries |
| WebSocket/Socket.IO not working | WS blocked by proxy | Ensure WS upgrade headers pass through load balancer |

### View Logs

```bash
# App Service
# Azure Portal -> App Service -> Monitoring -> Log stream

# Container Apps
az containerapp logs show --name nss-app --resource-group nss-rg --follow

# Docker local
docker logs -f nss_server
```

---

## 19. Developer Workflow Conventions

### Adding a New Feature (Full Stack)

1. **Schema** — add table or column in `server/src/db/schema.ts`
2. **Push** — `cd server && npm run db:push`
3. **Service** — business logic in `server/src/services/`
4. **Controller** — request handler in `server/src/controllers/`
5. **Route** — add in `server/src/routes/` and register in `server/src/index.ts`
6. **Client API** — typed Axios call in `client/src/services/domains/`
7. **React Query Hook** — `useQuery` or `useMutation` in `client/src/hooks/`
8. **Component** — build UI using the hook
9. **Invalidation** — after mutations call `queryClient.invalidateQueries()` for all affected keys

### React Query Cache Keys

| Resource | Key |
|---|---|
| Volunteers | `['volunteers', 'ay', ayId]` |
| Academic Years | `['academicYears']` |
| Pending Approvals | `['pendingApprovals']` |
| Registrations | `['registrations', eventId]` |
| Events | `['events']` |

Always invalidate ALL related keys after a mutation. Example: approving a registration should invalidate both `registrations` and `pendingApprovals`.

### Background Services

**Cron Job**: Runs daily at 8:00 AM when server starts. Finds meetings scheduled for tomorrow. Sends in-app Socket.IO notifications and Resend emails to all relevant volunteers.

**Socket.IO**: Initialized on the same port as the HTTP server (5000). No extra port needed. Delivers real-time notifications.

**PWA**: Configured via `vite-plugin-pwa`. Volunteers can install it on Android/iOS. Manifest name: `NSS Dashboard`.

### Audit Logging

All significant admin actions must call `logAudit()`:

```typescript
await logAudit({
  action: 'volunteer.hard_delete',
  entityType: 'volunteer',
  entityId: id,
  performedById: adminId,
  academicYearId: vol.academicYearId
}, tx);
```

---

*Last updated: September 2026. Maintained by Bhagyesh Magar and NSS RSCOE Development Team.*
