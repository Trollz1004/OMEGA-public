# Deployment Runbook

## FOR THE KIDS Platform - Step-by-Step Deployment Guide

**Version**: Gospel V1.4.1 SURVIVAL MODE
**Target Network**: Base Mainnet

---

## Pre-Deployment Requirements

### 1. Environment Verification

```bash
# Verify Node.js version
node --version  # Must be 18+

# Verify npm packages
npm ci

# Run all tests
npm test

# Run security analysis
npm run security:check
```

### 2. Credentials Check

Ensure the following are configured in Azure Key Vault:

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `BASE-RPC-URL` | Base Mainnet RPC endpoint | Yes |
| `DEPLOYER-PRIVATE-KEY` | Deployment wallet private key | Yes |
| `ETHERSCAN-API-KEY` | For contract verification | Yes |
| `STRIPE-SECRET-KEY` | Payment processing | Yes |
| `STRIPE-WEBHOOK-SECRET` | Webhook validation | Yes |

### 3. Wallet Balance

```bash
# Check deployer wallet balance
npm run check:balance

# Minimum required: 0.1 ETH for deployment gas
```

---

## Deployment Steps

### Step 1: Pull Latest Code

```bash
cd /path/to/project
git checkout main
git pull origin main
git status  # Ensure clean working directory
```

### Step 2: Build Contracts

```bash
# Compile contracts
npm run compile

# Verify no warnings
npm run compile:check
```

### Step 3: Run Pre-Deployment Tests

```bash
# Full test suite
npm test

# Gas estimation
npm run test:gas

# Slither analysis
npm run security:slither
```

### Step 4: Deploy to Testnet (Staging)

```bash
# Deploy to Base Sepolia first
npm run deploy:testnet

# Verify deployment
npm run verify:testnet

# Run smoke tests against testnet
npm run test:smoke -- --network testnet
```

### Step 5: Deploy to Mainnet

```bash
# Final confirmation prompt
npm run deploy:mainnet

# This will:
# 1. Display deployment parameters
# 2. Estimate gas costs
# 3. Require manual confirmation
# 4. Deploy contracts
# 5. Output deployed addresses
```

### Step 6: Verify Contracts

```bash
# Verify on BaseScan
npm run verify:mainnet

# Expected output:
# CharityRouter100: 0x... (verified)
# DatingRevenueRouter: 0x... (verified)
```

### Step 7: Configure Post-Deployment

```bash
# Set initial parameters
npm run configure:mainnet

# This includes:
# - Setting charity wallet address
# - Configuring revenue splits
# - Enabling distribution
```

### Step 8: Validate Deployment

```bash
# Run validation suite
npm run validate:deployment

# Checks:
# - Contract ownership
# - Configuration values
# - Access controls
# - First test transaction
```

---

## Deployment Checklist

- [ ] All tests passing
- [ ] Testnet deployment successful
- [ ] Contract addresses recorded
- [ ] Contracts verified on BaseScan
- [ ] Configuration validated
- [ ] Monitoring enabled
- [ ] Team notified

---

## Post-Deployment Tasks

### Update Documentation

1. Record contract addresses in `docs/contracts.md`
2. Update transparency page with new addresses
3. Notify stakeholders

### Enable Monitoring

```bash
# Start monitoring services
npm run monitoring:start

# Verify alerts are working
npm run monitoring:test
```

### Configure Webhooks

1. Update Stripe webhook endpoint
2. Update Coinbase Commerce webhook
3. Test webhook delivery

---

## Deployment Output Template

```
=====================================
DEPLOYMENT COMPLETE
=====================================
Network: Base Mainnet
Block: #XXXXXXXX
Timestamp: YYYY-MM-DD HH:MM:SS UTC

Contracts Deployed:
- CharityRouter100: 0x...
- DatingRevenueRouter: 0x...

Gas Used: X.XX ETH
Deployer: 0x...

Verification Status: VERIFIED
=====================================
```

---

## Troubleshooting

### Gas Estimation Failed

```bash
# Increase gas limit
npm run deploy:mainnet -- --gas-limit 5000000
```

### Verification Failed

```bash
# Retry verification with constructor args
npm run verify:mainnet -- --constructor-args args.js
```

### Transaction Pending Too Long

1. Check gas price against network
2. Consider speed-up transaction
3. Do NOT deploy again until resolved

---

## Emergency Contacts

| Role | Contact Method |
|------|----------------|
| Platform Lead | Internal channel |
| Security | Security channel |
| Infrastructure | Ops channel |

---

## Rollback

If deployment fails or issues are discovered, see [Rollback Procedures](./rollback.md).

---

*Deploy with confidence, verify with diligence.*
