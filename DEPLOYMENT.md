# Dating Platform - Deployment Guide

Complete guide for deploying the Dating Platform in production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [Manual Deployment](#manual-deployment)
6. [Cloud Deployments](#cloud-deployments)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Domain Configuration](#domain-configuration)
9. [Monitoring Setup](#monitoring-setup)
10. [Backup Strategy](#backup-strategy)
11. [Scaling](#scaling)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Docker** 24.x+ and **Docker Compose** 2.x+
- **PostgreSQL** 15.x
- **Redis** 7.x
- **Git**

### Required Accounts
- Square Developer Account (payments)
- AWS/GCP/Azure Account (hosting)
- Domain registrar access
- SSL certificate provider (or use Let's Encrypt)

### Server Requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 50 GB SSD | 100+ GB SSD |
| Bandwidth | 1 TB/month | Unlimited |

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/dating-platform.git
cd dating-platform
```

### 2. Create Environment File

```bash
cp .env.example .env
```

### 3. Configure Essential Variables

Edit `.env` with your production values:

```bash
# Critical settings
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dating_platform
REDIS_URL=redis://:password@host:6379
JWT_SECRET=<generate-32-char-random-string>

# Square payment credentials
SQUARE_ACCESS_TOKEN=<your-production-token>
SQUARE_APPLICATION_ID=<your-app-id>
SQUARE_LOCATION_ID=<your-location-id>
SQUARE_ENVIRONMENT=production
```

### 4. Generate Secrets

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate session secret
openssl rand -hex 32
```

---

## Database Setup

### Option A: Docker PostgreSQL

```bash
docker-compose up -d postgres
```

### Option B: External PostgreSQL

1. Create database:
```sql
CREATE DATABASE dating_platform;
CREATE USER dating_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dating_platform TO dating_user;
```

2. Update `DATABASE_URL` in `.env`

### Run Migrations

```bash
cd backend
npm install
npx prisma migrate deploy
```

### Seed Initial Data (Optional)

```bash
npx prisma db seed
```

See [DATABASE-SETUP.md](./DATABASE-SETUP.md) for detailed database configuration.

---

## Docker Deployment

### Full Stack Deployment

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Service URLs
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Admin Dashboard: http://localhost:3001
- Prisma Studio: http://localhost:5555 (dev only)

### Production Docker Commands

```bash
# Start in production mode
docker-compose -f docker-compose.yml up -d

# Scale backend
docker-compose up -d --scale backend=3

# Update containers
docker-compose pull
docker-compose up -d --force-recreate

# View resource usage
docker stats
```

---

## Manual Deployment

### Backend

```bash
cd backend
npm install --production
npm run build  # if using TypeScript
npm start
```

### Frontend

```bash
cd frontend
# Static files - serve with nginx or similar
```

### Admin Dashboard

```bash
cd admin
npm install
npm run build
# Serve dist/ with nginx
```

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start backend/server.js --name dating-api

# Start with ecosystem file
pm2 start ecosystem.config.js

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

Example `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'dating-api',
    script: './backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
```

---

## Cloud Deployments

### AWS Deployment

#### EC2 Setup
1. Launch Ubuntu 22.04 LTS instance
2. Configure security groups (ports 80, 443, 22)
3. SSH and install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### RDS PostgreSQL
1. Create RDS PostgreSQL instance
2. Configure security group for EC2 access
3. Update DATABASE_URL in .env

#### ElastiCache Redis
1. Create ElastiCache Redis cluster
2. Configure security group
3. Update REDIS_URL in .env

#### S3 for Photos
```bash
# Create bucket
aws s3 mb s3://dating-platform-photos

# Configure CORS
aws s3api put-bucket-cors --bucket dating-platform-photos --cors-configuration file://cors.json
```

### Google Cloud Platform

```bash
# Deploy to Cloud Run
gcloud run deploy dating-api \
  --image gcr.io/project/dating-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### DigitalOcean

```bash
# Create droplet and deploy
doctl compute droplet create dating-platform \
  --image docker-20-04 \
  --size s-2vcpu-4gb \
  --region nyc1
```

---

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (cron)
0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Domain Configuration

### DNS Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | Your-Server-IP | 300 |
| A | www | Your-Server-IP | 300 |
| A | api | Your-Server-IP | 300 |
| A | admin | Your-Server-IP | 300 |
| CNAME | cdn | your-cdn.cloudfront.net | 300 |

### CloudFlare Setup (Recommended)

1. Add site to CloudFlare
2. Update nameservers at registrar
3. Enable SSL/TLS (Full Strict)
4. Configure page rules for caching

---

## Monitoring Setup

### Health Checks

Add to your monitoring:
```
GET /health - API health check
GET /api/health - Detailed health status
```

### Logging

```bash
# View Docker logs
docker-compose logs -f backend

# Centralized logging with Loki
# Add to docker-compose.yml
```

### Metrics (Prometheus)

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'dating-platform'
    static_configs:
      - targets: ['localhost:3000']
```

### Alerting

Configure alerts for:
- Server CPU > 80%
- Memory usage > 85%
- Disk usage > 90%
- API response time > 2s
- Error rate > 1%

---

## Backup Strategy

### Database Backups

```bash
# Manual backup
pg_dump -h localhost -U postgres dating_platform > backup_$(date +%Y%m%d).sql

# Automated daily backup (cron)
0 3 * * * pg_dump -h localhost -U postgres dating_platform | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# S3 backup
0 4 * * * aws s3 cp /backups/db_$(date +\%Y\%m\%d).sql.gz s3://backups/dating-platform/
```

### Photo Backups

```bash
# Sync to backup bucket
aws s3 sync s3://dating-photos s3://dating-photos-backup
```

### Restore

```bash
# Restore database
psql -h localhost -U postgres dating_platform < backup.sql
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale backend containers
docker-compose up -d --scale backend=5
```

### Load Balancing

```nginx
upstream backend {
    least_conn;
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}
```

### Database Scaling

- Read replicas for queries
- Connection pooling with PgBouncer
- Consider managed solutions (RDS, Cloud SQL)

---

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
docker-compose logs backend
docker-compose down -v && docker-compose up -d
```

**Database connection failed:**
```bash
# Check PostgreSQL is running
docker-compose ps postgres
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**Redis connection failed:**
```bash
redis-cli -u $REDIS_URL ping
```

**Permission issues:**
```bash
sudo chown -R $USER:$USER .
chmod -R 755 .
```

### Support

For deployment assistance, please refer to your support agreement or open an issue in the repository.

---

## Security Checklist

Before going live:

- [ ] All secrets are in environment variables
- [ ] SSL/TLS is properly configured
- [ ] Database is not publicly accessible
- [ ] Redis requires authentication
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Security headers are set
- [ ] Backups are configured and tested
- [ ] Monitoring is set up
- [ ] Age verification is enabled
- [ ] Content moderation is active

See [SECURITY.md](./SECURITY.md) for complete security guidelines.
