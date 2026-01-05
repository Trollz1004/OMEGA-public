# API Documentation

**Dating Platform API Reference**

Base URL: `http://localhost:3000/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Profiles](#user-profiles)
3. [Verification](#verification)
4. [Discovery & Matching](#discovery--matching)
5. [Messaging](#messaging)
6. [Subscriptions & Payments](#subscriptions--payments)
7. [Community](#community)
8. [AI Chat](#ai-chat)
9. [Consent Management](#consent-management)
10. [Transparency](#transparency)
11. [Admin](#admin)
12. [Affiliates](#affiliates)
13. [Webhooks](#webhooks)
14. [Droid Automation](#droid-automation)
15. [Kickstarter Campaign](#kickstarter-campaign)

---

## Authentication

### Register User

Create a new dating app account.

- **Method:** `POST`
- **Path:** `/dating/register`
- **Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your age and humanity.",
  "user": {
    "userId": "uuid-string",
    "email": "user@example.com",
    "displayName": "John Doe"
  },
  "nextSteps": {
    "ageVerification": "/api/dating/verify-age",
    "humanVerification": "/api/dating/verify-human"
  }
}
```

---

### Login

Authenticate and receive access tokens.

- **Method:** `POST`
- **Path:** `/dating/login`
- **Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "userId": "uuid-string",
    "email": "user@example.com",
    "ageVerified": false,
    "humanVerified": false
  }
}
```

---

### Logout

End the current session.

- **Method:** `POST`
- **Path:** `/dating/logout`
- **Auth Required:** Yes (Bearer Token)

**Request Headers:**
```
Authorization: Bearer <access_token>
X-Session-Id: <session_id>
```

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Profiles

### Get Profile

Retrieve the current user's profile.

- **Method:** `GET`
- **Path:** `/dating/profile`
- **Auth Required:** Yes

**Response (200 OK):**
```json
{
  "success": true,
  "profile": {
    "userId": "uuid-string",
    "displayName": "John Doe",
    "bio": "Love hiking and coffee",
    "gender": "male",
    "lookingFor": ["female"],
    "location": "New York, NY",
    "ageRangeMin": 25,
    "ageRangeMax": 35,
    "maxDistance": 50,
    "photoUrls": [],
    "primaryPhoto": null,
    "isHumanVerified": true,
    "isFoundingMember": false,
    "updatedAt": "2025-12-15T10:00:00Z"
  }
}
```

---

### Create/Update Profile

Create or update profile information.

- **Method:** `POST`
- **Path:** `/dating/profile`
- **Auth Required:** Yes
- **Requires:** Age Verification

**Request Body:**
```json
{
  "displayName": "John Doe",
  "bio": "Love hiking and coffee",
  "gender": "male",
  "lookingFor": ["female"],
  "location": "New York, NY",
  "ageRangeMin": 25,
  "ageRangeMax": 35,
  "maxDistance": 50
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated",
  "profile": { ... }
}
```

---

## Verification

### Age Verification

Verify user is 18 or older.

- **Method:** `POST`
- **Path:** `/dating/verify-age`
- **Auth Required:** Yes

**Request Body:**
```json
{
  "birthDate": "1995-06-15",
  "attestation": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Age verified successfully",
  "verificationId": "age-1702646400000",
  "nextStep": "/api/dating/verify-human"
}
```

---

### Age Self-Attestation

Basic age attestation (Layer 1).

- **Method:** `POST`
- **Path:** `/age-verification/attest`
- **Auth Required:** No

**Request Body:**
```json
{
  "acceptedAge": true,
  "acceptedTos": true,
  "sessionId": "optional-session-id"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "verificationToken": "uuid-string",
  "verificationLevel": "basic",
  "message": "Age attestation recorded. Enhanced verification recommended.",
  "requiresEnhancedVerification": true,
  "expiresAt": "2026-01-15T00:00:00Z"
}
```

---

### Enhanced Age Verification

Third-party ID verification (Layer 2 - Yoti/AWS).

- **Method:** `POST`
- **Path:** `/age-verification/enhanced`
- **Auth Required:** No

**Request Body:**
```json
{
  "verificationToken": "uuid-from-attestation",
  "provider": "yoti"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "verificationToken": "uuid-string",
  "provider": "yoti",
  "verificationUrl": "/verify/yoti/<token>",
  "message": "Redirecting to secure age verification",
  "instructions": "You will be asked to provide government-issued ID",
  "status": "pending"
}
```

---

### Human Verification

Verify user is human (anti-AI/bot detection).

- **Method:** `POST`
- **Path:** `/dating/verify-human`
- **Auth Required:** Yes

**Request Body:**
```json
{
  "method": "video",
  "challenge": { "id": "challenge-id" },
  "response": "user-response"
}
```

**Verification Methods:**
- `video` - Video verification (score: 95)
- `captcha` - CAPTCHA challenge (score: 70)
- `live-call` - Live call with verifier (score: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "You are verified as human!",
  "score": 95,
  "method": "video",
  "badge": "HUMAN_VERIFIED"
}
```

