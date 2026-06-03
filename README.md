# NSS Website - JSPM RSCOE

Created by **Bhagyesh Magar** for the love of the club.

This is a full-stack, highly optimized web application for the NSS (National Service Scheme) Club at JSPM Rajarshi Shahu College of Engineering. It serves as both a public-facing informational portal and a robust administrative tool for managing volunteers, events, and academic year data.

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, React Three Fiber.
- **Backend**: Node.js, Express.js, TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Performance & Build**: Vite, Route-based Code Splitting (React.lazy).

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### 1. Database Setup
Ensure you have a PostgreSQL database running.
Update the `server/.env` file with your connection string:
```env
DATABASE_URL=postgres://user:password@localhost:5432/nss_db
JWT_SECRET=your_super_secret_jwt_key
ALLOWED_ORIGINS=http://localhost:5173
```

### 2. Backend Setup
```bash
cd server
npm install
# Push schema to database
npx drizzle-kit push
# Seed admin user and core roles
npx tsx src/scripts/seed.ts
npx tsx src/scripts/seed_roles.ts
# Start server
npm run dev
```
Server runs on http://localhost:5000

### 3. Frontend Setup
```bash
cd client
npm install
# Start dev server
npm run dev
```
Client runs on http://localhost:5173

## Admin Credentials
- Username: `admin`
- Password: `admin123`

---

## Architecture & Features

### 1. Academic-Year Scoped Data
The entire platform is designed around dynamic **Academic Years (AY)** (e.g., *2025-26*). 
All major entities are strictly scoped to an Academic Year:
- **Volunteers**: Tracked per AY with active/backup statuses and comprehensive individual profiles.
- **Core Team**: Hierarchical roles (Institution level, Department level, Student Coordinators) are assigned per AY.
- **Attendance**: Managed individually for events within a specific AY.
- **Special Camps**: Camp assignments, participants, and details are isolated per AY. Features a configurable exact volunteer capacity (e.g. exactly 50 volunteers).
- **CRUD & Locking**: Superadmins have full CRUD capabilities for Academic Years, including unarchiving and deleting. When an Academic Year is locked, all CRUD operations on its associated academic calendar and events are strictly disabled.

### 2. Modular Frontend Architecture
The React application is structured into scalable, maintainable components:
- **Admin Dashboard**: A highly modularized interface with isolated tabs for managing Academic Years, Core Teams, Volunteers, Events, Gallery, Members, Settings, and Registrations.
- **Volunteer Dashboard**: Self-service portal for volunteers to manage their profiles, update passwords, and view their peers.
- **Reusable UI Components**: Features like `VisitorPassCard`, `ImageLightbox`, and `EventRegistrationModal` are cleanly extracted for reuse.

### 3. Performance & Optimization
The project has been aggressively optimized for fast load times and smooth interactions:
- **Route-Based Code Splitting**: Utilizes `React.lazy()` to split the application into smaller chunks, reducing the initial JavaScript payload by over 50% (from ~800KB down to ~400KB).
- **Eliminated Cascading Renders**: React hooks are strictly optimized to prevent duplicate synchronous re-renders, eliminating UI stutter on dashboard loads.
- **Backend Rate Limiting**: API endpoints are protected with `express-rate-limit` to prevent abuse and ensure stability.

### 4. Strict Type Safety
- **End-to-End TypeScript**: Built with 100% strict TypeScript. API boundaries are hardened with precise interfaces (e.g., `AcademicYear`, `VolunteerProfileData`, `EventData`), entirely eliminating `any` fallbacks.
- **Drizzle ORM**: The backend database layer is entirely type-safe, preventing schema mismatches.

### 5. Public Interface
- **Dynamic Volunteering**: View past highlights, reports, and experiences shared by volunteers.
- **Event Registration**: Automated visitor pass generation with downloadable QR/Canvas cards.
- **Activity Calendar**: Dynamic fetching of the active Academic Year's proposed activities.
- **3D Hero**: Interactive 3D rotating logo built with React Three Fiber.
