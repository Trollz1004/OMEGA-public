# Key Rotation Procedures

## FOR THE KIDS Platform - Credential Rotation Guide

**Version**: Gospel V1.4.1 SURVIVAL MODE
**Security Classification**: Sensitive Operations

---

## Key Rotation Schedule

| Credential Type | Rotation Frequency | Last Rotated | Next Due |
|-----------------|-------------------|--------------|----------|
| API Keys | 90 days | | |
| Database Passwords | 90 days | | |
| JWT Signing Keys | 180 days | | |
| Webhook Secrets | On compromise | | |
| Service Principals | 365 days | | |

---

## Pre-Rotation Checklist

- [ ] Notify team of planned rotation
- [ ] Schedule during low-traffic window
- [ ] Backup current Key Vault state
- [ ] Prepare new credentials
- [ ] Test rotation in staging first
- [ ] Have rollback plan ready

---

## Azure Key Vault Rotation

### General Process

```bash
# 1. Generate new secret value
NEW_SECRET=$(openssl rand -base64 32)

# 2. Add new version to Key Vault
az keyvault secret set \
  --vault-name forthekids-kv \
  --name "secret-name" \
  --value "$NEW_SECRET"

# 3. Update applications to use new version
# (Applications using latest will auto-update)

# 4. Verify new secret is in use
az keyvault secret show \
  --vault-name forthekids-kv \
  --name "secret-name"
```

### Enable Auto-Rotation (Recommended)

```bash
# Configure auto-rotation policy
az keyvault secret rotation-policy update \
  --vault-name forthekids-kv \
  --name "secret-name" \
  --rotation-policy @rotation-policy.json
```

---

## Service-Specific Rotation Procedures

### 1. Stripe API Keys

#### Step 1: Generate New Keys in Stripe Dashboard

1. Log in to Stripe Dashboard
2. Navigate to Developers > API Keys
3. Click "Roll API Key" for the secret key
4. Copy the new key immediately

#### Step 2: Update Key Vault

```bash
# Update secret key
az keyvault secret set \
  --vault-name forthekids-kv \
  --name "STRIPE-SECRET-KEY" \
  --value "sk_live_new_key_here"
```

#### Step 3: Update Webhook Secret

1. In Stripe Dashboard, go to Webhooks
2. Select the endpoint
3. Click "Reveal" to see signing secret
4. Update Key Vault:

```bash
az keyvault secret set \
  --vault-name forthekids-kv \
  --name "STRIPE-WEBHOOK-SECRET" \
  --value "whsec_new_secret_here"
```

#### Step 4: Verify

```bash
# Test webhook signature validation
npm run test:stripe-webhook
```

---

### 2. Base RPC Endpoint Keys

#### Using Alchemy

1. Log in to Alchemy Dashboard
2. Navigate to your Base Mainnet app
3. Click "View Key" then "Rotate Key"
4. Update Key Vault:

```bash
az keyvault secret set \
  --vault-name forthekids-kv \
  --name "BASE-RPC-URL" \
  --value "https://base-mainnet.g.alchemy.com/v2/new-key"
```

#### Using Infura

1. Log in to Infura Dashboard
2. Navigate to project settings
3. Regenerate API key
4. Update Key Vault with new endpoint

---

### 3. Database Credentials

#### Azure SQL

```bash
# 1. Generate new password
NEW_PASSWORD=$(openssl rand -base64 24)

# 2. Update in Azure
az sql server update \
  --resource-group forthekids-rg \
  --name forthekids-sql \
  --admin-password "$NEW_PASSWORD"

# 3. Update Key Vault
az keyvault secret set \
  --vault-name forthekids-kv \
  --name "DB-PASSWORD" \
  --value "$NEW_PASSWORD"

# 4. Restart applications to pick up new password
az functionapp restart \
  --name forthekids-api \
  --resource-group forthekids-rg
```

#### Connection String Update

```bash
# Update full connection string if needed
az keyvault secret set \
  --vault-name forthekids-kv \
  --name "DB-CONNECTION-STRING" \
  --value "Server=...;Password=$NEW_PASSWORD;..."
```

---

### 4. JWT Signing Keys

#### Generate New Key Pair

```bash
# Generate new RSA key pair
openssl genrsa -out jwt-private.pem 4096
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem

# Store private key in Key Vault
az keyvault secret set \
  --vault-name forthekids-kv \
  --name "JWT-PRIVATE-KEY" \
  --file jwt-private.pem

# Store public key in Key Vault
az keyvault secret set \
  --vault-name forthekids-kv \
  --name "JWT-PUBLIC-KEY" \
  --file jwt-public.pem

# Clean up local files
rm jwt-private.pem jwt-public.pem
```

#### Grace Period for Old Tokens

- Keep old public key available for verification
- Set token expiry to force re-authentication
- Monitor for authentication failures

---

### 5. Deployer Wallet Private Key

**CRITICAL**: This requires extreme caution.

#### Step 1: Create New Wallet

```bash
# Generate new wallet (use hardware wallet for production)
# Never generate production keys on shared systems
```

#### Step 2: Transfer Assets

1. Transfer all ETH from old wallet to new wallet
2. Transfer any contract ownership to new wallet

#### Step 3: Update Key Vault

```bash
az keyvault secret set \
  --vault-name forthekids-kv \
  --name "DEPLOYER-PRIVATE-KEY" \
  --value "0xnew_private_key"
```

#### Step 4: Secure Old Key

1. Document old address for audit trail
2. Securely destroy old private key
3. Monitor old address for any activity

---

### 6. Service Principal Credentials

```bash
# 1. Create new credentials
az ad sp credential reset \
  --name forthekids-sp \
  --credential-description "Rotated $(date +%Y-%m-%d)"

# 2. Update Key Vault with new client secret
az keyvault secret set \
  --vault-name forthekids-kv \
  --name "AZURE-CLIENT-SECRET" \
  --value "new_client_secret"

# 3. Restart services using the service principal
```

---

## Post-Rotation Verification

```bash
# Run full integration test suite
npm run test:integration

# Verify API endpoints
npm run test:api-health

# Check blockchain connectivity
npm run test:chain-connection

# Verify webhook delivery
npm run test:webhooks
```

---

## Emergency Rotation (Compromise Response)

If a key is compromised:

1. **Immediately** rotate the compromised credential
2. **Revoke** the old credential if possible
3. **Audit** logs for unauthorized access
4. **Notify** security team
5. **Document** the incident

```bash
# Emergency rotation script
./scripts/emergency-rotate.sh --credential <name>
```

---

## Rotation Log Template

| Date | Credential | Rotated By | Reason | Verified |
|------|------------|------------|--------|----------|
| | | | | |

---

## Best Practices

1. **Never** log or echo credentials
2. **Always** use Key Vault, never environment files in production
3. **Test** in staging before production rotation
4. **Document** every rotation
5. **Automate** where possible
6. **Monitor** for authentication failures after rotation

---

*Rotate regularly, respond immediately to compromise.*
