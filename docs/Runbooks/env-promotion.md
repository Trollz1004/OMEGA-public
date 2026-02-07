# Environment Promotion Guide

## FOR THE KIDS Platform - Dev to Staging to Production

**Version**: Gospel V1.4.1 SURVIVAL MODE

---

## Environment Overview

| Environment | Purpose | Network | Approval Required |
|-------------|---------|---------|-------------------|
| Development | Feature development, testing | Base Sepolia | No |
| Staging | Pre-production validation | Base Sepolia | Team Lead |
| Production | Live platform | Base Mainnet | Security + Lead |

---

## Environment Configuration

### Development

```
Network: Base Sepolia (Testnet)
API URL: https://dev-api.forthekids.local
Frontend: https://dev.forthekids.local
Key Vault: forthekids-kv-dev
```

### Staging

```
Network: Base Sepolia (Testnet)
API URL: https://staging-api.forthekids.io
Frontend: https://staging.forthekids.io
Key Vault: forthekids-kv-staging
```

### Production

```
Network: Base Mainnet
API URL: https://api.forthekids.io
Frontend: https://forthekids.io
Key Vault: forthekids-kv-prod
Contract: 0x9855B75061D4c841791382998f0CE8B2BCC965A4
```

---

## Promotion Workflow

```
+-------------+      +-------------+      +-------------+
|    DEV      | ---> |   STAGING   | ---> | PRODUCTION  |
+-------------+      +-------------+      +-------------+
     |                     |                     |
  Feature              Validation            Release
  Complete              Tests                  Live
```

---

## Development to Staging

### Prerequisites

- [ ] All unit tests passing
- [ ] Code review approved
- [ ] Feature branch merged to main
- [ ] No critical security findings

### Promotion Steps

#### Step 1: Prepare Release Branch

```bash
# Create release branch from main
git checkout main
git pull origin main
git checkout -b release/v1.x.x

# Tag the release candidate
git tag -a v1.x.x-rc1 -m "Release candidate 1"
git push origin release/v1.x.x --tags
```

#### Step 2: Deploy to Staging

```bash
# Set environment
export DEPLOY_ENV=staging

# Run deployment
npm run deploy:staging

# This deploys:
# - Smart contracts to Base Sepolia
# - API to staging Function App
# - Frontend to staging Static Web App
```

#### Step 3: Run Staging Tests

```bash
# Full test suite against staging
npm run test:staging

# Includes:
# - Integration tests
# - E2E tests
# - Performance tests
# - Security scan
```

#### Step 4: Validation Checklist

- [ ] All test suites passing
- [ ] Manual smoke test completed
- [ ] Performance within acceptable limits
- [ ] No new security findings
- [ ] Stakeholder demo completed

---

## Staging to Production

### Prerequisites

- [ ] Staging validation complete
- [ ] Security checklist signed off (see [Security-Checklist.md](../Security-Checklist.md))
- [ ] Change request approved
- [ ] Rollback plan documented
- [ ] On-call engineer identified

### Approval Process

1. **Developer** creates promotion request
2. **Team Lead** reviews and approves
3. **Security Lead** reviews security checklist
4. **Final approval** by Platform Lead

### Promotion Steps

#### Step 1: Final Preparations

```bash
# Ensure on release branch
git checkout release/v1.x.x

# Verify staging deployment matches
git log --oneline -5

# Final security scan
npm run security:final-check
```

#### Step 2: Create Production Tag

```bash
# Create production tag
git tag -a v1.x.x -m "Production release v1.x.x"
git push origin v1.x.x
```

#### Step 3: Deploy Smart Contracts

```bash
# Deploy to Base Mainnet
npm run deploy:mainnet

# Verify contracts
npm run verify:mainnet

# Record deployed addresses
# Update docs/contracts.md
```

#### Step 4: Deploy Application

```bash
# Deploy API
npm run deploy:api:production

# Deploy Frontend
npm run deploy:frontend:production

# Verify deployments
npm run verify:production
```

#### Step 5: Post-Deployment Validation

```bash
# Production smoke tests
npm run test:production:smoke

# Monitor for 30 minutes
npm run monitor:production -- --duration 30m
```

#### Step 6: Enable Traffic

```bash
# Gradually shift traffic (if using blue/green)
npm run traffic:shift -- --percent 10
npm run traffic:shift -- --percent 50
npm run traffic:shift -- --percent 100
```

---

## Configuration Management

### Environment Variables by Stage

| Variable | Dev | Staging | Production |
|----------|-----|---------|------------|
| `NODE_ENV` | development | staging | production |
| `LOG_LEVEL` | debug | info | warn |
| `RATE_LIMIT` | 1000/min | 100/min | 60/min |
| `CACHE_TTL` | 0 | 300 | 3600 |

### Secret Management

Each environment has its own Key Vault:

```bash
# Dev secrets
az keyvault secret list --vault-name forthekids-kv-dev

# Staging secrets
az keyvault secret list --vault-name forthekids-kv-staging

# Production secrets
az keyvault secret list --vault-name forthekids-kv-prod
```

**NEVER** copy secrets between environments. Generate unique secrets for each.

---

## Database Migrations

### Migration Strategy

```bash
# 1. Generate migration
npm run migrate:generate -- --name <migration-name>

# 2. Test in dev
npm run migrate:dev

# 3. Test in staging
npm run migrate:staging

# 4. Apply to production (with backup)
npm run migrate:production
```

### Rollback Migrations

```bash
# Rollback last migration
npm run migrate:rollback -- --env production
```

---

## Promotion Checklist

### Dev to Staging

- [ ] Feature complete and tested
- [ ] Code review approved
- [ ] Release branch created
- [ ] Contracts deployed to Sepolia
- [ ] API deployed to staging
- [ ] Frontend deployed to staging
- [ ] Integration tests passing
- [ ] Performance acceptable

### Staging to Production

- [ ] Staging validation complete
- [ ] Security checklist approved
- [ ] Change request approved
- [ ] Rollback plan ready
- [ ] On-call identified
- [ ] Contracts deployed to Mainnet
- [ ] Contracts verified on BaseScan
- [ ] API deployed to production
- [ ] Frontend deployed to production
- [ ] Smoke tests passing
- [ ] Monitoring enabled
- [ ] Team notified

---

## Rollback Procedures

See [rollback.md](./rollback.md) for detailed rollback procedures.

Quick rollback:

```bash
# API rollback
az functionapp deployment slot swap \
  --name forthekids-api \
  --slot production \
  --target-slot staging

# Frontend rollback
npm run deploy:frontend:rollback -- --version v1.x.x-1
```

---

## Emergency Procedures

If critical issues discovered post-promotion:

1. **Assess** severity
2. **Decide** rollback vs hotfix
3. **Execute** chosen action
4. **Communicate** to stakeholders
5. **Document** incident

---

*Promote with confidence, monitor with vigilance.*
