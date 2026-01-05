# Railway.app Deployment Guide

Simple and fast deployment guide for the dating platform on Railway.app.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [One-Click Deploy](#one-click-deploy)
4. [Manual Setup](#manual-setup)
5. [Database Provisioning](#database-provisioning)
6. [Redis Setup](#redis-setup)
7. [Environment Variables](#environment-variables)
8. [Custom Domain Setup](#custom-domain-setup)
9. [File Storage](#file-storage)
10. [Scaling](#scaling)
11. [Monitoring](#monitoring)
12. [CI/CD Integration](#cicd-integration)
13. [Cost Estimation](#cost-estimation)

---

## Overview

Railway.app provides a simple, developer-friendly platform for deploying applications. It offers:

- Automatic deployments from GitHub
- Built-in PostgreSQL and Redis
- Easy environment variable management
- Custom domain support with automatic SSL
- Reasonable pricing for startups

**Best for:** Small to medium deployments, rapid prototyping, teams wanting minimal DevOps overhead.

---

## Prerequisites

### Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended) or email
3. Verify your account

### Install Railway CLI

```bash
# macOS
brew install railway

# npm (cross-platform)
npm install -g @railway/cli

# Windows (Scoop)
scoop install railway
```

### Authenticate CLI

```bash
railway login
```

---

## One-Click Deploy

### Deploy Button

Add this button to your README for one-click deployment:

```markdown
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/dating-platform?referralCode=YOUR_CODE)
```

### Create Railway Template

Create `railway.toml` in your project root:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[[services]]
name = "api"
```

Create `railway.json` for template configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

---

## Manual Setup

### Step 1: Create New Project

```bash
# Create a new Railway project
railway init

# Link to existing project
railway link
```

Or via the dashboard:

1. Go to [railway.app/new](https://railway.app/new)
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the framework

### Step 2: Configure Build Settings

Railway auto-detects most configurations. For custom builds, create `nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["nodejs-20_x", "npm"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start:prod"
```

### Step 3: Deploy

```bash
# Deploy from CLI
railway up

# Or push to GitHub for automatic deployment
git push origin main
```

---

## Database Provisioning

### Add PostgreSQL

**Via CLI:**

```bash
# Add PostgreSQL to your project
railway add --database postgres
```

**Via Dashboard:**

1. Open your project on Railway
2. Click "New" > "Database"
3. Select "PostgreSQL"
4. Click "Deploy"

### Database Configuration

Railway automatically provides the `DATABASE_URL` environment variable. Access database credentials:

```bash
# View all variables
railway variables

# Get specific variable
railway variables get DATABASE_URL
```

### Connect to Database

```bash
# Direct connection via CLI
railway connect postgres

# Or use the connection string
psql $DATABASE_URL
```

### Run Migrations

```bash
# Run migrations through Railway
railway run npm run db:migrate

# Or set up as a deploy command
# In railway.toml:
[deploy]
startCommand = "npm run db:migrate && npm run start:prod"
```

### Database Backups

Railway automatically backs up PostgreSQL databases. To create a manual backup:

```bash
# Export database
railway run pg_dump $DATABASE_URL > backup.sql

# Import database
railway run psql $DATABASE_URL < backup.sql
```

---

## Redis Setup

### Add Redis

**Via CLI:**

```bash
railway add --database redis
```

**Via Dashboard:**

1. Click "New" > "Database"
2. Select "Redis"
3. Click "Deploy"

### Redis Configuration

Railway provides `REDIS_URL` automatically. Use it in your application:

```typescript
// src/config/redis.ts
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

export default redisClient;
```

### Redis CLI Access

```bash
# Connect to Redis
railway connect redis

# Or use redis-cli
redis-cli -u $REDIS_URL
```

---

## Environment Variables

### Set Variables via CLI

```bash
# Set individual variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-super-secret-key
railway variables set JWT_EXPIRES_IN=7d
railway variables set CORS_ORIGIN=https://yourdomain.com

# Set multiple at once from .env file
railway variables set < .env.production
```

### Set Variables via Dashboard

1. Go to your project
2. Click on your service
3. Go to "Variables" tab
4. Add key-value pairs

### Required Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3000

# Database (auto-provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-provided by Railway)
REDIS_URL=${{Redis.REDIS_URL}}

# Authentication
JWT_SECRET=your-very-secure-jwt-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# File Storage (Cloudinary example)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# External Services
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Variable References

Reference other service variables:

```bash
# Reference PostgreSQL URL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Reference Redis URL
REDIS_URL=${{Redis.REDIS_URL}}

# Reference another service
API_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}
```

### Secrets Management

For sensitive values, use Railway's secret variables:

```bash
# Mark as secret (hidden in logs)
railway variables set JWT_SECRET=xxx --secret
```

---

## Custom Domain Setup

### Add Custom Domain

**Via CLI:**

```bash
railway domain
```

**Via Dashboard:**

1. Go to your service
2. Click "Settings" > "Networking"
3. Click "Generate Domain" for a free `*.railway.app` subdomain
4. Or click "Custom Domain" to add your own

### Configure DNS

Add these DNS records at your domain registrar:

**For root domain (example.com):**
```
Type: CNAME
Name: @
Value: <your-app>.railway.app
```

**For subdomain (api.example.com):**
```
Type: CNAME
Name: api
Value: <your-app>.railway.app
```

### SSL Certificates

Railway automatically provisions SSL certificates via Let's Encrypt. No configuration needed.

### Multiple Domains

You can add multiple domains to a single service:

1. `api.yourdomain.com` - API endpoints
2. `app.yourdomain.com` - Frontend (if separate)

---

## File Storage

Railway doesn't provide persistent file storage. Use external services:

### Option 1: Cloudinary (Recommended)

```bash
# Install SDK
npm install cloudinary

# Set environment variables
railway variables set CLOUDINARY_CLOUD_NAME=xxx
railway variables set CLOUDINARY_API_KEY=xxx
railway variables set CLOUDINARY_API_SECRET=xxx
```

```typescript
// src/services/storage.service.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    ).end(file);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
```

### Option 2: AWS S3

```bash
# Install SDK
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Set environment variables
railway variables set AWS_ACCESS_KEY_ID=xxx
railway variables set AWS_SECRET_ACCESS_KEY=xxx
railway variables set AWS_S3_BUCKET=xxx
railway variables set AWS_REGION=us-east-1
```

```typescript
// src/services/s3.service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));

  return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
}
```

### Option 3: Uploadthing

```bash
npm install uploadthing

railway variables set UPLOADTHING_SECRET=xxx
railway variables set UPLOADTHING_APP_ID=xxx
```

---

## Scaling

### Horizontal Scaling (Multiple Replicas)

```bash
# Via CLI
railway service update --replicas 3

# Or in railway.json
{
  "deploy": {
    "numReplicas": 3
  }
}
```

### Vertical Scaling (More Resources)

Railway auto-scales resources, but you can set limits in the dashboard:

1. Go to service settings
2. Adjust "Memory" and "CPU" limits
3. Recommended minimums:
   - Memory: 512MB
   - CPU: 0.5 vCPU

### Resource Configuration

```json
// railway.json
{
  "deploy": {
    "numReplicas": 2,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Database Scaling

For high-traffic applications, consider:

1. **PostgreSQL High Availability** - Enable in database settings
2. **Read Replicas** - Contact Railway support for setup
3. **Connection Pooling** - Use PgBouncer

```bash
# Add connection pooler
railway add pgbouncer
```

---

## Monitoring

### Built-in Metrics

Railway provides basic metrics in the dashboard:

- CPU usage
- Memory usage
- Network traffic
- Request count

### Viewing Logs

```bash
# Stream logs
railway logs

# View specific service logs
railway logs --service api

# Filter logs
railway logs | grep ERROR
```

### Health Checks

Configure health checks in `railway.toml`:

```toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
```

Implement the health endpoint:

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

### External Monitoring

For production, integrate with:

**Sentry (Error Tracking):**

```bash
npm install @sentry/node
railway variables set SENTRY_DSN=xxx
```

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Datadog (APM):**

```bash
npm install dd-trace
railway variables set DD_API_KEY=xxx
```

---

## CI/CD Integration

### Automatic Deployments

Railway automatically deploys on push to your connected branch.

### GitHub Actions Integration

For more control, use GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linting
        run: npm run lint

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway
        run: railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Generate Railway Token

```bash
# Create a project token
railway tokens create

# Or via dashboard: Project Settings > Tokens
```

### Preview Environments

Railway supports preview environments for PRs:

1. Go to Project Settings
2. Enable "PR Environments"
3. Each PR gets a unique deployment URL

---

## Cost Estimation

### Railway Pricing

Railway uses usage-based pricing:

| Resource | Price |
|----------|-------|
| Compute | $0.000463/GB-minute |
| Memory | $0.000231/GB-minute |
| Networking | $0.10/GB (egress) |
| PostgreSQL | Included in compute |
| Redis | Included in compute |

### Estimated Monthly Costs

**Small Application (1 replica):**
- Compute: ~$5-10/month
- Database: ~$5-10/month
- Redis: ~$3-5/month
- **Total: ~$13-25/month**

**Medium Application (2-3 replicas):**
- Compute: ~$20-40/month
- Database: ~$15-25/month
- Redis: ~$5-10/month
- **Total: ~$40-75/month**

### Free Tier

Railway offers a $5/month free tier for hobby projects:
- 500 hours of compute
- Suitable for testing and small projects

### Cost Optimization

1. **Enable sleep mode** for non-production environments
2. **Optimize Docker images** to reduce build times
3. **Use connection pooling** to reduce database connections
4. **Cache aggressively** to reduce compute usage

---

## Troubleshooting

### Common Issues

**Build Failures:**

```bash
# View build logs
railway logs --build

# Check Nixpacks detection
railway nixpacks --info
```

**Database Connection Issues:**

```bash
# Verify DATABASE_URL is set
railway variables get DATABASE_URL

# Test connection
railway run node -e "console.log(process.env.DATABASE_URL)"
```

**Memory Issues:**

```bash
# Check memory usage
railway metrics

# Increase memory limit in dashboard
```

**Application Won't Start:**

```bash
# Check start command
railway run npm run start:prod

# Verify all environment variables
railway variables
```

### Debugging

```bash
# Open shell in running service
railway shell

# Run commands in Railway environment
railway run npm run debug
```

### Getting Help

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

---

## Production Checklist

Before going live:

- [ ] PostgreSQL database provisioned
- [ ] Redis provisioned
- [ ] All environment variables set
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Health check endpoint working
- [ ] File storage configured (Cloudinary/S3)
- [ ] Error tracking set up (Sentry)
- [ ] Database migrations applied
- [ ] Multiple replicas for high availability
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place

---

## Quick Reference Commands

```bash
# Login
railway login

# Initialize project
railway init

# Link to existing project
railway link

# Deploy
railway up

# View logs
railway logs

# Open shell
railway shell

# Set variables
railway variables set KEY=value

# Add database
railway add --database postgres

# Run migrations
railway run npm run db:migrate

# Get public URL
railway domain

# View project in browser
railway open
```
