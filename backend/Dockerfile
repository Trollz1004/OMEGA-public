# FOR THE KIDS - Production API Dockerfile
# GOSPEL V1.3: 60/30/10
# Cache bust: 2025-12-15-v5-gemini3pro-sdk-update

FROM node:20-slim

# Install openssl (required by Prisma) and cleanup to reduce image size
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all deps (dev needed for prisma generate)
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Copy application code
COPY . .

# Railway injects PORT env var dynamically
EXPOSE ${PORT:-3000}

# Start the server
CMD ["npm", "start"]
