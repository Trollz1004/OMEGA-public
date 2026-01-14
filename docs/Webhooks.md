# Webhook Integration Guide

**FOR THE KIDS Platform - Gospel V1.4.1 SURVIVAL MODE**

Complete documentation for Stripe and Square webhook integration.

---

## Table of Contents

1. [Overview](#overview)
2. [Stripe Setup](#stripe-setup)
3. [Square Setup](#square-setup)
4. [Required Events](#required-events)
5. [Secret Rotation](#secret-rotation)
6. [Sandbox vs Production](#sandbox-vs-production)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

---

## Overview

Webhooks allow payment processors to notify your application in real-time when events occur (payments, refunds, disputes, etc.). This guide covers setup for both Stripe and Square.

### Architecture

```
[Payment Provider] --> [Your Webhook Endpoint] --> [Event Handler] --> [Database/Actions]
     (Stripe)              /webhooks/stripe        stripe-webhook.ts
     (Square)              /webhooks/square        square-webhook.ts
```

### Key Files

| File | Purpose |
|------|---------|
| `webhooks/stripe-webhook.ts` | Stripe event handling |
| `webhooks/square-webhook.ts` | Square event handling |
| `webhooks/express-app.ts` | Express server setup |
| `webhooks/cloudflare-worker.ts` | Cloudflare Workers alternative |

---

## Stripe Setup

### Step 1: Access Webhook Settings

1. Log into [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** > **Webhooks**
3. Click **Add endpoint**

### Step 2: Configure Endpoint

**Endpoint URL:**
- Production: `https://your-domain.com/webhooks/stripe`
- Sandbox: `https://your-staging-domain.com/webhooks/stripe`

**Description:** FOR THE KIDS Platform Payment Webhooks

### Step 3: Select Events

Click **Select events** and choose:

**Checkout Events:**
- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

**Payment Intent Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`

**Subscription Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`

**Invoice Events:**
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.upcoming`

**Refund/Dispute Events:**
- `charge.refunded`
- `charge.dispute.created`

### Step 4: Get Signing Secret

1. After creating the endpoint, click on it
2. Under **Signing secret**, click **Reveal**
3. Copy the `whsec_...` value
4. Store securely as `STRIPE_WEBHOOK_SECRET`

### Step 5: Test with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhooks/stripe

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed
```

---

## Square Setup

### Step 1: Access Developer Dashboard

1. Log into [Square Developer Dashboard](https://developer.squareup.com)
2. Select your application
3. Navigate to **Webhooks** tab

### Step 2: Add Webhook Subscription

1. Click **Add Subscription**
2. Enter webhook details:

**Subscription Name:** FOR THE KIDS Payment Webhooks

**Notification URL:**
- Production: `https://your-domain.com/webhooks/square`
- Sandbox: `https://your-sandbox-domain.com/webhooks/square`

### Step 3: Select Events

**Payment Events:**
- `payment.created`
- `payment.updated`
- `payment.completed`

**Order Events:**
- `order.created`
- `order.updated`
- `order.fulfillment.updated`

**Refund Events:**
- `refund.created`
- `refund.updated`

**Invoice Events:**
- `invoice.created`
- `invoice.published`
- `invoice.payment_made`
- `invoice.canceled`

**Dispute Events:**
- `dispute.created`
- `dispute.state.changed`

### Step 4: Get Signature Key

1. After creating the subscription, find **Signature key**
2. Copy the value
3. Store securely as `SQUARE_WEBHOOK_SIGNATURE_KEY`

**Important:** Also store your webhook URL as `SQUARE_WEBHOOK_URL` - it must match exactly for signature verification.

### Step 5: Test with Square Sandbox

1. In Developer Dashboard, switch to **Sandbox** mode
2. Use sandbox credentials in your application
3. Make test payments using Square's test card numbers:
   - Success: `4111 1111 1111 1111`
   - Decline: `4000 0000 0000 0002`

---

## Required Events

### Minimum Event Set

For basic payment processing, subscribe to at minimum:

**Stripe:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `charge.dispute.created`

**Square:**
- `payment.completed`
- `payment.created`
- `refund.created`
- `dispute.created`

### Full Event Set (Recommended)

For complete payment lifecycle management, subscribe to all events listed in the setup sections above.

---

## Secret Rotation

### Stripe Secret Rotation

1. **Create New Endpoint:**
   - Go to Stripe Dashboard > Webhooks
   - Add a new endpoint with the same URL
   - Get the new signing secret

2. **Update Application:**
   - Deploy with the new `STRIPE_WEBHOOK_SECRET`
   - Your handler should now accept both old and new signatures

3. **Verify New Endpoint:**
   - Test with Stripe CLI
   - Confirm events are being received

4. **Delete Old Endpoint:**
   - Once verified, delete the old webhook endpoint

### Square Secret Rotation

1. **Generate New Key:**
   - In Square Developer Dashboard > Webhooks
   - Click on your subscription
   - Find **Rotate key** option

2. **Update Application:**
   - Deploy with the new `SQUARE_WEBHOOK_SIGNATURE_KEY`

3. **Verify:**
   - Make a test transaction
   - Confirm webhook is received

**Note:** Square may provide a grace period where both old and new keys work.

### Rotation Schedule

- Rotate secrets every **90 days** as a best practice
- Rotate immediately if any potential exposure

---

## Sandbox vs Production

### Environment Configuration

```bash
# Development/.env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
SQUARE_ACCESS_TOKEN=sandbox-...
SQUARE_WEBHOOK_SIGNATURE_KEY=sandbox_sig_...
SQUARE_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/webhooks/square

# Production/.env.production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
SQUARE_ACCESS_TOKEN=production-...
SQUARE_WEBHOOK_SIGNATURE_KEY=production_sig_...
SQUARE_WEBHOOK_URL=https://your-domain.com/webhooks/square
```

### Stripe Environments

| Environment | Dashboard | API Keys | Webhooks |
|-------------|-----------|----------|----------|
| Test | Toggle "View test data" | `sk_test_...` | Separate endpoints |
| Live | Default view | `sk_live_...` | Separate endpoints |

### Square Environments

| Environment | Dashboard | Access Token | Application ID |
|-------------|-----------|--------------|----------------|
| Sandbox | Toggle "Sandbox" | `sandbox-...` | Starts with `sandbox-` |
| Production | Default view | Production token | Production ID |

### Testing Checklist

Before going live:

- [ ] Test all event types in sandbox
- [ ] Verify signature verification works
- [ ] Test failure scenarios (invalid signature, missing header)
- [ ] Test retry handling (return 500, then success)
- [ ] Confirm idempotency (duplicate events handled)
- [ ] Load test webhook endpoint
- [ ] Verify production secrets are set
- [ ] Confirm production webhook URLs are registered

---

## Troubleshooting

### Common Issues

#### "Invalid signature" Error

**Causes:**
1. Wrong webhook secret
2. Request body was parsed before reaching handler
3. URL mismatch (Square)

**Solutions:**
1. Verify secret matches dashboard value
2. Ensure `express.raw()` middleware is applied BEFORE `express.json()`
3. For Square, ensure `SQUARE_WEBHOOK_URL` matches exactly

```typescript
// CORRECT: Raw body for webhooks FIRST
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.post('/webhooks/square', express.raw({ type: 'application/json' }), handleSquareWebhook);

// THEN: JSON for other routes
app.use(express.json());
```

#### Missing Events

**Causes:**
1. Event not subscribed in dashboard
2. Endpoint URL incorrect
3. Server not reachable

**Solutions:**
1. Check event subscriptions in provider dashboard
2. Verify endpoint URL is correct and reachable
3. Check server logs for incoming requests
4. Use Stripe CLI or Square webhook logs

#### Duplicate Events

**Causes:**
1. Retry due to non-200 response
2. Event sent to multiple endpoints

**Solutions:**
1. Implement idempotency using event IDs
2. Store processed event IDs in cache/database
3. Return 200 even if event was already processed

```typescript
// Example: Check for duplicate
const existing = await redis.get(`event:${event.id}`);
if (existing) {
  return res.status(200).json({ received: true, duplicate: true });
}
await redis.set(`event:${event.id}`, 'processed', 'EX', 86400);
```

#### Timeout Errors

**Causes:**
1. Processing takes too long
2. Synchronous database operations

**Solutions:**
1. Return 200 immediately, process asynchronously
2. Use message queue for heavy processing
3. Increase timeout if possible

```typescript
// Acknowledge immediately, process async
res.status(200).json({ received: true });

// Then process (don't await)
processEventAsync(event).catch(err => {
  console.error('Async processing failed:', err);
});
```

### Debug Mode

Enable verbose logging:

```typescript
// Add to webhook handlers
console.log('[Webhook] Headers:', JSON.stringify(req.headers));
console.log('[Webhook] Body type:', typeof req.body);
console.log('[Webhook] Body:', req.body.toString().substring(0, 500));
```

### Webhook Logs

**Stripe:**
- Dashboard > Developers > Webhooks > [Endpoint] > Recent events
- Shows request/response for each attempt

**Square:**
- Developer Dashboard > Webhooks > [Subscription] > Webhook Logs
- Shows delivery status and response codes

---

## Security Best Practices

### 1. Always Verify Signatures

Never skip signature verification, even in development:

```typescript
// BAD - Never do this
if (process.env.NODE_ENV === 'development') {
  // Skip verification
}

// GOOD - Always verify
const isValid = verifySignature(req);
if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### 2. Use Environment Variables

Never hardcode secrets:

```typescript
// BAD
const secret = 'whsec_abc123...';

// GOOD
const secret = process.env.STRIPE_WEBHOOK_SECRET;
if (!secret) {
  throw new Error('STRIPE_WEBHOOK_SECRET not configured');
}
```

### 3. Implement Idempotency

Handle duplicate events gracefully:

```typescript
async function processEvent(event: StripeEvent) {
  const eventId = event.id;

  // Check if already processed
  const processed = await db.webhookEvents.findUnique({ where: { eventId } });
  if (processed) {
    return { duplicate: true };
  }

  // Process event
  await handleEvent(event);

  // Mark as processed
  await db.webhookEvents.create({ data: { eventId, processedAt: new Date() } });
}
```

### 4. Rate Limiting

Protect against abuse:

```typescript
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many webhook requests',
});

app.post('/webhooks/stripe', webhookLimiter, express.raw({ type: 'application/json' }), handleStripeWebhook);
```

### 5. Secure Transport

- Always use HTTPS for webhook endpoints
- Use TLS 1.2 or higher
- Keep SSL certificates valid

### 6. Monitoring and Alerting

Set up alerts for:
- High error rates (>5% failures)
- Dispute events
- Unusual volume (>2x normal)
- Failed signature verifications

---

## Quick Reference

### Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Square
SQUARE_ACCESS_TOKEN=...
SQUARE_WEBHOOK_SIGNATURE_KEY=...
SQUARE_WEBHOOK_URL=https://your-domain.com/webhooks/square
```

### Endpoints

| Provider | Method | Path | Content-Type |
|----------|--------|------|--------------|
| Stripe | POST | `/webhooks/stripe` | `application/json` (raw) |
| Square | POST | `/webhooks/square` | `application/json` (raw) |

### Response Codes

| Code | Meaning | Provider Action |
|------|---------|-----------------|
| 200 | Success | Event processed |
| 400 | Bad request | Won't retry |
| 401 | Invalid signature | Won't retry |
| 500 | Server error | Will retry |

### Stripe CLI Commands

```bash
stripe login
stripe listen --forward-to localhost:3000/webhooks/stripe
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed
stripe trigger charge.refunded
stripe trigger charge.dispute.created
```

---

**"Until no kid is in need"**

*FOR THE KIDS Platform - Gospel V1.4.1 SURVIVAL MODE*
