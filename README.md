# NSS Website - JSPM RSCOE

This is a full-stack website for the NSS Club at JSPM Rajarshi Shahu College of Engineering.

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, React Three Fiber.
- **Backend**: Node.js, Express.js, TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### 1. Database Setup
Ensure you have a PostgreSQL database running.
Update the `server/.env` file with your connection string:
```
DATABASE_URL=postgres://user:password@localhost:5432/nss_db
```

### 2. Backend Setup
```bash
cd server
npm install
# Push schema to database
npx drizzle-kit push
# Seed admin user (username: admin, password: admin123)
npx tsx src/scripts/seed.ts
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

## Features

### Academic-Year Scoped Architecture
The entire platform is designed around dynamic **Academic Years (AY)** (e.g., *2025-26*). 
All major entities are strictly scoped to an Academic Year:
- **Volunteers**: Tracked per AY with active/backup statuses and individual profiles.
- **Core Team**: Hierarchical roles (Institution level, Department level, Student Coordinators) are assigned per AY.
- **Attendance**: Managed individually for events within a specific AY.
- **Special Camps**: Camp assignments, participants, and details are isolated per AY.

### Admin Dashboard
- **Academic Years Management**: Create, lock, archive, and set active Academic Years.
- **Volunteer Management**: Add, approve, edit profiles, and track volunteer statuses.
- **Core Team Management**: Assign specific roles (e.g., PO, APO, Dept Coordinator, NSS Lead) to volunteers.
- **Event & Attendance**: Track events and log attendance easily via bulk-selection interfaces.
- **Site Management**: Edit public-facing settings (hero text, stats, mission).

### Public Interface
- **Dynamic Volunteering**: Volunteers can view their own profile, submit their details, and view open events.
- **Event Registration**: Visitor pass generation and lookup for events.
- **Gallery & Members**: View past highlights and active core members dynamically loaded based on the Active AY.
- **3D Hero**: Interactive 3D rotating logo built with React Three Fiber.
