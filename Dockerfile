# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build the Node Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
# We will use tsx in production for simplicity, but pre-building is better.
# For this setup, we just copy the typescript files since tsx is in package.json

# Stage 3: Production Image
FROM node:20-alpine
WORKDIR /app

# Copy the built frontend
COPY --from=frontend-builder /app/client/dist ./client/dist

# Copy the backend
WORKDIR /app/server
COPY --from=backend-builder /app/server ./

# Create uploads directory
RUN mkdir -p /app/uploads && chown node:node /app/uploads

# Expose the API and Frontend Port
EXPOSE 8080

# Environment variables for production
ENV NODE_ENV=production
ENV PORT=8080

# Run as non-root user
USER node

# Start the server
CMD ["npm", "run", "start"]
