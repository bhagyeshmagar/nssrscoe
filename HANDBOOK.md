# NSS RSCOE - Developer Handbook

Welcome to the Developer Handbook for the NSS RSCOE platform. This document outlines the project architecture, database schema, security posture, and workflows for developing the platform.

## 1. Architecture Overview

This project is a decoupled full-stack application.
- **Frontend (Client)**: A Single Page Application (SPA) built with React, Vite, TailwindCSS, and Zustand for state management. It communicates with the backend via Axios REST API calls.
- **Backend (Server)**: A Node.js Express server handling API routing, authentication, file uploads (Multer), and business logic.
- **Database**: Microsoft SQL Server (MSSQL), managed using Drizzle ORM.

### Tech Stack
- **Frontend**: React 18, TypeScript, TailwindCSS, Vite, Zustand, React Router DOM, React Hook Form, Zod.
- **Backend**: Express, TypeScript, Drizzle ORM (Node-MSSQL), JWT, Multer, Helmet, Rate-Limit.

---

## 2. Security Posture

The application implements strict security measures to protect against common web vulnerabilities.

1. **Content Security Policy (CSP)**: `helmet` enforces a strict CSP, preventing Cross-Site Scripting (XSS) by only allowing scripts and assets from `'self'` and trusted CDNs (like Google Fonts).
2. **HTTP Parameter Pollution (HPP)**: `hpp` middleware intercepts and sanitizes duplicate query string parameters to prevent array-based pollution attacks.
3. **Rate Limiting**: 
   - Global API: 3000 requests per 15 minutes.
   - Login Route: 20 requests per 15 minutes to prevent brute forcing.
   - File Uploads: 50 uploads per 5 minutes to prevent DoS attacks.
4. **SQL Injection Protection**: Drizzle ORM uses parameterized queries automatically, rendering standard SQL injection impossible.
5. **Path Traversal Protection**: Uploaded files are renamed using randomly generated UUID-like timestamps. Original filenames are never used for disk writes.

---

## 3. Database & ORM (Drizzle)

The database schema is defined in `server/src/db/schema.ts`.

### Key Tables
- `admins`: Stores superadmin and regular admin credentials (passwords are bcrypt hashed).
- `volunteers`: Stores user profiles.
- `events`: Central entity for NSS events.
- `eventRegistrations`: Junction table linking volunteers to events (attendance tracking).
- `gallery` & `homeSliderImages`: Tracks uploaded media files.
- `innovativeIdeas`: Stores ideas submitted by volunteers.

### Drizzle Query Conventions (MSSQL Specific)
When writing queries for MSSQL using Drizzle, there is a specific order of operations required for limit clauses:
- **Correct**: `db.select().top(10).from(events).where(...)`
- **Incorrect**: `db.select().from(events).where(...).limit(10)` (MSSQL does not support `.limit()` chained at the end in Drizzle, it uses `.top()` right after `.select()`).

---

## 4. Developer Workflows

### Running Locally
1. Start the database (Ensure MSSQL is running locally on port 1433).
2. `cd server` -> `npm run dev` (Starts backend on port 5000).
3. `cd client` -> `npm run dev` (Starts frontend on port 5173).

### Adding a New API Route
1. Define the route in `server/src/routes/`.
2. Define the controller logic in `server/src/controllers/`.
3. Add the route to `server/src/index.ts`.
4. Create the corresponding Axios call in `client/src/services/domains/` or `client/src/services/api.ts`.
5. Create a custom React Query hook in `client/src/hooks/` to consume the API.

### Authentication Flow
- The backend issues a JWT on `/api/auth/login`.
- The frontend stores this JWT in Zustand (`useAuthStore`) which persists to LocalStorage.
- Axios interceptors (`client/src/services/core/http.ts`) automatically attach this token as a `Bearer` header to all outgoing requests.
- The strict CSP mitigates XSS, making LocalStorage safe for token storage without the complexity of HttpOnly cookies.
