# NSS Website — Complete Setup Guide

Full-stack web application: **React (Vite) + Express (TypeScript) + Microsoft SQL Server (MSSQL) + Drizzle ORM**.

---

## Prerequisites

Install the following tools before starting.

| Tool | Minimum Version | Notes |
|---|---|---|
| Node.js | v20+ | Use LTS. [nodejs.org](https://nodejs.org) |
| npm | v10+ | Bundled with Node.js |
| Microsoft SQL Server | 2019+ | Express Edition is free |
| SSMS (optional) | Any | SQL Server Management Studio for DB inspection |
| Git | Any | For cloning the repo |
| Docker + Docker Compose | v24+ | **Only for Docker setup** |

---

## Part 1 — Local Development Setup

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd nssrscoe
```

### Step 2: Install Dependencies

Install both client and server separately.

```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

> [!NOTE]
> Running `npm install` automatically downloads and sets up all required libraries for the project. The key libraries installed are:
> 
> **Server-side (Node.js & Express):**
> - **Express** (`express`): The core web framework.
> - **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`): The database ORM used to interact with SQL Server.
> - **Microsoft SQL Server Driver** (`mssql`): The native database driver.
> - **Zod** (`zod`): Used for strict schema validation of API requests.
> - **Socket.IO** (`socket.io`): For real-time WebSocket notifications.
> - **Resend & Nodemailer** (`resend`, `nodemailer`): For sending automated emails.
> - **Multer** (`multer`): For handling file uploads (reports, profile pictures).
> 
> **Client-side (React & Vite):**
> - **React & Vite** (`react`, `vite`): The core UI library and build tool.
> - **Tailwind CSS** (`tailwindcss`): For utility-first styling and layout.
> - **Radix UI** (`@radix-ui/react-*`): For accessible unstyled UI components (modals, dropdowns, tabs).
> - **Zustand** (`zustand`): For global client-side state management.
> - **React Router** (`react-router-dom`): For page navigation.
> - **Axios** (`axios`): For making API requests to the Express server.
> - **Lucide React** (`lucide-react`): For the SVG icons used throughout the dashboard.

### Step 3: Configure the Server Environment

Create a `.env` file inside the `server/` directory:

```bash
# server/.env
```

Paste and fill in these variables:

```env
# ─── Server ───────────────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ─── Database (MS SQL Server) ─────────────────────────────────────
DB_SERVER=localhost\SQLEXPRESS     # or just: localhost (for default instance)
DB_DATABASE=nss_db
DB_USER=your_sql_username           # Leave blank if using Windows Auth (see note)
DB_PASSWORD=your_sql_password       # Leave blank if using Windows Auth
DB_TRUST_CERT=true                  # Set to true for local dev; false for prod with proper cert

# ─── Auth ─────────────────────────────────────────────────────────
# Generate a strong secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_minimum_32_character_secret_here

# ─── Email (Resend) ───────────────────────────────────────────────
# Optional — needed for meeting reminders and email reports
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── CORS (Production Only) ───────────────────────────────────────
# Comma-separated list of allowed origins. Leave blank for dev (all origins allowed).
ALLOWED_ORIGINS=

# ─── Seed ─────────────────────────────────────────────────────────
# Password used for all admin accounts created by the seed script
DEFAULT_SEED_PASSWORD=changeme
```

> [!IMPORTANT]
> **Windows Authentication**: If your SQL Server uses Windows Auth, leave `DB_USER` and `DB_PASSWORD` blank. The `mssql` driver will use the OS-level credentials. You may also need to set `DB_TRUSTED_CONNECTION=true` in the connection config.

> [!CAUTION]
> `JWT_SECRET` must be **at least 32 characters**. The server will refuse to start if it's shorter. Generate one with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### Step 4: Configure the Client Environment

Create a `.env` file inside the `client/` directory:

```env
# client/.env
VITE_API_URL=http://localhost:5000
```

> [!NOTE]
> Vite only exposes variables prefixed with `VITE_` to the browser. The server URL must match your `PORT` in `server/.env`.

### Step 5: Set Up the Database

**a) Create the Database in SQL Server**

Open SSMS (or `sqlcmd`) and run:
```sql
CREATE DATABASE nss_db;
```

**b) Push the Drizzle Schema (create all tables)**

```bash
cd server
npm run db:push
```

This reads `src/db/schema.ts` and creates all tables in `nss_db`. Run this whenever the schema changes.

**c) Seed Initial Data**

```bash
cd server
npm run db:seed
```

This creates:
- Default admin accounts (superadmin + regular admins)
- All core team role definitions
- Default site settings

Default credentials created by seed (change immediately after first login):

| Username | Role | Default Password |
|---|---|---|
| `superadmin` | Superadmin | `changeme` (or `DEFAULT_SEED_PASSWORD`) |
| `admin@email.com` | Superadmin | `changeme` |
| `nsspo@email.com` | Admin | `changeme` |
| `website@email.com` | Admin | `changeme` |

### Step 6: Run the Development Servers

Open **two terminals**.

**Terminal 1 — Server:**
```bash
cd server
npm run dev
# Server starts at http://localhost:5000
```

**Terminal 2 — Client:**
```bash
cd client
npm run dev
# Client starts at http://localhost:5173
```

The application is now running. Navigate to `http://localhost:5173` in your browser.

---

## Part 2 — Docker Deployment

### Step 1: Create a Root `.env` File

At the **project root** (not inside `/server` or `/client`), create a `.env` file:

```env
# .env (root — used by docker-compose)

DB_SERVER=host.docker.internal\SQLEXPRESS
DB_DATABASE=nss_db
DB_USER=your_sql_username
DB_PASSWORD=your_sql_password

JWT_SECRET=your_minimum_32_character_secret_here
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> [!IMPORTANT]
> **`host.docker.internal`** is Docker's magic hostname that routes to the host machine. This lets the container reach your local SQL Server. This works on Windows/macOS natively; on Linux you may need to add `--add-host=host.docker.internal:host-gateway` (already in the `docker-compose.yml`).

### Step 2: Ensure SQL Server Allows Remote Connections

In SSMS:
1. Right-click the server → **Properties → Connections** → enable **Allow remote connections**
2. Open **SQL Server Configuration Manager** → enable **TCP/IP** protocol → restart SQL Server service
3. Ensure port **1433** is open in Windows Firewall

### Step 3: Build and Start Containers

```bash
# From the project root
docker-compose up --build
```

| Service | Container | Port |
|---|---|---|
| Express API | `nss_server` | `5000` |
| React (Nginx) | `nss_client` | `3000` |

The app is accessible at `http://localhost:3000`.

### Step 4: Push Schema & Seed (First-time only)

```bash
# Run inside the server container
docker exec -it nss_server npx tsx src/scripts/migrate.ts
docker exec -it nss_server npx tsx src/scripts/seedAll.ts
```

Or run them locally (pointing to the same DB) before bringing containers up.

### Step 5: Managing Uploads Volume

Uploaded files are stored in a Docker named volume `server_uploads` which persists across container restarts. To backup:

```bash
docker run --rm -v nssrscoe_server_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup.tar.gz -C /data .
```

---

## Part 3 — Production Deployment (Manual / VPS)

### Step 1: Build the Client

```bash
cd client
npm run build
# Output: client/dist/
```

Serve `client/dist/` with **Nginx** or any static file server.

### Step 2: Build the Server

```bash
cd server
npm run build
# Output: server/dist/
```

### Step 3: Start the Server

```bash
cd server
npm run start:prod
# Runs: drizzle-kit push && tsx scripts/migrateGallery.ts && node dist/index.js
```

> [!NOTE]
> `start:prod` automatically pushes the latest schema before starting the server — safe to run on re-deploy.

### Step 4: Sample Nginx Config (Reverse Proxy + Static)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve React build
    root /var/www/nssrscoe/client/dist;
    index index.html;

    # Client-side routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to Express
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy uploaded files
    location /uploads/ {
        proxy_pass http://localhost:5000;
    }

    # WebSocket (Socket.IO)
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Step 5: Process Manager (PM2)

Use PM2 to keep the server running:

```bash
npm install -g pm2
pm2 start server/dist/index.js --name nss-server
pm2 startup   # Configure auto-start on reboot
pm2 save
```

### Step 6: Set `ALLOWED_ORIGINS`

In production, set this in your server `.env` to restrict CORS:

```env
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

---

## Part 4 — Environment Variable Reference

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `development` or `production` |
| `PORT` | ✅ | Express server port (default: `5000`) |
| `DB_SERVER` | ✅ | MSSQL server hostname or `host\instance` |
| `DB_DATABASE` | ✅ | Database name |
| `DB_USER` | ⚠️ | SQL auth username (omit for Windows Auth) |
| `DB_PASSWORD` | ⚠️ | SQL auth password (omit for Windows Auth) |
| `DB_TRUST_CERT` | ✅ | `true` for local/dev; `false` for prod with real certs |
| `JWT_SECRET` | ✅ | Min 32-char secret for signing JWTs |
| `RESEND_API_KEY` | Optional | For meeting reminder emails and reports |
| `ALLOWED_ORIGINS` | Prod only | Comma-separated allowed CORS origins |
| `DEFAULT_SEED_PASSWORD` | Optional | Default password for seeded admin accounts |

### Client (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Full URL of the Express server (e.g. `http://localhost:5000`) |

---

## Part 5 — Useful npm Scripts

### Server

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Hot-reload with `tsx watch` |
| Production build | `npm run build` | Compiles TypeScript to `dist/` |
| Production start | `npm run start:prod` | Push schema + start server |
| Push DB schema | `npm run db:push` | Sync Drizzle schema to MSSQL |
| Seed database | `npm run db:seed` | Create default admins, roles, settings |
| Drizzle Studio | `npm run db:studio` | Visual DB browser at `localhost:4983` |
| Run tests | `npm run test` | Vitest unit tests |

### Client

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Vite dev server at `localhost:5173` |
| Production build | `npm run build` | TypeScript check + Vite build to `dist/` |
| Run tests | `npm run test` | Vitest unit tests |
| E2E tests | `npm run test:e2e` | Playwright tests |
| Preview build | `npm run preview` | Serve the production `dist/` locally |

---

## Part 6 — Features & Background Services

### Cron Jobs
A daily cron job runs at **8:00 AM** automatically when the server starts (in non-test environments). It:
- Finds meetings scheduled for **tomorrow**
- Sends in-app notifications to all relevant volunteers
- Sends reminder emails via Resend (in chunks of 50)

### Socket.IO
Real-time notifications are delivered via Socket.IO, which is initialized automatically alongside the HTTP server on the same port (`5000`). No extra port is needed.

### PWA
The client is configured as a Progressive Web App (PWA) via `vite-plugin-pwa`. Users can install it on mobile devices. The manifest uses the name **"NSS Dashboard"**.

---

## Common Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| `JWT_SECRET must be at least 32 characters` | Short secret in `.env` | Generate one with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `Cannot connect to SQL Server` | Wrong `DB_SERVER` or TCP/IP disabled | Enable TCP/IP in SQL Server Config Manager; check instance name |
| `CORS error in browser` | `VITE_API_URL` wrong or CORS misconfigured | Ensure `VITE_API_URL` points to correct server URL |
| `db:push` fails | Database doesn't exist | Create it manually in SSMS: `CREATE DATABASE nss_db;` |
| Docker can't reach SQL Server | `host.docker.internal` not resolving | On Linux, add `extra_hosts` entry (already in `docker-compose.yml`) |
| Container uploads disappear | Volume not mounted | Ensure `server_uploads` volume is in `docker-compose.yml` |
