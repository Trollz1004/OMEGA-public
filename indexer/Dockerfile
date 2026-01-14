# ============================================================================
# FOR THE KIDS Platform - Event Indexer
# Gospel V1.4.1 SURVIVAL MODE
# Docker Configuration
# ============================================================================

FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/
COPY migrations/ ./migrations/

# Build TypeScript
RUN npm run build

# ============================================================================
# Production image
# ============================================================================

FROM node:20-alpine AS production

# Add labels
LABEL maintainer="FOR THE KIDS Platform"
LABEL description="Event Indexer Service - Gospel V1.4.1 SURVIVAL MODE"
LABEL version="1.4.1"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S indexer -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --production && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

# Change ownership to non-root user
RUN chown -R indexer:nodejs /app

# Switch to non-root user
USER indexer

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Environment variables with defaults
ENV NODE_ENV=production \
    PORT=3000 \
    DB_HOST=postgres \
    DB_PORT=5432 \
    DB_NAME=indexer \
    DB_USER=postgres \
    BATCH_SIZE=1000 \
    POLL_INTERVAL_MS=12000

# Start the service
CMD ["node", "dist/index.js"]