---

### Start Human Verification Flow

Initialize the verification process.

- **Method:** `POST`
- **Path:** `/verify-human/start`
- **Auth Required:** Yes

**Response (200 OK):**
```json
{
  "success": true,
  "sessionId": "verification-session-id",
  "challengeTypes": [
    { "type": "CAPTCHA", "score": 20, "description": "Type the characters shown" },
    { "type": "MATH_PUZZLE", "score": 15, "description": "Solve a math problem" },
    { "type": "VIDEO_GESTURE", "score": 40, "description": "Record making a gesture" },
    { "type": "LIVE_SELFIE", "score": 45, "description": "Take a selfie looking in a direction" }
  ]
}
```

---

### Analyze Text for AI Content

Detect AI-generated content in messages.

- **Method:** `POST`
- **Path:** `/verify-human/analyze-text`
- **Auth Required:** Yes

**Request Body:**
```json
{
  "text": "Message content to analyze"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "analysis": {
    "aiScore": 25,
    "isLikelyAI": false,
    "confidence": 0.75,
    "flags": []
  }
}
```

---

## Discovery & Matching

### Discover Profiles

Get profiles to swipe on.

- **Method:** `GET`
- **Path:** `/dating/discover`
- **Auth Required:** Yes
- **Requires:** Age Verification, Human Verification

**Response (200 OK):**
```json
{
  "success": true,
  "profiles": [
    {
      "userId": "uuid-string",
      "displayName": "Jane",
      "bio": "Adventure seeker",
      "primaryPhoto": "https://...",
      "isHumanVerified": true,
      "isFoundingMember": true
    }
  ],
  "remainingToday": 10
}
```

---

### Like a Profile

Express interest in another user.

- **Method:** `POST`
- **Path:** `/dating/like`
- **Auth Required:** Yes
- **Requires:** Age Verification, Human Verification

**Request Body:**
```json
{
  "targetUserId": "uuid-of-target-user",
  "isSuperLike": false
}
```

**Response (200 OK) - No Match:**
```json
{
  "success": true,
  "isMatch": false,
  "message": "Like sent!"
}
```

**Response (200 OK) - Match:**
```json
{
  "success": true,
  "isMatch": true,
  "match": {
    "matchId": "user1:user2",
    "matchedWith": "uuid-of-matched-user"
  },
  "message": "It's a match! You can now message each other."
}
```

---

### Pass on a Profile

Skip a profile.

- **Method:** `POST`
- **Path:** `/dating/pass`
- **Auth Required:** Yes

**Request Body:**
```json
{
  "targetUserId": "uuid-of-target-user"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Passed"
}
```

---

### Get Matches

Retrieve all your matches.

- **Method:** `GET`
- **Path:** `/dating/matches`
- **Auth Required:** Yes

**Response (200 OK):**
```json
{
  "success": true,
  "matches": [
    {
      "matchId": "user1:user2",
      "matchedWith": {
        "userId": "uuid-string",
        "displayName": "Jane",
        "primaryPhoto": "https://..."
      },
      "createdAt": "2025-12-15T10:00:00Z",
      "isActive": true
    }
  ],
  "count": 5
}
```

---

## Messaging

### Send Message

Send a message to a match.

- **Method:** `POST`
- **Path:** `/dating/message`
- **Auth Required:** Yes
- **Requires:** Human Verification

