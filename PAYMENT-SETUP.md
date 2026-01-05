# Dating Platform - Payment Setup Guide

Complete guide for integrating Square payment processing with the Dating Platform. This configuration is designed for MCC 7273 (Dating and Escort Services) compliance.

## Table of Contents

1. [Overview](#overview)
2. [Square Account Setup](#square-account-setup)
3. [Application Configuration](#application-configuration)
4. [Subscription Plans](#subscription-plans)
5. [Webhook Configuration](#webhook-configuration)
6. [Testing](#testing)
7. [Going Live](#going-live)
8. [Compliance](#compliance)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Dating Platform uses Square for payment processing due to its support for the MCC 7273 (Dating Services) merchant category. This is critical as many payment processors restrict or ban dating platforms.

### Payment Features

- One-time payments
- Recurring subscriptions
- Automatic billing
- Subscription management (pause, cancel, upgrade)
- Refund processing
- Payment disputes handling

### Supported Payment Methods

- Credit/Debit Cards (Visa, Mastercard, Amex, Discover)
- Apple Pay
- Google Pay
- Cash App Pay

---

## Square Account Setup

### 1. Create Square Account

1. Go to [Square Developer](https://developer.squareup.com/)
2. Sign up or log in
3. Complete business verification

### 2. Verify Business Information

For dating platforms, you'll need:
- Business registration documents
- Government-issued ID
- Bank account for deposits
- Website URL (must be live)

### 3. Request MCC 7273 Approval

Dating services require specific approval:

1. Contact Square Support
2. Request MCC 7273 classification
3. Provide:
   - Business description
   - Age verification methods
   - Content moderation policies
   - Terms of service
   - Privacy policy

### 4. Create Application

1. Go to Square Developer Dashboard
2. Click "Create Application"
3. Name: "Dating Platform Payments"
4. Note your credentials:
   - Application ID
   - Access Token
   - Location ID

---

## Application Configuration

### Environment Variables

Add to `.env`:

```bash
# Square API Credentials
SQUARE_ACCESS_TOKEN=EAAAxxxxxxxxxxxxxxxxxxxxxxxxxx
SQUARE_APPLICATION_ID=sq0idp-xxxxxxxxxxxxxxxx
SQUARE_LOCATION_ID=XXXXXXXXXXXXXX
SQUARE_ENVIRONMENT=sandbox  # Change to 'production' when ready

# Webhook
SQUARE_WEBHOOK_SECRET=your_webhook_signature_key
SQUARE_WEBHOOK_URL=https://your-domain.com/webhook/square

# Subscription Plans (created in Square Dashboard)
SQUARE_BASIC_PLAN_ID=plan_basic_id
SQUARE_PREMIUM_PLAN_ID=plan_premium_id
SQUARE_VIP_PLAN_ID=plan_vip_id
```

### Backend Integration

The payment integration is in `backend/services/`:

```javascript
// services/squarePayment.js
const { Client, Environment } = require('square');

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production'
    ? Environment.Production
    : Environment.Sandbox
});

module.exports = squareClient;
```

---

## Subscription Plans

### Create Plans in Square Dashboard

1. Go to Square Dashboard > Subscriptions
2. Create subscription plans:

#### Basic Plan ($9.99/month)
- Name: "Basic"
- Price: $9.99
- Billing Cadence: Monthly
- Features to track internally

#### Premium Plan ($29.99/month)
- Name: "Premium"
- Price: $29.99
- Billing Cadence: Monthly

#### VIP Plan ($49.99/month)
- Name: "VIP"
- Price: $49.99
- Billing Cadence: Monthly

### Plan Features (Database)

Update `database/prisma/schema.prisma` SubscriptionPlan features:

```prisma
model SubscriptionPlan {
  // ...
  features        Json @default("[]")
  swipesPerDay    Int @default(-1)  // -1 = unlimited
  superLikesPerDay Int @default(0)
  boostsPerMonth  Int @default(0)
  seeWhoLikes     Boolean @default(false)
  readReceipts    Boolean @default(false)
  incognitoMode   Boolean @default(false)
}
```

---

## Webhook Configuration

### 1. Create Webhook Endpoint

Add to `backend/routes/webhooks.js`:

```javascript
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

router.post('/square', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-square-hmacsha256-signature'];
  const body = req.body;

  // Verify signature
  const hmac = crypto.createHmac('sha256', process.env.SQUARE_WEBHOOK_SECRET);
  hmac.update(process.env.SQUARE_WEBHOOK_URL + body);
  const expectedSignature = hmac.digest('base64');

  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(body);

  switch (event.type) {
    case 'subscription.created':
      await handleSubscriptionCreated(event.data);
      break;
    case 'subscription.updated':
      await handleSubscriptionUpdated(event.data);
      break;
    case 'invoice.payment_made':
      await handlePaymentMade(event.data);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data);
      break;
    // ... handle other events
  }

  res.status(200).send('OK');
});

module.exports = router;
```

### 2. Register Webhook in Square

1. Go to Square Developer Dashboard
2. Select your application
3. Click "Webhooks"
4. Add endpoint: `https://your-domain.com/webhook/square`
5. Select events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `invoice.payment_made`
   - `invoice.payment_failed`
   - `payment.created`
   - `refund.created`

### 3. Event Handling

| Event | Action |
|-------|--------|
| subscription.created | Create local subscription record |
| subscription.updated | Update subscription status |
| subscription.canceled | Mark subscription as canceled |
| invoice.payment_made | Record payment, extend access |
| invoice.payment_failed | Notify user, retry payment |
| payment.created | Log transaction |
| refund.created | Process refund, adjust access |

---

## Testing

### Sandbox Testing

1. Use sandbox credentials in `.env`
2. Use test card numbers:
   - Success: `4111 1111 1111 1111`
   - Decline: `4000 0000 0000 0002`
   - CVV Fail: `4000 0000 0000 0127`

### Test Subscription Flow

```bash
# Create test customer
curl -X POST https://connect.squareupsandbox.com/v2/customers \
  -H "Authorization: Bearer ${SQUARE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email_address": "test@example.com",
    "given_name": "Test",
    "family_name": "User"
  }'

# Create subscription
curl -X POST https://connect.squareupsandbox.com/v2/subscriptions \
  -H "Authorization: Bearer ${SQUARE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "${SQUARE_LOCATION_ID}",
    "plan_id": "${SQUARE_PREMIUM_PLAN_ID}",
    "customer_id": "CUSTOMER_ID_HERE",
    "card_id": "CARD_ID_HERE"
  }'
```

### Webhook Testing

Use Square's webhook testing in the Developer Dashboard:
1. Go to Webhooks
2. Click "Test Webhook"
3. Select event type
4. Send test payload

---

## Going Live

### Checklist

- [ ] Square account fully verified
- [ ] MCC 7273 approved
- [ ] Business bank account connected
- [ ] Production credentials obtained
- [ ] Subscription plans created
- [ ] Webhooks registered
- [ ] SSL certificate installed
- [ ] Age verification implemented
- [ ] Terms of service reviewed by lawyer
- [ ] Privacy policy compliant

### Switch to Production

1. Update `.env`:
```bash
SQUARE_ACCESS_TOKEN=<production-token>
SQUARE_APPLICATION_ID=<production-app-id>
SQUARE_LOCATION_ID=<production-location-id>
SQUARE_ENVIRONMENT=production
```

2. Update webhook URL in Square Dashboard

3. Test with real card (small amount)

4. Monitor first transactions closely

---

## Compliance

### MCC 7273 Requirements

The dating services merchant category requires:

1. **Age Verification**
   - All users must be 18+
   - Implement ID verification
   - Document verification process

2. **Content Policies**
   - No explicit content
   - Clear community guidelines
   - Active content moderation

3. **Terms of Service**
   - Clear refund policy
   - Subscription terms
   - User responsibilities

4. **Dispute Prevention**
   - Clear billing descriptors
   - Easy cancellation process
   - Responsive customer support

### PCI Compliance

Square handles PCI compliance, but you must:
- Never store card numbers
- Use HTTPS everywhere
- Keep systems updated
- Train staff on security

### GDPR/CCPA

For payment data:
- Store only necessary data
- Provide data export
- Allow deletion requests
- Document data retention

---

## Troubleshooting

### Common Issues

**Payment Declined**
```
Error: CARD_DECLINED
```
- Check card details
- Verify billing address
- Contact customer's bank

**Invalid Access Token**
```
Error: UNAUTHORIZED
```
- Check environment (sandbox vs production)
- Verify token is not expired
- Regenerate access token

**Webhook Not Receiving**
- Verify webhook URL is accessible
- Check SSL certificate
- Verify signature calculation
- Check Square Dashboard for errors

**Subscription Creation Failed**
```
Error: INVALID_PLAN_ID
```
- Verify plan exists in Square
- Check plan is in correct location
- Ensure plan is active

### Debugging

Enable logging:
```javascript
// backend/services/squarePayment.js
squareClient.config.debug = true;
```

Check Square Dashboard:
- Transactions log
- Webhook delivery log
- API request log

### Support

- Square Developer Docs: https://developer.squareup.com/docs
- Square Support: https://squareup.com/help/contact
- Developer Forums: https://developer.squareup.com/forums

---

## API Reference

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/subscriptions` | GET | List user's subscriptions |
| `/api/subscriptions` | POST | Create subscription |
| `/api/subscriptions/:id` | DELETE | Cancel subscription |
| `/api/subscriptions/:id/pause` | POST | Pause subscription |
| `/api/subscriptions/:id/resume` | POST | Resume subscription |
| `/api/payments` | GET | List payment history |
| `/api/payments/:id/refund` | POST | Request refund |

### Frontend Integration

```javascript
// Subscribe user
const subscribe = async (planId, cardNonce) => {
  const response = await fetch('/api/subscriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ planId, cardNonce })
  });
  return response.json();
};
```

### Square Web Payments SDK

Include in frontend:
```html
<script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
```

Initialize:
```javascript
const payments = Square.payments(applicationId, locationId);
const card = await payments.card();
await card.attach('#card-container');

// Tokenize on submit
const result = await card.tokenize();
if (result.status === 'OK') {
  // Send result.token to backend
}
```
