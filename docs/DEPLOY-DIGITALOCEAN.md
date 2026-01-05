# DigitalOcean Deployment Guide

Complete guide for deploying the dating platform on DigitalOcean.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Droplet Setup](#droplet-setup)
4. [Managed Database Setup](#managed-database-setup)
5. [Managed Redis Setup](#managed-redis-setup)
6. [Spaces Object Storage](#spaces-object-storage)
7. [Load Balancer Configuration](#load-balancer-configuration)
8. [Domain and SSL Setup](#domain-and-ssl-setup)
9. [App Platform Deployment (Alternative)](#app-platform-deployment-alternative)
10. [Kubernetes Deployment (Advanced)](#kubernetes-deployment-advanced)
11. [Monitoring and Alerts](#monitoring-and-alerts)
12. [Backup and Recovery](#backup-and-recovery)
13. [Cost Estimation](#cost-estimation)

---

## Architecture Overview

```
                         ┌─────────────────────┐
                         │   DigitalOcean      │
                         │   DNS / Cloudflare  │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │    Load Balancer    │
                         │    (SSL Termination)│
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
             ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
             │  Droplet 1  │ │  Droplet 2  │ │  Droplet 3  │
             │  (App)      │ │  (App)      │ │  (App)      │
             └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │                               │
             ┌──────▼──────┐                 ┌──────▼──────┐
             │  Managed    │                 │  Managed    │
             │  PostgreSQL │                 │  Redis      │
             └─────────────┘                 └─────────────┘

                              ┌─────────────┐
                              │   Spaces    │
                              │  (Storage)  │
                              └─────────────┘
```

---

## Prerequisites

### Create DigitalOcean Account

1. Go to [digitalocean.com](https://www.digitalocean.com)
2. Sign up and verify your account
3. Add payment method

### Install doctl CLI

```bash
# macOS
brew install doctl

# Linux
wget https://github.com/digitalocean/doctl/releases/download/v1.100.0/doctl-1.100.0-linux-amd64.tar.gz
tar xf doctl-1.100.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# Windows
scoop install doctl
```

### Authenticate CLI

```bash
# Generate API token at: https://cloud.digitalocean.com/account/api/tokens
doctl auth init
# Enter your API token when prompted
```

### Generate SSH Key

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/digitalocean

# Add to DigitalOcean
doctl compute ssh-key create dating-platform --public-key-file ~/.ssh/digitalocean.pub
```

---

## Droplet Setup

### Create Droplet via CLI

```bash
# List available images
doctl compute image list --public | grep ubuntu

# List available sizes
doctl compute size list

# Create droplet
doctl compute droplet create dating-platform-app-1 \
  --image ubuntu-24-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc1 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
  --tag-name dating-platform \
  --enable-monitoring \
  --enable-private-networking \
  --wait
```

### Create Multiple Droplets (for HA)

```bash
# Create 3 droplets for high availability
for i in 1 2 3; do
  doctl compute droplet create dating-platform-app-$i \
    --image ubuntu-24-04-x64 \
    --size s-2vcpu-4gb \
    --region nyc1 \
    --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
    --tag-name dating-platform \
    --enable-monitoring \
    --enable-private-networking \
    --wait
done
```

### Create via Dashboard

1. Go to **Create** > **Droplets**
2. Choose Ubuntu 24.04 LTS
3. Select plan: Basic > Regular > $24/mo (2 vCPU, 4GB RAM)
4. Choose datacenter: NYC1 (or closest to users)
5. Select VPC network
6. Add SSH key
7. Enable monitoring
8. Create Droplet

### Server Setup Script

SSH into your droplet and run:

```bash
#!/bin/bash
# server-setup.sh

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx ufw

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Docker (optional)
curl -fsSL https://get.docker.com | bash
usermod -aG docker $USER

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create application user
useradd -m -s /bin/bash dating-app
usermod -aG docker dating-app

# Create application directory
mkdir -p /var/www/dating-platform
chown dating-app:dating-app /var/www/dating-platform
```

### Deploy Application

```bash
# Switch to app user
su - dating-app

# Clone repository
cd /var/www/dating-platform
git clone https://github.com/yourusername/dating-platform.git .

# Install dependencies
npm ci

# Build application
npm run build

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@db-host:5432/dating_platform
REDIS_URL=rediss://user:pass@redis-host:6379
JWT_SECRET=your-super-secret-jwt-key
DO_SPACES_KEY=your-spaces-key
DO_SPACES_SECRET=your-spaces-secret
DO_SPACES_BUCKET=your-bucket-name
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
EOF

# Run database migrations
npm run db:migrate

# Start with PM2
pm2 start dist/main.js --name dating-api -i max
pm2 save
pm2 startup
```

### Configure Nginx

Create `/etc/nginx/sites-available/dating-platform`:

```nginx
upstream dating_api {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL configuration (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml;

    # API proxy
    location / {
        proxy_pass http://dating_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://dating_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://dating_api/health;
        access_log off;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/dating-platform /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Managed Database Setup

### Create PostgreSQL Cluster

```bash
# Create database cluster
doctl databases create dating-platform-db \
  --engine pg \
  --version 15 \
  --size db-s-2vcpu-4gb \
  --region nyc1 \
  --num-nodes 2 \
  --wait

# Get cluster ID
DB_CLUSTER_ID=$(doctl databases list --format ID --no-header)

# Create database
doctl databases db create $DB_CLUSTER_ID dating_platform

# Create user
doctl databases user create $DB_CLUSTER_ID dating_app

# Get connection info
doctl databases connection $DB_CLUSTER_ID --format Host,Port,User,Password,Database
```

### Database Security

Restrict access to your droplets only:

```bash
# Add trusted source (your droplet IPs or VPC)
doctl databases firewalls append $DB_CLUSTER_ID \
  --rule droplet:<droplet-id>

# Or allow from VPC
doctl databases firewalls append $DB_CLUSTER_ID \
  --rule ip_addr:<vpc-ip-range>
```

### Connection String

```bash
# Get connection string
doctl databases connection $DB_CLUSTER_ID --format URI

# Format: postgresql://user:password@host:port/database?sslmode=require
```

### Database Configuration

In your `.env`:

```bash
DATABASE_URL=postgresql://dating_app:PASSWORD@db-xxx.db.ondigitalocean.com:25060/dating_platform?sslmode=require
```

### Connection Pooling

Enable connection pooling for better performance:

1. Go to database dashboard
2. Click "Connection Pools"
3. Create pool:
   - Name: `dating-pool`
   - Database: `dating_platform`
   - Mode: `transaction`
   - Size: `25`

Use pool connection string:

```bash
DATABASE_URL=postgresql://dating_app:PASSWORD@db-xxx.db.ondigitalocean.com:25061/dating-pool?sslmode=require
```

---

## Managed Redis Setup

### Create Redis Cluster

```bash
# Create Redis cluster
doctl databases create dating-platform-redis \
  --engine redis \
  --version 7 \
  --size db-s-1vcpu-1gb \
  --region nyc1 \
  --num-nodes 1 \
  --wait

# Get cluster ID
REDIS_CLUSTER_ID=$(doctl databases list --format ID --no-header | tail -1)

# Get connection info
doctl databases connection $REDIS_CLUSTER_ID
```

### Redis Security

```bash
# Restrict access
doctl databases firewalls append $REDIS_CLUSTER_ID \
  --rule droplet:<droplet-id>
```

### Redis Connection

```bash
# Get connection details
doctl databases connection $REDIS_CLUSTER_ID --format URI

# Format: rediss://default:password@redis-xxx.db.ondigitalocean.com:25061
```

In your `.env`:

```bash
REDIS_URL=rediss://default:PASSWORD@redis-xxx.db.ondigitalocean.com:25061
```

---

## Spaces Object Storage

### Create Spaces Bucket

```bash
# Create bucket
doctl spaces create dating-platform-media --region nyc3

# List buckets
doctl spaces list
```

### Generate Access Keys

1. Go to **API** > **Spaces Keys**
2. Generate new key
3. Save Access Key and Secret Key

### Configure Application

```bash
# Environment variables
DO_SPACES_KEY=your-access-key
DO_SPACES_SECRET=your-secret-key
DO_SPACES_BUCKET=dating-platform-media
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

### Storage Service Implementation

```typescript
// src/services/storage.service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.DO_SPACES_REGION,
  endpoint: process.env.DO_SPACES_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

export class StorageService {
  private bucket = process.env.DO_SPACES_BUCKET;

  async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    await s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
    }));

    return `https://${this.bucket}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  async getSignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }
}
```

### Enable CDN

1. Go to Spaces settings
2. Enable CDN
3. Use CDN URL for public assets:
   ```
   https://dating-platform-media.nyc3.cdn.digitaloceanspaces.com/path/to/file
   ```

### CORS Configuration

Create `cors.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply via s3cmd:

```bash
s3cmd setcors cors.json s3://dating-platform-media
```

---

## Load Balancer Configuration

### Create Load Balancer

```bash
# Get droplet IDs
DROPLET_IDS=$(doctl compute droplet list --tag-name dating-platform --format ID --no-header | tr '\n' ',')

# Create load balancer
doctl compute load-balancer create \
  --name dating-platform-lb \
  --region nyc1 \
  --forwarding-rules "entry_protocol:https,entry_port:443,target_protocol:http,target_port:3000,certificate_id:$(doctl compute certificate list --format ID --no-header),tls_passthrough:false" \
  --forwarding-rules "entry_protocol:http,entry_port:80,target_protocol:http,target_port:3000" \
  --health-check "protocol:http,port:3000,path:/health,check_interval_seconds:10,response_timeout_seconds:5,healthy_threshold:5,unhealthy_threshold:3" \
  --droplet-ids $DROPLET_IDS \
  --redirect-http-to-https
```

### Health Check Configuration

The load balancer will check `/health` endpoint. Implement it:

```typescript
// src/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private db: DataSource,
    private redis: Redis,
  ) {}

  @Get()
  async check() {
    const dbHealthy = await this.checkDatabase();
    const redisHealthy = await this.checkRedis();

    if (!dbHealthy || !redisHealthy) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: dbHealthy,
        redis: redisHealthy,
      });
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealthy,
      redis: redisHealthy,
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
}
```

### Sticky Sessions (for WebSockets)

Enable sticky sessions in load balancer:

```bash
doctl compute load-balancer update <lb-id> \
  --sticky-sessions "type:cookies,cookie_name:DO_LB,cookie_ttl_seconds:300"
```

---

## Domain and SSL Setup

### Option 1: DigitalOcean DNS

```bash
# Add domain
doctl compute domain create yourdomain.com

# Create A record pointing to load balancer
doctl compute domain records create yourdomain.com \
  --record-type A \
  --record-name @ \
  --record-data <load-balancer-ip>

# Create CNAME for www
doctl compute domain records create yourdomain.com \
  --record-type CNAME \
  --record-name www \
  --record-data @

# Create A record for API subdomain
doctl compute domain records create yourdomain.com \
  --record-type A \
  --record-name api \
  --record-data <load-balancer-ip>
```

### Option 2: External DNS (Cloudflare, etc.)

Point your domain's A record to the load balancer IP:

```
Type: A
Name: @
Value: <load-balancer-ip>
TTL: Auto

Type: A
Name: api
Value: <load-balancer-ip>
TTL: Auto
```

### SSL Certificate

**Via DigitalOcean (for Load Balancer):**

```bash
# Create certificate (Let's Encrypt)
doctl compute certificate create \
  --name dating-platform-cert \
  --type lets_encrypt \
  --dns-names yourdomain.com,www.yourdomain.com,api.yourdomain.com

# List certificates
doctl compute certificate list

# Update load balancer with certificate
doctl compute load-balancer update <lb-id> \
  --forwarding-rules "entry_protocol:https,entry_port:443,target_protocol:http,target_port:3000,certificate_id:<cert-id>"
```

**Via Certbot (for individual Droplets):**

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d api.yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

---

## App Platform Deployment (Alternative)

DigitalOcean App Platform is a PaaS option for simpler deployments.

### Create App via CLI

```bash
# Create app spec file
cat > app-spec.yaml << 'EOF'
name: dating-platform
region: nyc
services:
  - name: api
    github:
      repo: yourusername/dating-platform
      branch: main
      deploy_on_push: true
    build_command: npm run build
    run_command: npm run start:prod
    environment_slug: node-js
    instance_count: 2
    instance_size_slug: professional-xs
    http_port: 3000
    health_check:
      http_path: /health
      initial_delay_seconds: 20
      period_seconds: 10
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${dating-db.DATABASE_URL}
      - key: REDIS_URL
        scope: RUN_TIME
        value: ${dating-redis.REDIS_URL}
      - key: JWT_SECRET
        scope: RUN_TIME
        type: SECRET

databases:
  - name: dating-db
    engine: PG
    version: "15"
    size: db-s-1vcpu-1gb
    num_nodes: 1

  - name: dating-redis
    engine: REDIS
    version: "7"
    size: db-s-1vcpu-1gb
    num_nodes: 1
EOF

# Create app
doctl apps create --spec app-spec.yaml
```

### Update App

```bash
# Update spec
doctl apps update <app-id> --spec app-spec.yaml

# Trigger deployment
doctl apps create-deployment <app-id>
```

### View Logs

```bash
# Stream logs
doctl apps logs <app-id> --type run --follow

# Build logs
doctl apps logs <app-id> --type build
```

---

## Kubernetes Deployment (Advanced)

For larger deployments, use DigitalOcean Kubernetes (DOKS).

### Create Kubernetes Cluster

```bash
# Create cluster
doctl kubernetes cluster create dating-platform-k8s \
  --region nyc1 \
  --version 1.28.2-do.0 \
  --size s-2vcpu-4gb \
  --count 3 \
  --wait

# Get kubeconfig
doctl kubernetes cluster kubeconfig save dating-platform-k8s
```

### Kubernetes Manifests

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dating-platform-api
  labels:
    app: dating-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dating-platform
  template:
    metadata:
      labels:
        app: dating-platform
    spec:
      containers:
        - name: api
          image: registry.digitalocean.com/your-registry/dating-platform:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: dating-platform-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: dating-platform-secrets
                  key: redis-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: dating-platform-secrets
                  key: jwt-secret
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: dating-platform-service
spec:
  selector:
    app: dating-platform
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: dating-platform-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: dating-platform-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

Create secrets:

```bash
kubectl create secret generic dating-platform-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=redis-url="rediss://..." \
  --from-literal=jwt-secret="your-secret"
```

Deploy:

```bash
kubectl apply -f k8s/deployment.yaml
```

---

## Monitoring and Alerts

### DigitalOcean Monitoring

Enable monitoring on droplets:

```bash
# Install monitoring agent
curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash
```

### Create Alerts

```bash
# CPU alert
doctl monitoring alert create \
  --type "v1/insights/droplet/cpu" \
  --compare "GreaterThan" \
  --value 80 \
  --window "5m" \
  --entities <droplet-id> \
  --emails alerts@yourdomain.com

# Memory alert
doctl monitoring alert create \
  --type "v1/insights/droplet/memory_utilization_percent" \
  --compare "GreaterThan" \
  --value 90 \
  --window "5m" \
  --entities <droplet-id> \
  --emails alerts@yourdomain.com

# Database alert
doctl monitoring alert create \
  --type "v1/dbaas/alerts" \
  --compare "GreaterThan" \
  --value 80 \
  --window "5m" \
  --entities <db-cluster-id> \
  --emails alerts@yourdomain.com
```

### External Monitoring

**Uptime Checks (free with DigitalOcean):**

1. Go to **Monitoring** > **Uptime**
2. Create new check for `https://api.yourdomain.com/health`
3. Set check interval to 1 minute
4. Configure alerts

**Application Performance Monitoring:**

Install Datadog or New Relic:

```bash
# Datadog
DD_API_KEY=<your-api-key> DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script_agent7.sh)"

# New Relic
npm install newrelic
```

---

## Backup and Recovery

### Database Backups

DigitalOcean Managed Databases include automatic daily backups with 7-day retention.

**Manual Backup:**

```bash
# Get connection string
CONNECTION_STRING=$(doctl databases connection $DB_CLUSTER_ID --format URI --no-header)

# Create backup
pg_dump $CONNECTION_STRING > backup-$(date +%Y%m%d).sql

# Upload to Spaces
s3cmd put backup-*.sql s3://dating-platform-backups/
```

**Restore from Backup:**

```bash
# Download backup
s3cmd get s3://dating-platform-backups/backup-20240101.sql

# Restore
psql $CONNECTION_STRING < backup-20240101.sql
```

### Droplet Backups

Enable weekly backups:

```bash
doctl compute droplet-action enable-backups <droplet-id>
```

**Create Snapshot:**

```bash
doctl compute droplet-action snapshot <droplet-id> --snapshot-name "pre-deploy-$(date +%Y%m%d)"
```

### Automated Backup Script

Create `/opt/scripts/backup.sh`:

```bash
#!/bin/bash
set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/backups"
SPACES_BUCKET="s3://dating-platform-backups"

mkdir -p $BACKUP_DIR

# Database backup
echo "Backing up database..."
pg_dump $DATABASE_URL > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# Upload to Spaces
echo "Uploading to Spaces..."
s3cmd put $BACKUP_DIR/db_$DATE.sql.gz $SPACES_BUCKET/database/

# Cleanup local files
rm -rf $BACKUP_DIR

# Cleanup old backups (keep 30 days)
s3cmd ls $SPACES_BUCKET/database/ | while read -r line; do
  createDate=$(echo $line | awk '{print $1" "$2}')
  createDate=$(date -d "$createDate" +%s)
  olderThan=$(date -d "30 days ago" +%s)
  if [[ $createDate -lt $olderThan ]]; then
    fileName=$(echo $line | awk '{print $4}')
    if [[ $fileName != "" ]]; then
      s3cmd del $fileName
    fi
  fi
done

echo "Backup completed successfully"
```

Add to crontab:

```bash
# Run daily at 2 AM
0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

---

## Cost Estimation

### Resource Pricing (as of 2024)

| Resource | Size | Monthly Cost |
|----------|------|-------------|
| Droplet | s-2vcpu-4gb | $24 |
| Droplet | s-4vcpu-8gb | $48 |
| Managed PostgreSQL | db-s-2vcpu-4gb (2 nodes) | $60 |
| Managed Redis | db-s-1vcpu-1gb | $15 |
| Load Balancer | Small | $12 |
| Spaces | 250GB + 1TB transfer | $5 |
| Bandwidth | 1TB (included) | $0 |

### Deployment Scenarios

**Small (Startup):**
- 1x Droplet (s-2vcpu-4gb): $24
- 1x PostgreSQL (db-s-1vcpu-1gb): $15
- 1x Redis (db-s-1vcpu-1gb): $15
- Spaces (basic): $5
- **Total: ~$59/month**

**Medium (Growing):**
- 2x Droplets (s-2vcpu-4gb): $48
- 1x PostgreSQL (db-s-2vcpu-4gb, 2 nodes): $60
- 1x Redis (db-s-1vcpu-1gb): $15
- Load Balancer: $12
- Spaces + CDN: $10
- **Total: ~$145/month**

**Large (Production):**
- 3x Droplets (s-4vcpu-8gb): $144
- 1x PostgreSQL (db-s-4vcpu-8gb, 3 nodes): $180
- 1x Redis (db-s-2vcpu-4gb): $60
- Load Balancer: $12
- Spaces + CDN: $20
- **Total: ~$416/month**

---

## CI/CD with GitHub Actions

Create `.github/workflows/deploy-digitalocean.yml`:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

env:
  REGISTRY: registry.digitalocean.com
  IMAGE_NAME: your-registry/dating-platform

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - name: Build container image
        run: docker build -t $REGISTRY/$IMAGE_NAME:${{ github.sha }} .

      - name: Log in to DO Container Registry
        run: doctl registry login --expiry-seconds 1200

      - name: Push image to DO Container Registry
        run: docker push $REGISTRY/$IMAGE_NAME:${{ github.sha }}

      - name: Deploy to Droplets
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DROPLET_IPS }}
          username: dating-app
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/dating-platform
            git pull origin main
            npm ci
            npm run build
            pm2 restart dating-api
```

---

## Production Checklist

Before going live:

- [ ] Multiple droplets for high availability
- [ ] Load balancer configured with health checks
- [ ] Managed PostgreSQL with standby node
- [ ] Managed Redis configured
- [ ] Spaces bucket created with CDN enabled
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Firewall rules set (UFW)
- [ ] Database firewall restricted
- [ ] Monitoring agents installed
- [ ] Alerts configured
- [ ] Automated backups enabled
- [ ] Environment variables secured
- [ ] Database migrations applied
- [ ] Log rotation configured

---

## Quick Reference Commands

```bash
# Droplets
doctl compute droplet list
doctl compute droplet create <name> --image ubuntu-24-04-x64 --size s-2vcpu-4gb --region nyc1
doctl compute droplet delete <id>

# Databases
doctl databases list
doctl databases connection <id>
doctl databases firewalls list <id>

# Load Balancers
doctl compute load-balancer list
doctl compute load-balancer update <id> --droplet-ids <ids>

# Spaces
doctl spaces list
s3cmd ls s3://bucket-name

# Domains
doctl compute domain list
doctl compute domain records list <domain>

# Certificates
doctl compute certificate list
doctl compute certificate create --name <name> --type lets_encrypt --dns-names <domains>

# Apps
doctl apps list
doctl apps logs <app-id> --type run --follow
```

---

## Support

- [DigitalOcean Documentation](https://docs.digitalocean.com)
- [DigitalOcean Community](https://www.digitalocean.com/community)
- [DigitalOcean Support](https://www.digitalocean.com/support)
