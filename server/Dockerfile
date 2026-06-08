# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY tsconfig.json ./
COPY src/ ./src/
COPY drizzle.config.ts ./
COPY drizzle/ ./drizzle/
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install all dependencies (we need drizzle-kit for runtime migrations)
COPY package*.json ./
RUN npm install

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Ensure uploads directory exists
RUN mkdir -p uploads && chown node:node uploads

# Expose the API port
EXPOSE 5000

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=5000

# Run as non-root user
USER node

# Start the application with automated database migrations
CMD ["npm", "run", "start:prod"]