**Request Body:**
```json
{
  "matchId": "user1:user2",
  "content": "Hey! How are you?"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": {
    "id": "msg-1702646400000",
    "content": "Hey! How are you?",
    "createdAt": "2025-12-15T10:00:00Z",
    "aiWarning": null
  }
}
```

Note: Messages are scanned for AI-generated content. If detected, `aiWarning` will contain a notification.

---

### Get Messages

Retrieve conversation history.

- **Method:** `GET`
- **Path:** `/dating/messages/:matchId`
- **Auth Required:** Yes

**Response (200 OK):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg-1702646400000",
      "senderId": "uuid-string",
      "receiverId": "uuid-string",
      "content": "Hey! How are you?",
      "createdAt": "2025-12-15T10:00:00Z",
      "isRead": true,
      "readAt": "2025-12-15T10:05:00Z"
    }
  ],
  "count": 15
}
```

---

## Subscriptions & Payments

### Get Subscription Status

Check current subscription tier.

- **Method:** `GET`
- **Path:** `/subscriptions/status`
- **Auth Required:** No
- **Query Params:** `userId`

**Response (200 OK):**
```json
{
  "success": true,
  "subscription": {
    "tier": "premium",
    "status": "active",
    "expiresAt": "2026-01-15T00:00:00Z",
    "gospelSplit": {
      "charityPercentage": 60,
      "infrastructurePercentage": 30,
      "founderPercentage": 10
    }
  }
}
```

---

### Get Subscription Plans

View available subscription tiers.

- **Method:** `GET`
- **Path:** `/subscriptions/plans`
- **Auth Required:** No

**Response (200 OK):**
```json
{
  "success": true,
  "missionShield": true,
  "message": "Dating subscriptions under compliance review",
  "plans": [
    { "tier": "free", "price": 0, "status": "AVAILABLE", "features": ["Basic profile", "Limited matches"] },
    { "tier": "premium", "price": 1999, "status": "PAUSED", "features": ["Unlimited matches", "Priority support"] },
    { "tier": "vip", "price": 4999, "status": "PAUSED", "features": ["All Premium features", "VIP badge", "Video calls"] }
  ],
  "eta": "2-3 weeks for PaymentCloud integration",
  "alternative": "https://ai-solutions.store"
}
```

---

### Create Payment Checkout

Create a Square payment session.

- **Method:** `POST`
- **Path:** `/payments/create-checkout`
- **Auth Required:** No

**Request Body (AI Store):**
```json
{
  "sourceId": "card-token-from-square-web-sdk",
  "amount": 2999,
  "currency": "USD",
  "customer": {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "items": [
    { "id": "prod-1", "name": "AI Tool", "quantity": 1 }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "paymentId": "square-payment-id",
  "status": "COMPLETED"
}
```

---

### Verify Payment

Confirm a payment completed.

- **Method:** `POST`
- **Path:** `/payments/verify`
- **Auth Required:** No

**Request Body:**
```json
{
  "orderId": "square-order-id"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "isPaid": true,
  "order": {
    "id": "order-id",
    "state": "COMPLETED",
    "totalMoney": { "amount": 2999, "currency": "USD" },
    "createdAt": "2025-12-15T10:00:00Z"
  }
}
```

---

## Community

### Get Community Members

List community members with filtering.

- **Method:** `GET`
- **Path:** `/community/members`
- **Auth Required:** No
- **Query Params:** `role`, `search`, `page`, `limit`

**Response (200 OK):**
```json
{
  "success": true,
  "members": [],
  "total": 0,
  "page": 1,
  "totalPages": 0
}
```

---

### Get Volunteer Opportunities

List available volunteer/collaboration opportunities.

- **Method:** `GET`
- **Path:** `/community/opportunities`
- **Auth Required:** No
- **Query Params:** `type`, `urgency`, `page`, `limit`

**Response (200 OK):**
```json
{
  "success": true,
  "opportunities": [],
  "total": 0,
  "page": 1,
  "totalPages": 0
}
```

---

### Connect with Member

Request to connect with another community member.

- **Method:** `POST`
- **Path:** `/community/connect`
- **Auth Required:** No

**Request Body:**
```json
{
  "memberId": "member-uuid",
  "message": "Hi! I'd love to collaborate on your project."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Connection request sent",
  "requestId": "conn-1702646400000"
}
```

---

### Get Community Stats

Platform-wide community statistics.

- **Method:** `GET`
- **Path:** `/community/stats`
- **Auth Required:** No

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "activeMembers": 0,
    "openOpportunities": 0,
    "matchesMade": 0,
    "avgResponseTime": "--",
    "totalVolunteerHours": 0,
    "projectsCompleted": 0
  }
}
```

---

## AI Chat

### Send Chat Message

Chat with age-gated AI models.

- **Method:** `POST`
- **Path:** `/chat`
- **Auth Required:** No (Age gate middleware applies)

**Request Body:**
```json
{
  "message": "Hello, how can you help me today?"
}
```

**Response (200 OK):**
```json
{
  "response": "AI response text",
  "age_gated": true,
  "safe_mode": false,
  "model_used": "grok-4",
  "timestamp": "2025-12-15T10:00:00Z"
}
```

---

### Get Available Models

List AI models based on age verification.

- **Method:** `GET`
- **Path:** `/chat/models`
- **Auth Required:** No (Age gate middleware applies)

**Response (200 OK):**
```json
{
  "available_models": ["grok-4 (Full Grok)", "grok-3-kids (Baby Grok)"],
  "current_model": "grok-4",
  "safe_mode": false,
  "age_verified": true,
  "parental_consent": false
}
```

---

### Chat Service Status

Check AI chat proxy health.

- **Method:** `GET`
- **Path:** `/chat/status`
- **Auth Required:** No

**Response (200 OK):**
```json
{
  "service": "AI Chat",
  "proxy_status": "healthy",
  "age_gating": "active",
  "mission": "FOR THE KIDS!"
}
```

---

## Consent Management

### Record Cookie Consent

Save user's cookie preferences.

- **Method:** `POST`
- **Path:** `/consent/record`
- **Auth Required:** No

**Request Body:**
```json
{
  "sessionId": "optional-session-id",
  "essential": true,
  "analytics": true,
  "marketing": false,
  "userId": "optional-user-id"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "consentId": "uuid-string",
  "sessionId": "uuid-string",
  "consent": {
    "essential": true,
    "analytics": true,
    "marketing": false
  },
  "expiresAt": "2026-12-15T00:00:00Z",
  "message": "Consent preferences saved",
  "auditTrail": "Logged to BigQuery for compliance"
}
```

---

### Get Consent Status

Retrieve current consent preferences.

- **Method:** `GET`
- **Path:** `/consent/status/:sessionId`
- **Auth Required:** No

**Response (200 OK):**
```json
{
  "success": true,
  "sessionId": "uuid-string",
  "consent": {
    "essential": true,
    "analytics": false,
    "marketing": false
  },
  "status": "default",
  "message": "No consent record found - using defaults"
}
```

---

### Update Consent

Modify existing consent preferences.

- **Method:** `PUT`
- **Path:** `/consent/update`
- **Auth Required:** No

**Request Body:**
```json
{
  "sessionId": "uuid-string",
  "consentId": "previous-consent-id",
  "analytics": true,
  "marketing": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "consentId": "new-uuid-string",
  "sessionId": "uuid-string",
  "consent": {
    "essential": true,
    "analytics": true,
    "marketing": true
  },
  "message": "Consent preferences updated"
}
```

---

### Withdraw Consent

Revoke all non-essential consent (GDPR right).

- **Method:** `POST`
- **Path:** `/consent/withdraw`
- **Auth Required:** No

**Request Body:**
```json
{
  "sessionId": "uuid-string",
  "userId": "optional-user-id"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "consentId": "uuid-string",
  "message": "Consent withdrawn. Non-essential cookies will be removed.",
  "action": "Analytics and marketing data will be purged within 30 days",
  "rights": "You can update preferences at any time"
}
```

---

### Get Cookie Policy

Retrieve the full cookie policy document.

- **Method:** `GET`
- **Path:** `/consent/policy`
- **Auth Required:** No

**Response (200 OK):**
```json
{
  "success": true,
  "version": "1.0",
  "lastUpdated": "2025-11-24",
  "cookieTypes": {
    "essential": { "name": "Essential Cookies", "canOptOut": false },
    "analytics": { "name": "Analytics Cookies", "canOptOut": true },
    "marketing": { "name": "Marketing Cookies", "canOptOut": true }
  },
  "compliance": { "gdpr": true, "ccpa": true, "coppa": true },
  "contact": {
    "email": "privacy@aidoesitall.website",
    "dataProtectionOfficer": "dpo@aidoesitall.website"
  }
}
```

---

## Transparency

### Get Monthly Revenue Reports

Public revenue transparency data.

- **Method:** `GET`
- **Path:** `/transparency/monthly-reports`
- **Auth Required:** No

**Response (200 OK):**
```json
[
  {
    "period": "December 2025",
    "totalRevenue": 1500.00,
    "charityAmount": 900.00,
    "infrastructureAmount": 450.00,
    "founderAmount": 150.00,
    "transactions": [...],
    "receiptUrl": null,
    "status": "pending"
  }
]
```

---

### Get Current Month Data

Real-time revenue data for the current month.

- **Method:** `GET`
- **Path:** `/transparency/current-month`
- **Auth Required:** No

**Response (200 OK):**
```json
{
  "month": "December 2025",
  "totalRevenue": 500.00,
  "charityAmount": 300.00,
  "infrastructureAmount": 150.00,
  "founderAmount": 50.00,
  "sources": [
    { "name": "AI Marketplace (Stripe)", "amount": 500.00, "verified": true }
  ],
  "transactionCount": 10,
  "status": "verified"
}
```

---

### Get All-Time Stats

Lifetime platform statistics.

- **Method:** `GET`
- **Path:** `/transparency/stats`
- **Auth Required:** No

**Response (200 OK):**
```json
{
  "totalRevenue": 5000.00,
  "totalToCharity": 3000.00,
  "totalToInfrastructure": 1500.00,
  "totalToFounder": 500.00,
  "monthsActive": 1,
  "transactionCount": 50,
  "averageMonthlyRevenue": 5000.00,
  "launchDate": "2025-12-10",
  "status": "ACTIVE"
}
```

---

## Admin

All admin endpoints require authentication AND admin privileges.

### Get Admin Status

Check admin panel operational status.

- **Method:** `GET`
- **Path:** `/admin/status`
- **Auth Required:** Yes (Admin)

**Response (200 OK):**
```json
{
  "success": true,
  "status": "operational",
  "mission": "FOR THE KIDS"
}
```

---

### Get Security Audit

View security audit status.

- **Method:** `GET`
- **Path:** `/admin/security`
- **Auth Required:** Yes (Admin)

**Response (200 OK):**
```json
{
  "success": true,
  "lockdown": {
    "status": "ACTIVE",
    "type": "ACCOUNT-WIDE",
    "policy": "ONLY CLAUDE TOUCHES CODE"
  },
  "audit": {
    "date": "2025-12-05",
    "auditor": "Claude (Opus 4.5)",
    "status": "COMPLETE",
    "score": 100
  },
  "credentials": {
    "aws": { "status": "rotated" },
    "cloudflare": { "status": "rotated" },
    "github": { "status": "secured" }
  },
  "compliance": {
    "gospel": "v2.1 - LOCKDOWN ACTIVE",
    "coppa": "compliant",
    "fosta_sesta": "compliant"
  }
}
```

---

## Affiliates

### Register as Affiliate

Apply to become an affiliate.

- **Method:** `POST`
- **Path:** `/affiliates/register`
- **Auth Required:** No

**Request Body:**
```json
{
  "email": "affiliate@example.com",
  "name": "John Doe",
  "companyName": "My Company",
  "paymentEmail": "payment@example.com",
  "source": "website"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Affiliate application submitted!",
  "affiliate": {
    "id": "uuid-string",
    "code": "JOHNDOE123",
    "email": "affiliate@example.com",
    "status": "PENDING"
  }
}
```

---

### Track Affiliate Visit

Record an affiliate referral.

- **Method:** `GET`
- **Path:** `/affiliates/track/:code`
- **Auth Required:** No
- **Query Params:** `source`, `metadata`

**Response (200 OK):**
```json
{
  "success": true,
  "trackingId": "uuid-string",
  "sessionId": "uuid-string",
  "affiliateCode": "JOHNDOE123",
  "expiresIn": 2592000000,
  "message": "Referral tracked successfully"
}
```

---

### Convert Referral

Mark a referral as converted (after purchase).

- **Method:** `POST`
- **Path:** `/affiliates/convert`
- **Auth Required:** No

**Request Body:**
```json
{
  "sessionId": "tracking-session-id",
  "customerEmail": "customer@example.com",
  "customerId": "customer-uuid",
  "orderId": "order-id",
  "transactionId": "tx-id",
  "amount": 99.99
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Referral converted successfully",
  "commission": {
    "id": "commission-uuid",
    "amount": 2.99,
    "charityImpact": 59.99
  }
}
```

---

### Get Affiliate Dashboard

View affiliate performance metrics.

- **Method:** `GET`
- **Path:** `/affiliates/dashboard/:code`
- **Auth Required:** No

**Response (200 OK):**
```json
{
  "success": true,
  "affiliate": {
    "code": "JOHNDOE123",
    "name": "John Doe",
    "status": "ACTIVE",
    "commissionRate": 10,
    "totalReferrals": 25,
    "totalRevenue": 2500.00,
    "totalCommission": 75.00,
    "totalPaid": 50.00,
    "pendingCommission": 25.00,
    "thisMonth": {
      "revenue": 500.00,
      "commission": 15.00,
      "referrals": 5
    },
    "recentReferrals": [...],
    "recentPayouts": [...]
  }
}
```

---

## Webhooks

### Square Payment Webhook

Receives Square payment events for profit allocation.

- **Method:** `POST`
- **Path:** `/webhooks/square`
- **Auth Required:** Webhook signature verification

**Headers:**
```
X-Square-Hmacsha256-Signature: <signature>
Content-Type: application/json
```

**Request Body:** Square webhook payload

**Response (200 OK):**
```json
{
  "received": true,
  "transactionId": "uuid-string",
  "allocationId": "allocation-uuid",
  "hash": "sha256-hash-for-immutable-ledger"
}
```

---

### AI Store Webhook

Receives Square payments for AI Solutions Store.

- **Method:** `POST`
- **Path:** `/webhooks/ai-store`
- **Auth Required:** Webhook signature verification

Same format as Square webhook above.

---

## Droid Automation

### Get Droid Status

Check status of all automation droids.

- **Method:** `GET`
- **Path:** `/droid/status`
- **Auth Required:** Yes

**Response (200 OK):**
```json
{
  "success": true,
  "droids": {
    "crosslister": { "name": "Crosslister Droid", "status": "ready", "location": "Sabertooth" },
    "media_creator": { "name": "Media Creator Droid", "status": "ready" },
    "gospel_auditor": { "name": "Gospel Auditor", "status": "active" },
    "jules_ai": { "name": "Jules (Gemini AI)", "status": "active" }
  },
  "total_active": 2,
  "total_ready": 2
}
```

---

### Generate News Video

Create a news video with TTS and rendering.

- **Method:** `POST`
- **Path:** `/droid/generate-and-upload`
- **Auth Required:** No

**Request Body:**
```json
{
  "category": "technology",
  "privacy": "private"
}
```

**Response (200 OK):**
```json
{
  "id": "droid-full-1702646400000",
  "pipeline": "news -> script -> audio -> video -> youtube",
  "category": "technology",
  "script": "Generated script text...",
  "wordCount": 147,
  "headlines": [...],
  "audio": { "status": "ready", "filePath": "/path/to/audio.mp3" },
  "video": { "status": "ready", "filePath": "/path/to/video.mp4", "sizeMB": 12.5 },
  "youtube": {
    "status": "uploaded",
    "videoId": "youtube-video-id",
    "videoUrl": "https://youtube.com/watch?v=...",
    "shortsUrl": "https://youtube.com/shorts/..."
  },
  "status": "published",
  "mission": "60% to charity Children's Hospitals"
}
```

---

### Get Available Voices

List TTS voices for video generation.

- **Method:** `GET`
- **Path:** `/droid/voices`
- **Auth Required:** No

**Response (200 OK):**
```json
{
  "voices": ["en-US-GuyNeural", "en-US-JennyNeural", ...],
  "recommended": {
    "news": "en-US-GuyNeural",
    "female_news": "en-US-JennyNeural"
  },
  "mission": "FOR THE KIDS!"
}
```

---

### Emergency Stop

Halt all droid automation.

- **Method:** `POST`
- **Path:** `/droid/emergency-stop`
- **Auth Required:** Yes

**Response (200 OK):**
```json
{
  "success": true,
  "message": "All droids halted",
  "timestamp": "2025-12-15T10:00:00Z"
}
```

---

## Kickstarter Campaign

### Get Campaign Info

View campaign details and reward tiers.

- **Method:** `GET`
- **Path:** `/kickstarter/info`
- **Auth Required:** No

**Response (200 OK):**
```json
{
  "success": true,
  "campaign": {
    "name": "FOR THE KIDS Platform Development",
    "goal": 100000,
    "raised": 1500,
    "percentage": "1.5",
    "backerCount": 15,
    "daysRemaining": 30,
    "status": "ACTIVE"
  },
  "tiers": [
    { "id": "supporter", "name": "Supporter", "price": 10, "rewards": [...] },
    { "id": "believer", "name": "Early Believer", "price": 25, "rewards": [...] },
    { "id": "pioneer", "name": "Platform Pioneer", "price": 50, "popular": true, "rewards": [...] },
    { "id": "legacy", "name": "Legacy Builder", "price": 100, "rewards": [...] },
    { "id": "executive", "name": "Executive Founder", "price": 500, "rewards": [...] },
    { "id": "visionary", "name": "Visionary Patron", "price": 1000, "rewards": [...] }
  ],
  "disclosure": {
    "important": "Campaign funds are for PLATFORM DEVELOPMENT only.",
    "charityNote": "No portion of campaign funds goes to charity.",
    "postLaunch": "AFTER launch, the platform will donate 60% of net revenue to charity."
  }
}
```

---

### Back the Campaign

Support the campaign at a tier.

- **Method:** `POST`
- **Path:** `/kickstarter/back`
- **Auth Required:** No

**Request Body:**
```json
{
  "tier": "pioneer",
  "email": "backer@example.com",
  "name": "John Doe"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "checkoutUrl": "https://square.link/...",
  "tier": "Platform Pioneer",
  "amount": 50,
  "rewards": [...],
  "note": "This supports platform development. Not a charitable donation."
}
```

---

### Founding Member Preorder

Reserve a founding member spot for the dating app.

- **Method:** `POST`
- **Path:** `/kickstarter/preorder-founding`
- **Auth Required:** No

**Request Body:**
```json
{
  "email": "founder@example.com",
  "name": "John Doe"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "checkoutUrl": "https://square.link/...",
  "badgeNumber": 42,
  "spotsRemaining": 58,
  "perks": [
    "Founding Member Badge #42",
    "20% off for life ($14.99/mo)",
    "Early access to new features",
    "Vote on roadmap features"
  ],
  "mission": "60% of profits go to charity Children's Hospitals"
}
```

---

### Get Founding Member Status

Check availability of founding member spots.

- **Method:** `GET`
- **Path:** `/kickstarter/founding-status`
- **Auth Required:** No

**Response (200 OK):**
```json
{
  "success": true,
  "totalSpots": 100,
  "claimed": 42,
  "remaining": 58,
  "price": 14.99,
  "regularPrice": 19.99,
  "discount": "20%",
  "message": "Only 58 founding member spots left!"
}
```

---

## Error Responses

All endpoints may return the following error formats:

### 400 Bad Request
```json
{
  "error": "Validation error message",
  "message": "Detailed description"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Please provide a valid JWT token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found",
  "message": "The requested resource does not exist"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Unauthenticated:** 100 requests per 15 minutes per IP
- **Authenticated:** 1000 requests per 15 minutes per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1702647600
```

---

## Gospel Revenue Split

All revenue is automatically split according to Gospel V1.3:

| Allocation | Percentage | Purpose |
|------------|------------|---------|
| Charity | 60% | Verified Pediatric Charities |
| Infrastructure | 30% | Platform operations |
| Founder | 10% | Joshua Coleman |

This split is immutable and enforced at the payment processing level.

---

## Mission Statement

**FOR THE KIDS** - 60% of all revenue goes to charity Children's Hospitals.

Every API transaction that generates revenue automatically allocates 60% to verified pediatric charities. This is not optional - it is enforced by the Gospel protocol at the infrastructure level.
