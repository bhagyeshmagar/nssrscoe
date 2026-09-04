# Azure Setup and Deployment Guide

This guide details two standard methods for deploying the NSS RSCOE platform to Microsoft Azure. 

- **Option A**: Azure Static Web Apps (Frontend) + Azure App Service (Backend)
- **Option B**: Azure Container Apps (Dockerized Full-Stack)

---

## Prerequisites
1. An active Azure Subscription.
2. The Azure CLI installed locally (`az login`).
3. An Azure SQL Database instance provisioned and running.
4. An Azure Storage Account (optional, if you plan to move Multer uploads off local disk to Azure Blob Storage in the future).

---

## 🏗️ Option A: Static Web Apps + App Service (Recommended for Speed & Cost)

In this architecture, the React frontend is served globally via a fast CDN (Static Web Apps), and the Node.js Express server is hosted on a Linux App Service.

### Step 1: Deploying the Backend (Azure App Service)
1. **Create the App Service**:
   - Go to Azure Portal > Create a resource > **Web App**.
   - Publish: **Code**.
   - Runtime stack: **Node 20 LTS**.
   - Operating System: **Linux**.
2. **Configure Environment Variables**:
   - In your Web App, go to **Settings > Environment variables**.
   - Add the variables matching `server/env.template` (e.g., `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`).
   - Set `PORT` to `8080` (Azure App Service automatically routes traffic to this port).
3. **Configure Startup Command**:
   - Under **Configuration > General settings**, set the Startup Command to: `npm run start` (ensure your `package.json` has a `"start": "npx tsx src/index.ts"` or builds the TS and runs node).
4. **Deploy**:
   - Use the **Deployment Center** in Azure to link your GitHub repository, selecting the `/server` folder as the root.

### Step 2: Deploying the Frontend (Azure Static Web Apps)
1. **Create the Static Web App**:
   - Go to Azure Portal > Create a resource > **Static Web App**.
   - Choose your GitHub repository.
2. **Build Details**:
   - Build Presets: **React**.
   - App location: `/client` (where your React app is).
   - Api location: Leave blank.
   - Output location: `dist`.
3. **Configure Environment Variables**:
   - In the Static Web App settings, add `VITE_API_URL` and point it to your App Service URL (e.g., `https://nss-rscoe-api.azurewebsites.net/api`).
4. **CORS Configuration**:
   - In your Backend App Service, go to **CORS** and add the URL of your new Azure Static Web App to allow cross-origin requests.

---

## 🐳 Option B: Azure Container Apps (Recommended for Scalability)

In this architecture, the entire application (Frontend + Backend) is built into a single Docker image and deployed to Azure Container Apps. The Express backend serves the static React files.

### Step 1: Build the Docker Image
A `Dockerfile` has been provided in the root of the repository. It builds the React frontend, copies it into the backend's static directory, and runs the Node.js server.

### Step 2: Push to Azure Container Registry (ACR)
1. Create an Azure Container Registry (ACR) in the Azure Portal.
2. Login to ACR via CLI: `az acr login --name <RegistryName>`
3. Build and tag the image: 
   ```bash
   docker build -t <RegistryName>.azurecr.io/nssrscoe:latest .
   ```
4. Push the image:
   ```bash
   docker push <RegistryName>.azurecr.io/nssrscoe:latest
   ```

### Step 3: Deploy to Azure Container Apps
1. Create a new **Container App** in the Azure Portal.
2. Select **Use existing image** and point it to the ACR image you just pushed.
3. Under **Environment Variables**, inject all variables required by `server/env.template`.
4. Enable **Ingress**, set it to accept traffic from anywhere, and map Target Port to `5000` (or whatever the Dockerfile exposes).

---

## 🚀 Azure Optimizations Applied to this Repository

To make this project Azure-ready, the following optimizations exist in the codebase:
1. **Drizzle ORM Azure SQL SSL**: The database connection string `options.encrypt` is explicitly set to `true`, which is strictly required by Azure SQL.
2. **Dynamic Port Binding**: The Express server listens on `process.env.PORT`, allowing Azure App Service to dynamically assign ports (usually 8080).
3. **Static File Serving (Docker)**: The `index.ts` has been optimized to serve static files from `client/dist` if running in a containerized environment (Option B).
4. **Helmet Trust Proxies**: Azure sits behind load balancers. Express is configured to trust proxies so IP-based rate limiting (`express-rate-limit`) works correctly in the cloud.
