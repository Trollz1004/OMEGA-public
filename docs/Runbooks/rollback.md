# Rollback Procedures

## FOR THE KIDS Platform - Emergency Rollback Guide

**Version**: Gospel V1.4.1 SURVIVAL MODE
**Priority**: Critical Operations Document

---

## Rollback Decision Matrix

| Severity | Symptoms | Action |
|----------|----------|--------|
| Critical | Funds at risk, contract exploit | Immediate pause + full rollback |
| High | Transactions failing, incorrect splits | Pause + investigate + partial rollback |
| Medium | Performance degradation | Monitor + scheduled rollback |
| Low | UI issues, minor bugs | Hotfix preferred over rollback |

---

## Component Rollback Procedures

### 1. Smart Contract Rollback

**Important**: Smart contracts on Base Mainnet are immutable. Rollback means deploying a new version and migrating.

#### If Using Upgradeable Proxy Pattern

```bash
# 1. Pause current implementation
npm run contract:pause -- --network mainnet

# 2. Deploy previous version
npm run deploy:previous -- --network mainnet

# 3. Point proxy to previous implementation
npm run proxy:upgrade -- --implementation <previous-address>

# 4. Verify state migration
npm run verify:state
```

#### If Using Immutable Contracts

```bash
# 1. Deploy previous contract version
npm run deploy:rollback -- --network mainnet

# 2. Update all integrations to new address
npm run update:integrations -- --address <new-address>

# 3. Communicate address change to users
npm run notify:address-change

# 4. Update transparency documentation
```

#### Emergency Pause (If Available)

```bash
# Immediately pause contract operations
npm run contract:pause -- --emergency

# This prevents:
# - New deposits
# - Revenue distributions
# - Configuration changes
```

---

### 2. API Layer Rollback (Azure Functions)

#### Using Azure Portal

1. Navigate to Azure Portal > Function App
2. Select "Deployment Center"
3. Click "Deployment History"
4. Select previous successful deployment
5. Click "Redeploy"

#### Using Azure CLI

```bash
# List deployment history
az functionapp deployment list \
  --name forthekids-api \
  --resource-group forthekids-rg

# Rollback to specific deployment
az functionapp deployment source sync \
  --name forthekids-api \
  --resource-group forthekids-rg

# Or redeploy from specific commit
az functionapp deployment source config \
  --name forthekids-api \
  --resource-group forthekids-rg \
  --repo-url <repo-url> \
  --branch main \
  --manual-integration
```

#### Using Deployment Slots

```bash
# Swap back to previous slot
az functionapp deployment slot swap \
  --name forthekids-api \
  --resource-group forthekids-rg \
  --slot staging \
  --target-slot production
```

---

### 3. Frontend Rollback

#### Static Web App (Azure)

```bash
# List environments
az staticwebapp environment list \
  --name forthekids-frontend

# Delete current and promote previous
az staticwebapp environment delete \
  --name forthekids-frontend \
  --environment-name production

# Redeploy from previous commit
git checkout <previous-commit>
npm run build
npm run deploy:frontend
```

#### CDN Cache Purge

```bash
# Purge CDN to ensure rollback is visible
az cdn endpoint purge \
  --resource-group forthekids-rg \
  --profile-name forthekids-cdn \
  --name forthekids-endpoint \
  --content-paths "/*"
```

---

### 4. Database Rollback

#### Azure SQL/PostgreSQL

```bash
# Point-in-time restore
az sql db restore \
  --dest-name forthekids-db-restored \
  --resource-group forthekids-rg \
  --server forthekids-sql \
  --name forthekids-db \
  --time "2026-01-14T00:00:00Z"

# Swap connection strings after verification
```

#### MongoDB (if applicable)

```bash
# Restore from backup
mongorestore --uri <connection-string> \
  --archive=/backups/forthekids-backup.archive
```

---

### 5. Infrastructure Rollback (Terraform)

```bash
# List state history
terraform state list

# Show previous state
terraform show -json > current-state.json

# Rollback to previous state
git checkout <previous-commit> -- terraform/

# Plan rollback
terraform plan

# Apply rollback (after review)
terraform apply
```

---

## Rollback Checklist

### Before Rollback

- [ ] Document current state and issue
- [ ] Notify team of rollback intent
- [ ] Identify rollback target (commit/version)
- [ ] Backup current data/state
- [ ] Prepare communication for users

### During Rollback

- [ ] Execute rollback procedure
- [ ] Monitor for errors
- [ ] Verify rollback completion
- [ ] Test critical functionality

### After Rollback

- [ ] Confirm system stability
- [ ] Update status page
- [ ] Notify stakeholders
- [ ] Document incident
- [ ] Schedule post-mortem

---

## Rollback Verification Tests

```bash
# Run smoke tests after rollback
npm run test:smoke

# Verify critical paths
npm run test:critical

# Check blockchain state
npm run verify:chain-state

# Confirm API responses
npm run test:api-health
```

---

## Communication Templates

### Internal Alert

```
ROLLBACK INITIATED
==================
Component: [Component Name]
Reason: [Brief description]
Target Version: [Version/Commit]
ETA: [Estimated time]
Lead: [Person responsible]
```

### User Communication

```
We are currently performing maintenance to ensure
the best experience for our users. Service will be
restored shortly. All funds remain secure.

Status updates: [status page URL]
```

---

## Emergency Contacts

| Role | Escalation Order |
|------|------------------|
| On-Call Engineer | 1st |
| Platform Lead | 2nd |
| Security Lead | If security-related |
| Infrastructure Lead | If infra-related |

---

## Post-Rollback Analysis

After every rollback, complete:

1. **Incident Report**: What happened, when, impact
2. **Root Cause Analysis**: Why did it happen
3. **Prevention Plan**: How to prevent recurrence
4. **Process Improvement**: What can be improved

---

*Rollback fast, communicate faster, learn fastest.*
