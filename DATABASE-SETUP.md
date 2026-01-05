# Dating Platform - Database Setup Guide

Complete guide for setting up and managing the PostgreSQL database for the Dating Platform.

## Table of Contents

1. [Overview](#overview)
2. [PostgreSQL Installation](#postgresql-installation)
3. [Database Creation](#database-creation)
4. [Prisma Setup](#prisma-setup)
5. [Migrations](#migrations)
6. [Seeding](#seeding)
7. [Production Configuration](#production-configuration)
8. [Backup & Recovery](#backup--recovery)
9. [Performance Tuning](#performance-tuning)
10. [Maintenance](#maintenance)

---

## Overview

The Dating Platform uses PostgreSQL as its primary database with Prisma as the ORM. The schema includes tables for:

- **Users & Authentication** - User accounts, sessions, tokens
- **Profiles** - User profiles, photos, prompts
- **Matching** - Likes, matches, swipes
- **Messaging** - Conversations, messages
- **Subscriptions** - Plans, payments, subscriptions
- **Moderation** - Reports, blocks, content flags
- **Analytics** - Activity logs, daily stats

### Schema Location

```
database/prisma/schema.prisma
```

---

## PostgreSQL Installation

### Docker (Recommended)

```bash
docker-compose up -d postgres
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS

```bash
brew install postgresql@15
brew services start postgresql@15
```

### Windows

Download and install from: https://www.postgresql.org/download/windows/

---

## Database Creation

### 1. Create Database and User

```sql
-- Connect as superuser
sudo -u postgres psql

-- Create database
CREATE DATABASE dating_platform;

-- Create user with password
CREATE USER dating_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE dating_platform TO dating_user;

-- Grant schema privileges
\c dating_platform
GRANT ALL ON SCHEMA public TO dating_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dating_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dating_user;

-- Exit
\q
```

### 2. Configure Connection String

Add to `.env`:
```
DATABASE_URL=postgresql://dating_user:your_secure_password@localhost:5432/dating_platform
```

### 3. Test Connection

```bash
psql $DATABASE_URL -c "SELECT version();"
```

---

## Prisma Setup

### Install Prisma

```bash
cd backend
npm install prisma @prisma/client
```

### Generate Client

```bash
npx prisma generate
```

### View Schema

```bash
npx prisma studio
```

This opens a web interface at http://localhost:5555 for browsing your database.

---

## Migrations

### Development Workflow

```bash
# Create migration from schema changes
npx prisma migrate dev --name describe_your_changes

# Apply pending migrations
npx prisma migrate dev

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset
```

### Production Workflow

```bash
# Apply migrations in production
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### Migration Files

Migrations are stored in:
```
database/migrations/
```

### Rollback Strategy

Prisma doesn't support automatic rollbacks. For rollbacks:

1. Create a new migration that undoes changes
2. Or restore from backup

---

## Seeding

### Run Seed Script

```bash
# From backend directory
npx prisma db seed

# Or directly
node ../database/seed.js
```

### Seed Data Includes

- **Admin User**: admin@datingplatform.com / admin123
- **Sample Users**: 50 test users with profiles
- **Subscription Plans**: Basic, Premium, VIP
- **Profile Prompts**: 9 sample prompts
- **Matches & Likes**: Sample relationships
- **Daily Stats**: 30 days of analytics data

### Custom Seeding

Modify `database/seed.js` to add custom data:

```javascript
// Add custom users
const customUser = await prisma.user.create({
  data: {
    email: 'custom@example.com',
    passwordHash: await bcrypt.hash('password', 10),
    // ...
  }
});
```

---

## Production Configuration

### Environment Variables

```bash
# Production database URL
DATABASE_URL=postgresql://user:password@production-host:5432/dating_platform?sslmode=require

# Connection pool settings (via Prisma)
DATABASE_URL=postgresql://user:password@host:5432/db?connection_limit=20&pool_timeout=20
```

### SSL Configuration

For production databases (AWS RDS, etc.):

```
DATABASE_URL=postgresql://user:password@host:5432/dating_platform?sslmode=require
```

### Connection Pooling

Add PgBouncer for high-traffic scenarios:

```bash
# docker-compose.yml
pgbouncer:
  image: edoburu/pgbouncer
  environment:
    DATABASE_URL: postgresql://user:pass@postgres:5432/dating_platform
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 20
```

---

## Backup & Recovery

### Manual Backup

```bash
# Full backup
pg_dump -h localhost -U dating_user -d dating_platform -F c -f backup.dump

# SQL format
pg_dump -h localhost -U dating_user -d dating_platform > backup.sql

# Compressed
pg_dump -h localhost -U dating_user dating_platform | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Automated Backups

Create `/etc/cron.daily/dating-backup`:

```bash
#!/bin/bash
BACKUP_DIR=/var/backups/dating-platform
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${DATE}.sql.gz"

# Create backup
pg_dump -h localhost -U dating_user dating_platform | gzip > ${BACKUP_DIR}/${FILENAME}

# Upload to S3
aws s3 cp ${BACKUP_DIR}/${FILENAME} s3://your-backup-bucket/dating-platform/

# Keep only last 30 days locally
find ${BACKUP_DIR} -name "backup_*.sql.gz" -mtime +30 -delete
```

### Restore

```bash
# From dump file
pg_restore -h localhost -U dating_user -d dating_platform -c backup.dump

# From SQL file
psql -h localhost -U dating_user -d dating_platform < backup.sql

# From compressed
gunzip -c backup.sql.gz | psql -h localhost -U dating_user -d dating_platform
```

### Point-in-Time Recovery

For critical production systems, enable WAL archiving:

```
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
```

---

## Performance Tuning

### PostgreSQL Configuration

Edit `postgresql.conf`:

```
# Memory
shared_buffers = 256MB          # 25% of RAM
effective_cache_size = 768MB    # 75% of RAM
work_mem = 16MB
maintenance_work_mem = 128MB

# Connections
max_connections = 200

# Write Performance
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query Planning
random_page_cost = 1.1          # For SSD
effective_io_concurrency = 200  # For SSD
```

### Indexing

Key indexes are defined in the Prisma schema. Additional indexes for common queries:

```sql
-- User search
CREATE INDEX idx_profiles_location ON profiles(city, state, country);
CREATE INDEX idx_profiles_gender_age ON profiles(gender, date_of_birth);

-- Active matching
CREATE INDEX idx_likes_pending ON likes(to_user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_matches_active ON matches(user1_id, user2_id) WHERE status = 'ACTIVE';

-- Message queries
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = false;
```

### Query Optimization

```sql
-- Analyze tables
ANALYZE profiles;
ANALYZE likes;
ANALYZE matches;

-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

---

## Maintenance

### Regular Tasks

```bash
# Vacuum and analyze (run weekly)
psql -c "VACUUM ANALYZE;" dating_platform

# Reindex (run monthly)
psql -c "REINDEX DATABASE dating_platform;" postgres
```

### Monitoring Queries

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('dating_platform'));

-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'dating_platform';

-- Long running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

### Health Checks

```sql
-- Check for bloat
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Check index usage
SELECT relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## Schema Reference

### Core Tables

| Table | Description | Records (Est.) |
|-------|-------------|----------------|
| users | User accounts | Varies |
| profiles | User profiles | 1:1 with users |
| photos | Profile photos | ~5 per user |
| likes | Like interactions | High volume |
| matches | Matched users | ~10% of likes |
| messages | Chat messages | High volume |
| subscriptions | Active plans | ~20% of users |

### Key Relationships

```
User 1:1 Profile
User 1:N Photos (via Profile)
User N:M Matches (self-referential)
User 1:N Messages (sender)
User 1:1 Subscription
```

---

## Troubleshooting

### Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Test connection
psql -h localhost -U dating_user -d dating_platform -c "SELECT 1;"
```

### Migration Errors

```bash
# Reset migrations (DELETES ALL DATA)
npx prisma migrate reset

# Force generate client
npx prisma generate --force
```

### Performance Issues

```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

---

## Support

For database-related issues:
1. Check PostgreSQL logs
2. Review Prisma migration status
3. Verify connection strings
4. Consult this documentation

For schema modifications, always:
1. Test in development first
2. Create a migration
3. Backup production before deploying
4. Monitor after deployment
