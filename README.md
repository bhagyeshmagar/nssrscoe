# NSS Website - JSPM RSCOE

Created by **Bhagyesh Magar** for the love of the club.

This is a full-stack, highly optimized web application for the NSS (National Service Scheme) Club at JSPM Rajarshi Shahu College of Engineering. It serves as both a public-facing informational portal and a robust administrative tool for managing volunteers, events, and academic year data.

## 🚀 Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Radix UI + Lucide React
- **Animations**: Framer Motion + React Three Fiber (for 3D Hero)
- **State Management**: Zustand
- **Routing**: React Router DOM (v7)
- **Data Fetching**: Axios
- **PWA Support**: Vite PWA Plugin
- **Testing**: Vitest + Playwright (E2E)

### Backend
- **Framework**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT & bcryptjs
- **Validation**: Zod
- **Real-time**: Socket.io
- **Emails**: Resend
- **File Uploads**: Multer
- **Background Tasks**: node-cron

### Infrastructure & Deployment
- **Containerization**: Docker & Docker Compose
- **Scripting**: Shell scripts for AWS deployment & Nginx configuration

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Docker & Docker Compose (Optional, for containerized setup)

### 1. Database Setup
Ensure you have a PostgreSQL database running.
Update the `server/.env` file with your connection string and other secrets:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=nss_db
DATABASE_URL=postgres://postgres:password@localhost:5432/nss_db
JWT_SECRET=your_super_secret_jwt_key
ALLOWED_ORIGINS=http://localhost:5173
RESEND_API_KEY=your_resend_api_key
PORT=5000
```

### 2. Backend Setup
```bash
cd server
npm install
# Push schema to database
npm run db:push
# Seed admin user and core roles
npm run db:seed:all
# Start dev server
npm run dev
```
Server runs on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd client
npm install
# Start dev server
npm run dev
```
Client runs on `http://localhost:5173`

### 4. Docker Setup
You can also run the entire application via Docker.
```bash
docker-compose up --build -d
```
This sets up PostgreSQL, the Node server, and the Vite client in interconnected containers.

## 🔑 Default Admin Credentials
- Username: `admin`
- Password: `admin123`

---

## 🏗️ Architecture & Features

### 1. Academic-Year Scoped Data
The entire platform is designed around dynamic **Academic Years (AY)** (e.g., *2025-26*). 
All major entities are strictly scoped to an Academic Year:
- **Volunteers**: Tracked per AY with active/backup statuses and comprehensive individual profiles.
- **Core Team**: Hierarchical roles (Institution level, Department level, Student Coordinators) are assigned per AY.
- **Attendance**: Managed individually for events within a specific AY.
- **Special Camps**: Camp assignments, participants, and details are isolated per AY. Features a configurable exact volunteer capacity (e.g., exactly 50 volunteers).
- **CRUD & Locking**: Superadmins have full CRUD capabilities for Academic Years, including unarchiving and deleting. When an Academic Year is locked, all CRUD operations on its associated academic calendar and events are strictly disabled.

### 2. Modular Frontend Architecture
The React application is structured into scalable, maintainable components:
- **Admin Dashboard**: A highly modularized interface with isolated tabs for managing Academic Years, Core Teams, Volunteers, Events, Gallery, Members, Settings, and Registrations.
- **Volunteer & Core Team Dashboards**: Self-service portals for volunteers and core team members to manage their profiles, update passwords, view their peers, and handle responsibilities.
- **Reusable UI Components**: Features like `VisitorPassCard`, `ImageLightbox`, and `EventRegistrationModal` are cleanly extracted for reuse under `src/components/ui/` and `src/components/common/`.
- **Public Pages**: Extensive public pages for History, Mission, Gallery, Past/Upcoming Events, and About sections.

### 3. Comprehensive Backend APIs
The Node.js backend handles complex business logic and serves multiple domains:
- **Authentication & Authorization**: Role-based access control (RBAC) supporting Superadmins, Core Team members, and regular Volunteers.
- **Attendance & Meetings**: Endpoints to track volunteer attendance and log core team meetings.
- **Events & Registration**: Logic for public event registrations and event image management.
- **Audit Logs**: Keeping track of critical actions performed by admins for accountability.
- **Notifications**: Automated real-time alerts or email notifications.

### 4. Performance & Optimization
The project has been aggressively optimized for fast load times and smooth interactions:
- **Route-Based Code Splitting**: Utilizes `React.lazy()` to split the application into smaller chunks, reducing the initial JavaScript payload by over 50%.
- **Eliminated Cascading Renders**: React hooks are strictly optimized to prevent duplicate synchronous re-renders, eliminating UI stutter on dashboard loads.
- **Backend Rate Limiting**: API endpoints are protected with `express-rate-limit` and `helmet` to prevent abuse and ensure stability.
- **Progressive Web App (PWA)**: Supports offline caching and installability via the Vite PWA plugin.

### 5. Strict Type Safety
- **End-to-End TypeScript**: Built with 100% strict TypeScript. API boundaries are hardened with precise interfaces, entirely eliminating `any` fallbacks.
- **Drizzle ORM & Zod**: The backend database layer is entirely type-safe, preventing schema mismatches, and request payloads are validated using Zod.

### 6. Public Interface
- **Dynamic Volunteering**: View past highlights, reports, and experiences shared by volunteers.
- **Event Registration**: Automated visitor pass generation with downloadable QR/Canvas cards.
- **Activity Calendar**: Dynamic fetching of the active Academic Year's proposed activities.
- **3D Hero**: Interactive 3D rotating logo built with React Three Fiber.

---

## 📁 Project Structure

```text
nss_website/
├── client/                     # React Frontend
│   ├── e2e/                    # Playwright E2E Tests
│   ├── src/                    # Source Code
│   │   ├── components/         # Reusable Components (admin, common, ui, etc.)
│   │   ├── lib/                # Utility Functions
│   │   ├── pages/              # Page Components (Home, AdminDashboard, etc.)
│   │   ├── services/           # API Integration (Axios)
│   │   └── stores/             # Zustand State Stores
│   ├── package.json            # Frontend Dependencies
│   └── vite.config.ts          # Vite Configuration
│
├── server/                     # Node.js Backend
│   ├── src/                    # Source Code
│   │   ├── controllers/        # Request Handlers
│   │   ├── db/                 # Drizzle Schema & Connection
│   │   ├── middleware/         # Auth, Rate Limiting, Error Handling
│   │   ├── routes/             # Express API Routes
│   │   ├── scripts/            # Database Seeding & Maintenance
│   │   └── services/           # Business Logic & External APIs
│   ├── package.json            # Backend Dependencies
│   └── drizzle.config.ts       # Drizzle Configuration
│
├── docker-compose.yml          # Container Orchestration
└── deploy_aws.sh               # AWS Deployment Script
```
