# Base stage
FROM node:18-bullseye-slim AS base

LABEL org.opencontainers.image.authors="kiamajames29@gmail.com"

WORKDIR /usr/src/app

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl

# Copy package files
COPY package*.json ./

# Install dependencies for development and build
RUN npm set cache /usr/src/app/.npm && npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Copy the rest of the source code
COPY . .

# Build stage
FROM base AS build

# Build the application
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Production stage
FROM node:18-bullseye-slim AS production

WORKDIR /usr/src/app

# Create a non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm set cache /usr/src/app/.npm && \
    npm ci --omit=dev --ignore-scripts

# Copy built files and necessary runtime files
COPY --from=build --chown=nodejs:nodejs /usr/src/app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nodejs:nodejs /usr/src/app/prisma ./prisma

# Generate Prisma client in production stage
RUN npx prisma generate

# Copy environment file
COPY --chown=nodejs:nodejs .env ./

# Set NODE_ENV
ENV NODE_ENV=production

# Create logs directory with correct ownership
RUN mkdir -p /usr/src/app/logs && chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 6170

# Start the application
# CMD ["node", "dist/index.js"]