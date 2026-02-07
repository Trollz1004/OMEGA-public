# Docker Deployment Guide

Complete guide for deploying the Dating Platform using Docker and Docker Compose.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Production Configuration](#production-configuration)
4. [SSL/HTTPS Setup with Let's Encrypt](#sslhttps-setup-with-lets-encrypt)
5. [Scaling Considerations](#scaling-considerations)
6. [Backup and Restore Procedures](#backup-and-restore-procedures)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## Prerequisites

### Software Requirements

#### Docker Engine

| Platform | Minimum Version | Recommended Version |
|----------|-----------------|---------------------|
| Linux    | 20.10+          | 24.0+               |
| Windows  | Docker Desktop 4.15+ | Docker Desktop 4.25+ |
| macOS    | Docker Desktop 4.15+ | Docker Desktop 4.25+ |

**Installation:**

```bash
# Linux (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect

# Verify installation
docker --version
docker run hello-world
```

For Windows and macOS, download Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop).

#### Docker Compose

Docker Compose V2 is required (included with Docker Desktop).

```bash
# Verify Docker Compose installation
docker compose version

# Expected output: Docker Compose version v2.x.x
```

For standalone installation on Linux:

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Hardware Requirements

#### Minimum Requirements (Development/Testing)

| Component | Specification |
|-----------|---------------|
| CPU       | 2 cores       |
| RAM       | 4 GB          |
| Storage   | 20 GB SSD     |
| Network   | 10 Mbps       |

#### Recommended Requirements (Production)

| Component | Specification |
|-----------|---------------|
| CPU       | 4+ cores      |
| RAM       | 8-16 GB       |
| Storage   | 100+ GB SSD   |
| Network   | 100+ Mbps     |

#### GPU Requirements (for Ollama/AI Services)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| GPU       | NVIDIA GTX 1050 Ti (4GB VRAM) | NVIDIA RTX 3060 (12GB VRAM) |
| CUDA      | 11.7+ | 12.0+ |

**Note:** The docker-compose.yml is optimized for GTX 1050Ti with 4GB VRAM. For GPUs with more VRAM, adjust `OLLAMA_GPU_MEMORY` accordingly.

### Network Requirements

Ensure the following ports are available:

| Port | Service | Required |
|------|---------|----------|
| 80   | HTTP (Frontend) | Yes |
| 443  | HTTPS | Yes (Production) |
| 3000 | Backend API | Yes |
| 3001 | Admin Dashboard | Yes |
| 3002 | AI Services | Optional |
| 5432 | PostgreSQL | Internal |
| 6379 | Redis | Internal |
| 9000 | MinIO API | Optional |
| 9001 | MinIO Console | Optional |
| 11434 | Ollama | Optional |

---

## Quick Start

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/dating-platform.git
cd dating-platform
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Generate secure secrets
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
echo "SESSION_SECRET=$(openssl rand -hex 32)" >> .env
```

Edit `.env` with your configuration:

```bash
# Minimum required configuration
NODE_ENV=production
POSTGRES_PASSWORD=your_secure_database_password
REDIS_PASSWORD=your_secure_redis_password
JWT_SECRET=your_generated_jwt_secret

# Square Payment Configuration (required for payments)
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_ENVIRONMENT=production
```

### Step 3: Start Services

```bash
# Build and start all services
docker compose up -d --build

# View startup logs
docker compose logs -f
```

### Step 4: Verify Deployment

```bash
# Check service status
docker compose ps

# Verify health endpoints
curl http://localhost:3000/health   # Backend API
curl http://localhost:8080          # Frontend
curl http://localhost:3001          # Admin Dashboard
```

### Service URLs (Default)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:3000 |
| Admin Dashboard | http://localhost:3001 |
| MinIO Console | http://localhost:9001 |
| MailHog (Dev) | http://localhost:8025 |
| Prisma Studio (Dev) | http://localhost:5555 |

### Development Mode

To include development-only services (Prisma Studio):

```bash
docker compose --profile development up -d
```

---

## Production Configuration

### Environment File for Production

Create a production-specific `.env.production`:

```bash
# Application
NODE_ENV=production
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com

# Database (use strong passwords)
POSTGRES_USER=dating_prod
POSTGRES_PASSWORD=<generate-with-openssl-rand-hex-32>
POSTGRES_DB=dating_platform

# Redis
REDIS_PASSWORD=<generate-with-openssl-rand-hex-32>

# Security
JWT_SECRET=<generate-with-openssl-rand-hex-32>
SESSION_SECRET=<generate-with-openssl-rand-hex-32>
ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>

# Square Payments (Production)
SQUARE_ACCESS_TOKEN=your_production_access_token
SQUARE_APPLICATION_ID=your_production_app_id
SQUARE_LOCATION_ID=your_production_location_id
SQUARE_ENVIRONMENT=production

# Email (Production SMTP)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@yourdomain.com

# MinIO (use strong credentials)
MINIO_ROOT_USER=minio_prod_admin
MINIO_ROOT_PASSWORD=<generate-with-openssl-rand-hex-32>

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

### Production Docker Compose Override

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"

  redis:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "3"

  backend:
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"

  frontend:
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "3"

  admin:
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'

  ai-services:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'

  # Disable development services
  mailhog:
    profiles:
      - development

  prisma-studio:
    profiles:
      - development
```

### Launch Production Stack

```bash
# Use production configuration
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify all services are healthy
docker compose ps
docker compose logs --tail=100
```

### Security Hardening

#### 1. Network Isolation

Modify docker-compose.yml to restrict port exposure:

```yaml
services:
  postgres:
    # Remove external port mapping
    # ports:
    #   - "${POSTGRES_PORT:-5432}:5432"
    expose:
      - "5432"

  redis:
    # Remove external port mapping
    expose:
      - "6379"
```

#### 2. Read-Only Containers

Add security options to services:

```yaml
services:
  frontend:
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache/nginx
      - /var/run
```

#### 3. Non-Root User

Ensure containers run as non-root (already configured in AI services Dockerfile):

```dockerfile
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nodeuser
USER nodeuser
```

---

## SSL/HTTPS Setup with Let's Encrypt

### Option 1: Nginx Reverse Proxy with Certbot

#### Step 1: Create Nginx Configuration Directory

```bash
mkdir -p nginx/ssl
```

#### Step 2: Create Initial Nginx Configuration

Create `nginx/nginx-ssl.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=50r/s;

    # Upstream definitions
    upstream backend {
        server backend:3000;
    }

    upstream frontend_app {
        server frontend:80;
    }

    upstream admin_app {
        server admin:80;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com admin.yourdomain.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Main application (HTTPS)
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

        # SSL Configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        ssl_session_tickets off;

        # HSTS
        add_header Strict-Transport-Security "max-age=63072000" always;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Frontend
        location / {
            limit_req zone=general burst=20 nodelay;
            proxy_pass http://frontend_app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # WebSocket support
        location /socket.io {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Admin dashboard (HTTPS)
    server {
        listen 443 ssl http2;
        server_name admin.yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        add_header Strict-Transport-Security "max-age=63072000" always;

        location / {
            limit_req zone=general burst=10 nodelay;
            proxy_pass http://admin_app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### Step 3: Add SSL Proxy Service to Docker Compose

Create `docker-compose.ssl.yml`:

```yaml
version: '3.8'

services:
  nginx-proxy:
    image: nginx:alpine
    container_name: dating-platform-nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx-ssl.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - frontend
      - backend
      - admin
    networks:
      - dating-network

  certbot:
    image: certbot/certbot
    container_name: dating-platform-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - dating-network
```

#### Step 4: Obtain Initial Certificate

```bash
# Create directory structure
mkdir -p certbot/conf certbot/www

# Start nginx for initial certificate
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d nginx-proxy

# Request certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d admin.yourdomain.com

# Restart nginx to load certificate
docker compose -f docker-compose.yml -f docker-compose.ssl.yml restart nginx-proxy
```

#### Step 5: Certificate Auto-Renewal

Add to crontab:

```bash
# Edit crontab
crontab -e

# Add renewal job (runs twice daily)
0 0,12 * * * cd /path/to/dating-platform && docker compose run --rm certbot renew && docker compose restart nginx-proxy
```

### Option 2: Traefik with Automatic SSL

Create `docker-compose.traefik.yml`:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: dating-platform-traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=your-email@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - dating-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.yourdomain.com`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=admin:$$apr1$$..."

  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`yourdomain.com`) || Host(`www.yourdomain.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"

  backend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`yourdomain.com`) && PathPrefix(`/api`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"

  admin:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.admin.rule=Host(`admin.yourdomain.com`)"
      - "traefik.http.routers.admin.entrypoints=websecure"
      - "traefik.http.routers.admin.tls.certresolver=letsencrypt"
```

---

## Scaling Considerations

### Horizontal Scaling

#### Scale Backend Instances

```bash
# Scale to 3 backend replicas
docker compose up -d --scale backend=3

# Verify scaling
docker compose ps
```

#### Load Balancing Configuration

Update nginx configuration for multiple backends:

```nginx
upstream backend {
    least_conn;  # Use least connections algorithm
    server backend:3000 weight=1;
    keepalive 32;
}

# With specific replicas
upstream backend {
    least_conn;
    server dating-platform-api-1:3000;
    server dating-platform-api-2:3000;
    server dating-platform-api-3:3000;
}
```

### Database Scaling

#### Connection Pooling with PgBouncer

Add to docker-compose:

```yaml
services:
  pgbouncer:
    image: edoburu/pgbouncer:latest
    container_name: dating-platform-pgbouncer
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 20
    ports:
      - "6432:5432"
    depends_on:
      - postgres
    networks:
      - dating-network
```

Update backend to use PgBouncer:

```bash
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pgbouncer:5432/${POSTGRES_DB}
```

#### Read Replicas

For high-read workloads, configure PostgreSQL streaming replication:

```yaml
services:
  postgres-replica:
    image: postgres:15-alpine
    container_name: dating-platform-db-replica
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data
    command: |
      postgres
      -c hot_standby=on
      -c primary_conninfo='host=postgres port=5432 user=replicator password=replicator_password'
    depends_on:
      - postgres
    networks:
      - dating-network
```

### Redis Scaling

#### Redis Sentinel (High Availability)

```yaml
services:
  redis-sentinel:
    image: redis:7-alpine
    container_name: dating-platform-redis-sentinel
    command: redis-sentinel /etc/redis/sentinel.conf
    volumes:
      - ./redis/sentinel.conf:/etc/redis/sentinel.conf
    depends_on:
      - redis
    networks:
      - dating-network
```

### Resource Limits Reference

| Service | CPU Limit | Memory Limit | Recommended |
|---------|-----------|--------------|-------------|
| postgres | 1.0 | 2GB | 2GB-4GB |
| redis | 0.5 | 512MB | 512MB-1GB |
| backend | 1.0 | 1GB | 1GB per instance |
| frontend | 0.25 | 256MB | 256MB |
| admin | 0.25 | 256MB | 256MB |
| ai-services | 1.0 | 2GB | 2GB-4GB |
| ollama | 2.0 | 6GB | 8GB+ with GPU |

---

## Backup and Restore Procedures

### Automated Backup Script

Create `scripts/backup.sh`:

```bash
#!/bin/bash
# Dating Platform Backup Script

set -e

# Configuration
BACKUP_DIR="/backups/dating-platform"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Starting backup at $(date)"

# PostgreSQL Backup
echo "Backing up PostgreSQL..."
docker exec dating-platform-db pg_dump -U postgres dating_platform | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

# Redis Backup
echo "Backing up Redis..."
docker exec dating-platform-redis redis-cli -a "$REDIS_PASSWORD" BGSAVE
sleep 5
docker cp dating-platform-redis:/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# MinIO Backup (if using local MinIO)
echo "Backing up MinIO data..."
docker run --rm \
  -v minio_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/minio_$DATE.tar.gz /data

# Environment file backup (encrypted)
echo "Backing up configuration..."
openssl enc -aes-256-cbc -salt -pbkdf2 -in .env -out "$BACKUP_DIR/env_$DATE.enc" -pass pass:"$BACKUP_ENCRYPTION_KEY"

# Cleanup old backups
echo "Cleaning up old backups..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed at $(date)"
echo "Backup files:"
ls -lh $BACKUP_DIR/*_$DATE*
```

### Schedule Automated Backups

```bash
# Make script executable
chmod +x scripts/backup.sh

# Add to crontab (daily at 3 AM)
crontab -e
0 3 * * * /path/to/dating-platform/scripts/backup.sh >> /var/log/dating-backup.log 2>&1
```

### Restore Procedures

#### Restore PostgreSQL

```bash
# Stop backend services
docker compose stop backend ai-services admin

# Restore database
gunzip -c /backups/dating-platform/postgres_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i dating-platform-db psql -U postgres dating_platform

# Restart services
docker compose up -d backend ai-services admin
```

#### Restore Redis

```bash
# Stop Redis
docker compose stop redis

# Copy backup file
docker cp /backups/dating-platform/redis_YYYYMMDD_HHMMSS.rdb dating-platform-redis:/data/dump.rdb

# Restart Redis
docker compose up -d redis
```

#### Restore MinIO

```bash
# Stop MinIO
docker compose stop minio

# Restore data
docker run --rm \
  -v minio_data:/data \
  -v /backups/dating-platform:/backup \
  alpine tar xzf /backup/minio_YYYYMMDD_HHMMSS.tar.gz -C /

# Restart MinIO
docker compose up -d minio
```

### Offsite Backup (AWS S3)

```bash
# Install AWS CLI in backup script
# Upload to S3 after local backup
aws s3 sync $BACKUP_DIR s3://your-backup-bucket/dating-platform/ \
  --exclude "*" \
  --include "*_$DATE*"
```

---

## Monitoring and Logging

### Docker Logging Configuration

#### Centralized Logging with JSON

Default configuration in docker-compose.prod.yml:

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"
        labels: "service"
        env: "NODE_ENV"
```

#### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend

# Since specific time
docker compose logs --since="2024-01-01T00:00:00" backend
```

### Prometheus and Grafana Stack

Add monitoring services to docker-compose:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: dating-platform-prometheus
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
    networks:
      - dating-network

  grafana:
    image: grafana/grafana:latest
    container_name: dating-platform-grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
      GF_USERS_ALLOW_SIGN_UP: "false"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    ports:
      - "3003:3000"
    depends_on:
      - prometheus
    networks:
      - dating-network

  node-exporter:
    image: prom/node-exporter:latest
    container_name: dating-platform-node-exporter
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - dating-network

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: dating-platform-cadvisor
    restart: unless-stopped
    privileged: true
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    networks:
      - dating-network

volumes:
  prometheus_data:
  grafana_data:
```

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'dating-api'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'

  - job_name: 'dating-ai'
    static_configs:
      - targets: ['ai-services:3002']
    metrics_path: '/metrics'
```

### Health Check Endpoints

| Endpoint | Service | Expected Response |
|----------|---------|-------------------|
| `GET /health` | Backend | `{"status": "ok"}` |
| `GET /health` | AI Services | `{"status": "ok"}` |
| `GET /api/tags` | Ollama | List of models |
| `GET /minio/health/live` | MinIO | `{"status": "ok"}` |

### Alerting Rules

Create `monitoring/alerts.yml`:

```yaml
groups:
  - name: dating-platform-alerts
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"

      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space is critically low"

      - alert: APIHighLatency
        expr: http_request_duration_seconds{quantile="0.95"} > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API response time is high"
```

---

## Troubleshooting Common Issues

### Container Won't Start

#### Check Container Status

```bash
docker compose ps
docker compose logs <service-name>
```

#### Common Causes

1. **Port Already in Use**
   ```bash
   # Find process using port
   netstat -tulpn | grep :3000
   # or on Windows
   netstat -ano | findstr :3000

   # Kill process or change port in .env
   ```

2. **Insufficient Memory**
   ```bash
   # Check Docker memory
   docker system info | grep -i memory

   # Check container memory usage
   docker stats --no-stream
   ```

3. **Permission Issues**
   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER ./data
   chmod -R 755 ./data
   ```

### Database Connection Failed

#### Symptoms
- Backend fails health check
- Logs show "connection refused" to postgres

#### Solutions

```bash
# 1. Check if PostgreSQL is running
docker compose ps postgres
docker compose logs postgres

# 2. Test database connection
docker exec -it dating-platform-db psql -U postgres -d dating_platform -c "SELECT 1"

# 3. Check network connectivity
docker exec dating-platform-api ping postgres

# 4. Verify environment variables
docker exec dating-platform-api env | grep DATABASE

# 5. Restart database with fresh volume (CAUTION: destroys data)
docker compose down -v
docker compose up -d postgres
# Wait for healthy status
docker compose logs -f postgres
```

### Redis Connection Failed

```bash
# Test Redis connection
docker exec -it dating-platform-redis redis-cli -a "$REDIS_PASSWORD" ping

# Check Redis logs
docker compose logs redis

# Verify Redis password
docker exec dating-platform-api env | grep REDIS
```

### Ollama GPU Issues

#### NVIDIA GPU Not Detected

```bash
# Verify NVIDIA driver
nvidia-smi

# Check Docker NVIDIA runtime
docker info | grep -i nvidia

# Test GPU in Docker
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

#### Insufficient VRAM

```bash
# Check GPU memory usage
nvidia-smi

# Reduce model size or adjust OLLAMA_GPU_MEMORY
# In .env:
OLLAMA_GPU_MEMORY=3072  # 3GB for 4GB card
```

### Health Check Failures

```bash
# Check health endpoint manually
curl -v http://localhost:3000/health

# View health check logs
docker inspect dating-platform-api --format='{{json .State.Health}}'

# Check backend logs for errors
docker compose logs --tail=50 backend
```

### Network Issues

#### Container DNS Resolution

```bash
# Test DNS from container
docker exec dating-platform-api nslookup postgres

# Check network
docker network ls
docker network inspect dating-network
```

#### Cross-Container Communication

```bash
# Test connectivity
docker exec dating-platform-api curl http://redis:6379
docker exec dating-platform-api curl http://postgres:5432
```

### Performance Issues

#### High Memory Usage

```bash
# Check container memory
docker stats

# Identify memory-heavy containers
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"

# Restart container to free memory
docker compose restart <service>
```

#### Slow Database Queries

```bash
# Check active queries
docker exec -it dating-platform-db psql -U postgres -d dating_platform \
  -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query
      FROM pg_stat_activity
      WHERE state = 'active'
      ORDER BY duration DESC;"

# Check table sizes
docker exec -it dating-platform-db psql -U postgres -d dating_platform \
  -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename))
      FROM pg_tables ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC LIMIT 10;"
```

### Complete Reset

When all else fails:

```bash
# Stop all containers
docker compose down

# Remove all containers, networks, and volumes (DESTROYS ALL DATA)
docker compose down -v --remove-orphans

# Remove all images
docker compose down --rmi all

# Clean Docker system
docker system prune -a

# Start fresh
docker compose up -d --build
```

### Getting Help

1. Check logs: `docker compose logs -f <service>`
2. Review health: `docker compose ps`
3. Inspect container: `docker inspect <container-name>`
4. Check resources: `docker stats`
5. Review environment: `docker exec <container> env`

For additional support, refer to:
- [DEPLOYMENT.md](../DEPLOYMENT.md) - General deployment guide
- [DATABASE-SETUP.md](../DATABASE-SETUP.md) - Database configuration
- [SECURITY.md](../SECURITY.md) - Security guidelines
