# Base stage
FROM node:18-alpine AS base

LABEL org.opencontainers.image.authors="kiamajames29@gmail.com"

WORKDIR /usr/src/app

# Install OpenSSL
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies for development and build
RUN npm set cache /usr/src/app/.npm && npm ci --no-audit

# Copy the rest of the source code
COPY . .

# Build stage
FROM base AS build

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

LABEL org.opencontainers.image.authors="kiamajames29@gmail.com"

WORKDIR /usr/src/app

# Create a non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Copy package files
COPY package*.json ./

# Install only production dependencies (ignore husky hooks)
RUN npm set cache /usr/src/app/.npm && npm ci --no-audit --omit=dev --ignore-scripts

# Copy built files and necessary runtime files
COPY --from=build /usr/src/app/dist ./dist

# Copy environment file
COPY .env ./

# Set NODE_ENV
ENV NODE_ENV=production

# Create logs directory with correct ownership
RUN mkdir -p /usr/src/app/logs && chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 6170

# Start the application
CMD ["node", "dist/index.js"]