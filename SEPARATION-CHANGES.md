# Platform Separation - Non-Charity DAO Migration

## Overview
This document tracks the separation of the dating platform from the charity platform, converting it to a non-charity DAO structure.

## Status: IN PROGRESS

## Key Changes Made

### 1. Revenue Service
- ✅ Created `backend/services/dao-revenue.js` - Standard DAO revenue management
- ✅ Created `C:\AiCollabForTheKids\api\services\dao-revenue.js` - API directory version
- ⚠️ Need to update all imports from `gospel-revenue.js` to `dao-revenue.js`

### 2. Server Files
- ✅ Updated `backend/server.js` - Removed gospel split verification
- ✅ Updated `C:\AiCollabForTheKids\api\server.js` - Removed gospel references
- ✅ Changed `/api/gospel` endpoint to `/api/revenue`
- ✅ Updated server messages to remove charity references

### 3. Payment Processing
- ✅ Updated `backend/services/squarePreorder.js` - Production mode by default
- ✅ Changed environment check to use `SQUARE_ENVIRONMENT` (defaults to production)
- ✅ Removed charity references from payment notes

## Changes Still Needed

### High Priority
1. **Update all route files** that import `gospel-revenue.js`:
   - `backend/routes/square-subscriptions.js`
   - `backend/routes/merch.js`
   - `backend/routes/dating.js`
   - `backend/routes/dao-webhooks.js`
   - `C:\AiCollabForTheKids\api\routes\*` (multiple files)

2. **Update payment services** to use production mode:
   - `backend/routes/square-subscriptions.js`
   - `backend/routes/kickstarter.js`
   - `C:\AiCollabForTheKids\api\routes\square-subscriptions.js`
   - Any other files with `Environment.Sandbox`

3. **Database Schema**:
   - Review and remove charity-related models if needed
   - Keep dating app models
   - Update any charity references in schema

4. **Environment Variables**:
   - Set `SQUARE_ENVIRONMENT=production` (or remove to default to production)
   - Remove any charity-related env vars
   - Update `.env` files

### Medium Priority
5. **Remove charity references** from:
   - Email templates
   - Frontend files
   - Documentation
   - Error messages
   - Log messages

6. **Update documentation**:
   - README.md
   - Deployment guides
   - API documentation

### Launch Configuration
- ✅ Valentine's Day 2026 launch date already set in code
- ✅ Preorder system in place
- ✅ Production mode enabled

## Environment Configuration

Add to `.env` files:
```bash
# Payment Processing - PRODUCTION MODE
SQUARE_ENVIRONMENT=production
# Or omit to default to production

# Remove charity-related variables
# Remove: GOSPEL_CHARITY_WALLET
# Remove: Any charity allocation variables
```

## Testing Checklist
- [ ] All routes work without gospel-revenue imports
- [ ] Payment processing uses production Square
- [ ] No charity references in API responses
- [ ] Preorder system functional
- [ ] Database migrations work
- [ ] Webhooks configured for production

## Notes
- Valentine's Day 2026 launch date is already configured
- Preorder system is functional
- This is a large refactoring - many files need updates
- Consider creating a migration script for database changes
