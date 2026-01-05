# Quick Start Guide

**Dating Platform - Developer Setup**

Get the dating platform running locally in minutes.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Running Locally](#running-locally)
6. [First Deployment Checklist](#first-deployment-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| Node.js | 18.0.0+ | [nodejs.org](https://nodejs.org) |
| npm | 9.0.0+ | Included with Node.js |
| PostgreSQL | 14+ | [postgresql.org](https://www.postgresql.org/download/) |
| Git | Latest | [git-scm.com](https://git-scm.com) |

### Optional (Recommended)

| Software | Purpose | Download |
|----------|---------|----------|
| Redis | Caching & sessions | [redis.io](https://redis.io/download) |
| FFmpeg | Video processing (Droid) | [ffmpeg.org](https://ffmpeg.org/download.html) |
| Cloudflare Tunnel | Local development exposure | [cloudflare.com](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) |

### Verify Installation

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
psql --version    # Should show 14.x or higher
git --version     # Any recent version
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/dating-platform.git
cd dating-platform
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Install AI Services (Optional)

If you need the AI services module:

```bash
cd ../ai-services
npm install
```

---

## Environment Setup

### 1. Copy the Example Environment File

```bash
cd backend
cp .env.example .env
```

### 2. Configure Required Variables

Open `.env` in your editor and configure these **required** variables:

#### Database
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/dating_platform
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=dating_platform
```

#### Security
```env
JWT_SECRET=generate_a_random_32_character_string_here
SESSION_SECRET=generate_another_random_32_character_string
```

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Basic Configuration
```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Configure Optional Services

#### Square Payments (Required for subscriptions)
```env
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_LOCATION_ID=your_location_id
SQUARE_WEBHOOK_SECRET=your_webhook_secret
SQUARE_ENVIRONMENT=sandbox  # Use 'sandbox' for development
```

Get Square credentials at: https://developer.squareup.com/apps

#### AI Services (Required for AI Chat)
```env
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=sk-your_openai_key
XAI_API_KEY=xai-your_grok_api_key
```

#### News API (Required for Claude Droid)
```env
NEWS_API_KEY=your_news_api_key
```

Get a free key at: https://newsapi.org

#### YouTube API (Required for video uploads)
```env
YOUTUBE_CLIENT_ID=your_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
YOUTUBE_REFRESH_TOKEN=your_refresh_token
```

---

## Database Setup

### 1. Create the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE dating_platform;

# Exit
\q
```

### 2. Run Migrations

```bash
cd backend
npx prisma migrate dev --name init
```

### 3. Seed Initial Data (Optional)

```bash
npx prisma db seed
```

### 4. View Database

Use Prisma Studio to explore your data:

```bash
npx prisma studio
```

This opens a web interface at http://localhost:5555

---

## Running Locally

### Start the Backend Server

```bash
cd backend
npm run dev
```

The API will be available at: http://localhost:3000

### Verify the Server

```bash
# Check health endpoint
curl http://localhost:3000/api/subscriptions/health

# Expected response:
{
  "status": "MISSION_SHIELD_ACTIVE",
  "dating": "DISABLED",
  "merch": "ACTIVE",
  "stripe": "ACTIVE",
  "forTheKids": true
}
```

### Test API Endpoints

```bash
# Get dating app stats
curl http://localhost:3000/api/dating/stats

# Get subscription plans
curl http://localhost:3000/api/subscriptions/plans

# Get transparency data
curl http://localhost:3000/api/transparency/stats
```

### Running with Cloudflare Tunnel (Optional)

For webhook testing and external access:

```bash
# Install cloudflared
npm install -g cloudflared

# Start tunnel
cloudflared tunnel --url http://localhost:3000
```

This gives you a public URL like `https://random-name.trycloudflare.com`

---

## First Deployment Checklist

Before deploying to production, complete these steps:

### Security Checklist

- [ ] Generate new, strong secrets for `JWT_SECRET` and `SESSION_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up CORS with specific allowed origins
- [ ] Enable rate limiting
- [ ] Configure admin emails in `ADMIN_EMAILS`
- [ ] Set up webhook signature verification

### Environment Variables

- [ ] `DATABASE_URL` points to production PostgreSQL
- [ ] `SQUARE_ENVIRONMENT=production`
- [ ] `SQUARE_ACCESS_TOKEN` is production token (not sandbox)
- [ ] `SQUARE_WEBHOOK_SECRET` is configured
- [ ] All payment processor credentials are production keys
- [ ] `FRONTEND_URL` points to production frontend

### Database

- [ ] Run `npx prisma migrate deploy` (not `migrate dev`)
- [ ] Verify database backups are configured
- [ ] Set up connection pooling (e.g., PgBouncer)

### Payments

- [ ] Square production account is verified
- [ ] Webhook endpoints are registered with Square
- [ ] Test a small payment to verify integration
- [ ] Gospel split (60/30/10) is verified in transaction records

### Compliance

- [ ] Age verification is enabled (`AGE_VERIFICATION_REQUIRED=true`)
- [ ] COPPA mode is active (`COPPA_COMPLIANT_MODE=true`)
- [ ] FOSTA-SESTA compliance is enabled
- [ ] Cookie consent banner is implemented
- [ ] Privacy policy is published

### Monitoring

- [ ] Error logging is configured (Winston)
- [ ] Set up uptime monitoring
- [ ] Configure alerting for critical errors
- [ ] Set up revenue tracking dashboard

### Domains & DNS

- [ ] SSL certificates are valid
- [ ] DNS records point to production servers
- [ ] Cloudflare protection is enabled
- [ ] API subdomain is configured

---

## Project Structure

```
dating-platform/
├── backend/
│   ├── routes/           # API route handlers
│   │   ├── admin.js
│   │   ├── affiliates.js
│   │   ├── age-verification.js
│   │   ├── ai-chat.js
│   │   ├── community.js
│   │   ├── consent.js
│   │   ├── dating.js
│   │   ├── droid.js
│   │   ├── droid-orchestrator.js
│   │   ├── human-verification.js
│   │   ├── kickstarter.js
│   │   ├── merch.js
│   │   ├── payments.js
│   │   ├── square-subscriptions.js
│   │   ├── transparency.js
│   │   └── webhooks.js
│   ├── services/         # Business logic
│   │   ├── auth.js
│   │   ├── gospel-revenue.js
│   │   ├── human-verification.js
│   │   ├── tts.js
│   │   ├── video.js
│   │   └── youtube.js
│   ├── middleware/       # Express middleware
│   ├── prisma/           # Database schema & migrations
│   │   ├── schema.prisma
│   │   └── client.js
│   ├── server.js         # Main entry point
│   ├── package.json
│   └── .env.example
├── ai-services/          # AI microservices
├── docs/                 # Documentation
│   ├── API.md
│   └── QUICK-START.md
└── README.md
```

---

## Available Scripts

```bash
# Development
npm run dev          # Start with hot reload (nodemon)
npm start            # Start production server

# Database
npm run migrate      # Run database migrations
npm run generate     # Generate Prisma client

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

---

## API Documentation

See [API.md](./API.md) for complete API reference including:

- Authentication endpoints
- User profile management
- Matching and messaging
- Payment processing
- Webhook handling
- Admin endpoints

---

## Troubleshooting

### Database Connection Issues

```
Error: P1001: Can't reach database server
```

**Solution:**
1. Ensure PostgreSQL is running: `pg_isready`
2. Verify connection string in `.env`
3. Check if database exists: `psql -U postgres -l`

### Prisma Client Not Generated

```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
npx prisma generate
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev
```

### Square Webhook Verification Failed

```
Error: Invalid webhook signature
```

**Solution:**
1. Verify `SQUARE_WEBHOOK_SECRET` matches Square dashboard
2. Ensure raw body is used for signature verification
3. Check webhook URL is correctly configured in Square

### FFmpeg Not Found (Claude Droid)

```
Error: Cannot find ffmpeg
```

**Solution:**
1. Install FFmpeg: https://ffmpeg.org/download.html
2. Add to PATH
3. Verify: `ffmpeg -version`

### Module Not Found

```
Error: Cannot find module 'xyz'
```

**Solution:**
```bash
rm -rf node_modules
npm install
```

---

## Getting Help

- **API Issues:** Check [API.md](./API.md) for endpoint documentation
- **Bug Reports:** Open an issue on GitHub
- **Security Issues:** Email security@yourplatform.com

---

## Mission Statement

**FOR THE KIDS** - 60% of all revenue goes to Verified Pediatric Charities.

This platform enforces the Gospel V1.3 revenue split:
- 60% to charity
- 30% to infrastructure
- 10% to founder

This split is immutable and built into the payment processing infrastructure.
