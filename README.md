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
- **Admin**: Login, CRUD for Events, Gallery, Members.
- **Visitor**: View Events, Gallery, Members, About Us. Register for events.
- **3D**: Rotating logo in Hero section.

