# Email Templates Documentation

This document provides comprehensive documentation for the email template system used in the dating platform.

## Table of Contents

- [Overview](#overview)
- [Template Structure](#template-structure)
- [Available Templates](#available-templates)
- [Template Variables](#template-variables)
- [Customization Guide](#customization-guide)
- [Email Service API](#email-service-api)
- [Testing with MailHog](#testing-with-mailhog)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The email template system uses [Handlebars](https://handlebarsjs.com/) for templating with a responsive HTML design that supports:

- **Dark mode** - Automatic dark mode support for email clients that support it
- **Mobile responsiveness** - Optimized layouts for mobile devices
- **Email client compatibility** - Works across Gmail, Outlook, Apple Mail, and more
- **Accessibility** - Semantic HTML and proper contrast ratios

### Architecture

```
backend/
├── templates/
│   └── emails/
│       ├── base.html           # Base layout template
│       ├── welcome.html        # Welcome email
│       ├── new-match.html      # Match notification
│       ├── new-message.html    # Message notification
│       ├── weekly-digest.html  # Weekly activity digest
│       ├── password-reset.html # Password reset
│       ├── verification.html   # Email verification
│       └── subscription.html   # Subscription confirmation
└── services/
    └── emailService.js         # Email service with SendGrid/Mailgun
```

---

## Template Structure

### Base Template (`base.html`)

All email templates extend the base template using Handlebars partial blocks:

```handlebars
{{#> base subject="Your Subject Line"}}
  <!-- Your email content here -->
{{/base}}
```

The base template provides:
- HTML email structure with proper DOCTYPE
- Responsive CSS styles
- Dark mode media queries
- Header with logo
- Footer with unsubscribe links, social icons, and legal info
- Mobile-responsive breakpoints

### CSS Classes Available

| Class | Description |
|-------|-------------|
| `.btn-primary` | Primary CTA button (gradient background) |
| `.btn-secondary` | Secondary button (outlined style) |
| `.card` | Content card with background |
| `.card-highlight` | Highlighted card with gradient border |
| `.divider` | Horizontal divider line |
| `.text-center` | Center-aligned text |
| `.text-muted` | Muted gray text |
| `.text-small` | Smaller font size |
| `.hide-mobile` | Hidden on mobile devices |
| `.stack-mobile` | Full width on mobile |

---

## Available Templates

### 1. Welcome Email (`welcome.html`)

Sent when a new user registers.

**Variables:**
```javascript
{
  user: {
    firstName: string,
    email: string
  }
}
```

**Usage:**
```javascript
await emailService.sendWelcomeEmail({
  id: 'user-123',
  firstName: 'John',
  email: 'john@example.com'
});
```

---

### 2. New Match Notification (`new-match.html`)

Sent when two users mutually like each other.

**Variables:**
```javascript
{
  user: {
    firstName: string,
    isPremium: boolean
  },
  match: {
    id: string,
    firstName: string,
    firstInitial: string,
    age: number,
    location: string,
    photoUrl: string,
    compatibilityScore: number,
    sharedInterests: number,
    distance: string,
    interests: string[]
  }
}
```

**Usage:**
```javascript
await emailService.sendMatchNotification(user, {
  id: 'match-456',
  firstName: 'Sarah',
  age: 28,
  location: 'San Francisco, CA',
  photoUrl: 'https://cdn.example.com/photos/sarah.jpg',
  compatibilityScore: 87,
  sharedInterests: ['hiking', 'photography', 'cooking'],
  distance: '5 miles'
});
```

---

### 3. New Message Notification (`new-message.html`)

Sent when a user receives a new message.

**Variables:**
```javascript
{
  user: {
    firstName: string
  },
  sender: {
    firstName: string,
    firstInitial: string,
    age: number,
    location: string,
    photoUrl: string
  },
  messagePreview: string,
  isMessageTruncated: boolean,
  messageTime: string,
  conversationId: string,
  conversationStats: {
    messageCount: number,
    duration: string
  },
  quickReplies: string[]
}
```

**Usage:**
```javascript
await emailService.sendMessageNotification(
  user,
  sender,
  { content: 'Hey! I saw we both love hiking...', createdAt: new Date() },
  'conversation-789'
);
```

---

### 4. Weekly Digest (`weekly-digest.html`)

Sent weekly with activity summary.

**Variables:**
```javascript
{
  user: {
    firstName: string,
    isPremium: boolean
  },
  stats: {
    profileViews: number,
    profileViewsChange: number,
    profileViewsUp: boolean,
    newLikes: number,
    newLikesChange: number,
    newLikesUp: boolean,
    newMatches: number,
    newMatchesChange: number,
    newMatchesUp: boolean
  },
  pendingLikes: {
    count: number,
    preview: [{ photoUrl, firstName }]
  },
  suggestedMatches: [{
    id: string,
    firstName: string,
    firstInitial: string,
    age: number,
    location: string,
    photoUrl: string,
    compatibilityScore: number,
    bio: string
  }],
  weeklyTip: {
    title: string,
    content: string,
    linkUrl: string,
    linkText: string
  },
  profileStrength: {
    isComplete: boolean,
    percentage: number
  }
}
```

**Usage:**
```javascript
await emailService.sendWeeklyDigest(user, {
  profileViews: 142,
  profileViewsChange: 23,
  profileViewsUp: true,
  newLikes: 8,
  newMatches: 3,
  // ... more stats
});
```

---

### 5. Password Reset (`password-reset.html`)

Sent when user requests password reset.

**Variables:**
```javascript
{
  user: {
    firstName: string,
    email: string
  },
  resetUrl: string,
  expirationTime: string,
  requestDate: string,
  requestIP: string,
  requestDevice: string,
  requestLocation: string
}
```

**Usage:**
```javascript
await emailService.sendPasswordResetEmail(user, resetToken, {
  ip: '192.168.1.1',
  device: 'Chrome on Windows',
  location: 'San Francisco, CA'
});
```

---

### 6. Email Verification (`verification.html`)

Sent for email verification.

**Variables:**
```javascript
{
  user: {
    firstName: string
  },
  verificationCode: string,
  verificationUrl: string,
  codeExpiration: string,
  linkExpiration: string
}
```

**Usage:**
```javascript
await emailService.sendVerificationEmail(
  user,
  '847293',
  'https://app.example.com/verify?token=xxx'
);
```

---

### 7. Subscription Confirmation (`subscription.html`)

Sent after successful subscription purchase.

**Variables:**
```javascript
{
  user: {
    firstName: string
  },
  subscription: {
    planName: string,
    billingCycle: string,
    currency: string,
    amount: string,
    startDate: string,
    nextBillingDate: string,
    orderId: string,
    features: [{ title: string, description: string }]
  },
  billing: {
    name: string,
    email: string,
    address: string,
    cardBrand: string,
    cardLast4: string
  },
  receiptUrl: string
}
```

**Usage:**
```javascript
await emailService.sendSubscriptionConfirmation(user, subscription, billing);
```

---

## Template Variables

### Global Variables

These variables are automatically available in all templates:

| Variable | Description |
|----------|-------------|
| `siteName` | Site name (e.g., "LoveConnect") |
| `siteUrl` | Base URL of the site |
| `assetsUrl` | CDN URL for assets |
| `supportEmail` | Support email address |
| `companyName` | Company legal name |
| `companyAddress` | Company address |
| `socialLinks.facebook` | Facebook page URL |
| `socialLinks.twitter` | Twitter profile URL |
| `socialLinks.instagram` | Instagram profile URL |
| `unsubscribeUrl` | Base unsubscribe URL |
| `unsubscribeToken` | User-specific unsubscribe token |
| `emailType` | Type of email (for selective unsubscribe) |
| `currentYear` | Current year for copyright |

### Handlebars Helpers

Custom helpers available in templates:

```handlebars
{{!-- Encode URI component --}}
{{encodeURIComponent "hello world"}}

{{!-- Format date --}}
{{formatDate date "short"}}   {{!-- Jan 15, 2024 --}}
{{formatDate date "long"}}    {{!-- Monday, January 15, 2024 --}}
{{formatDate date "time"}}    {{!-- 3:30 PM --}}
{{formatDate date "datetime"}} {{!-- Jan 15, 2024, 3:30 PM --}}

{{!-- Pluralize --}}
{{pluralize count "match" "matches"}}

{{!-- Truncate text --}}
{{truncate longText 100}}

{{!-- Conditionals --}}
{{#if (eq status "active")}}Active{{/if}}
{{#if (gt count 5)}}Many items{{/if}}

{{!-- First initial --}}
{{firstInitial "John"}}  {{!-- J --}}
```

---

## Customization Guide

### Changing Brand Colors

Edit the CSS variables in `base.html`:

```css
/* Primary gradient */
.btn-primary {
  background: linear-gradient(135deg, #e91e63 0%, #ff5722 100%);
}

/* Change to your brand colors */
.btn-primary {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

### Adding a New Template

1. Create a new `.html` file in `backend/templates/emails/`:

```handlebars
{{!-- my-template.html --}}
{{#> base subject="My Subject"}}

<h1>Hello {{user.firstName}}!</h1>
<p>Your content here...</p>

<div class="text-center">
  <a href="{{ctaUrl}}" class="btn-primary">Click Here</a>
</div>

{{/base}}
```

2. Add a convenience function in `emailService.js`:

```javascript
async function sendMyEmail(user, data) {
  await sendEmail({
    to: user.email,
    templateName: 'my-template',
    data: {
      subject: 'My Email Subject',
      user: {
        firstName: user.firstName,
      },
      ctaUrl: data.ctaUrl,
      userId: user.id,
    },
  });
}

module.exports = {
  // ... existing exports
  sendMyEmail,
};
```

### Modifying the Footer

Edit the footer section in `base.html`:

```html
<!-- Footer -->
<tr>
  <td class="email-footer">
    <!-- Your custom footer content -->
  </td>
</tr>
```

---

## Email Service API

### Initialization

```javascript
const emailService = require('./services/emailService');

// Initialize on app startup
await emailService.initialize();
```

### Configuration (Environment Variables)

```env
# Provider Configuration
EMAIL_PROVIDER=sendgrid           # or 'mailgun'
SENDGRID_API_KEY=your-api-key
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=mg.yourdomain.com

# Sender Configuration
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your App Name
EMAIL_REPLY_TO=support@yourdomain.com

# Site Configuration
SITE_NAME=LoveConnect
SITE_URL=https://yourdomain.com
ASSETS_URL=https://cdn.yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# Company Info
COMPANY_NAME=Your Company Inc.
COMPANY_ADDRESS=123 Street, City, ST 12345

# Social Links
SOCIAL_FACEBOOK=https://facebook.com/yourapp
SOCIAL_TWITTER=https://twitter.com/yourapp
SOCIAL_INSTAGRAM=https://instagram.com/yourapp

# Queue Configuration
EMAIL_QUEUE_ENABLED=true
REDIS_URL=redis://localhost:6379
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY=5000

# Rate Limiting
EMAIL_RATE_LIMIT_ENABLED=true
EMAIL_RATE_LIMIT_PER_MINUTE=100
EMAIL_RATE_LIMIT_PER_HOUR=1000

# Security
UNSUBSCRIBE_SECRET=your-secret-key
```

### Core Functions

```javascript
// Send a single email
await emailService.sendEmail({
  to: 'user@example.com',
  templateName: 'welcome',
  data: { user: { firstName: 'John' } },
  queue: false // optional, send immediately
});

// Send bulk emails (always queued)
await emailService.sendBulkEmails([
  { to: 'user1@example.com', templateName: 'weekly-digest', data: {...} },
  { to: 'user2@example.com', templateName: 'weekly-digest', data: {...} },
], {
  batchSize: 100,
  delayBetweenBatches: 1000,
  scheduleFor: '2024-01-20T09:00:00Z' // optional
});

// Get queue statistics
const stats = await emailService.getQueueStats();
// { enabled: true, waiting: 50, active: 5, completed: 1000, failed: 2 }

// Clear template cache (for development)
emailService.clearTemplateCache();

// Shutdown
await emailService.close();
```

### Unsubscribe Token Handling

```javascript
// Generate token
const token = emailService.generateUnsubscribeToken(userId, 'weekly-digest');

// Verify token (in unsubscribe route)
const data = emailService.verifyUnsubscribeToken(token);
// { userId: '123', emailType: 'weekly-digest', timestamp: 1705123456789 }
```

---

## Testing with MailHog

[MailHog](https://github.com/mailhog/MailHog) is a local email testing tool that captures outgoing emails.

### Setup

1. **Install MailHog:**

   ```bash
   # macOS
   brew install mailhog

   # Docker
   docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

   # Go install
   go install github.com/mailhog/MailHog@latest
   ```

2. **Start MailHog:**

   ```bash
   mailhog
   ```

3. **Configure Email Service for Testing:**

   Create a `.env.test` file:

   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=localhost
   SMTP_PORT=1025
   SMTP_SECURE=false
   ```

   Or modify the service temporarily:

   ```javascript
   // In emailService.js, add SMTP support
   if (config.provider === 'smtp') {
     const nodemailer = require('nodemailer');
     transporter = nodemailer.createTransport({
       host: process.env.SMTP_HOST || 'localhost',
       port: process.env.SMTP_PORT || 1025,
       secure: false,
     });
   }
   ```

4. **View Emails:**

   Open http://localhost:8025 in your browser to see captured emails.

### Testing Scripts

Create `scripts/test-emails.js`:

```javascript
const emailService = require('../backend/services/emailService');

async function testAllEmails() {
  await emailService.initialize();

  const testUser = {
    id: 'test-user-123',
    firstName: 'Test',
    email: 'test@localhost',
    isPremium: true,
  };

  // Test welcome email
  console.log('Sending welcome email...');
  await emailService.sendWelcomeEmail(testUser);

  // Test match notification
  console.log('Sending match notification...');
  await emailService.sendMatchNotification(testUser, {
    id: 'match-123',
    firstName: 'Sarah',
    age: 28,
    location: 'San Francisco, CA',
    compatibilityScore: 87,
    interests: ['hiking', 'photography'],
    distance: '5 miles',
  });

  // Test message notification
  console.log('Sending message notification...');
  await emailService.sendMessageNotification(
    testUser,
    { firstName: 'Sarah', age: 28, location: 'San Francisco' },
    { content: 'Hey! I noticed we both love hiking...', createdAt: new Date() },
    'conv-123'
  );

  // Test weekly digest
  console.log('Sending weekly digest...');
  await emailService.sendWeeklyDigest(testUser, {
    profileViews: 142,
    newLikes: 8,
    newMatches: 3,
    profileViewsChange: 23,
    profileViewsUp: true,
  });

  // Test password reset
  console.log('Sending password reset...');
  await emailService.sendPasswordResetEmail(testUser, 'reset-token-xyz', {
    ip: '192.168.1.1',
    device: 'Chrome on Windows',
    location: 'San Francisco, CA',
  });

  // Test verification
  console.log('Sending verification...');
  await emailService.sendVerificationEmail(
    testUser,
    '847293',
    'https://example.com/verify?token=xyz'
  );

  // Test subscription
  console.log('Sending subscription confirmation...');
  await emailService.sendSubscriptionConfirmation(
    testUser,
    {
      planName: 'Premium',
      billingCycle: 'Monthly',
      amount: 19.99,
      startDate: new Date(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      orderId: 'ORD-12345',
    },
    {
      name: 'Test User',
      email: 'test@localhost',
      cardBrand: 'VISA',
      cardLast4: '4242',
    }
  );

  console.log('All test emails sent! Check MailHog at http://localhost:8025');
  await emailService.close();
}

testAllEmails().catch(console.error);
```

Run with:

```bash
node scripts/test-emails.js
```

---

## Best Practices

### 1. Email Deliverability

- Always include a plain text version (handled automatically by the service)
- Keep email size under 100KB
- Use proper SPF, DKIM, and DMARC records
- Warm up new sending domains gradually
- Monitor bounce rates and complaints

### 2. Content Guidelines

- Keep subject lines under 50 characters
- Use preheader text effectively
- Include clear CTAs
- Personalize when possible
- Test across email clients

### 3. Performance

- Use the queue for non-urgent emails
- Batch bulk emails appropriately
- Cache compiled templates (done automatically)
- Use CDN for images

### 4. Legal Compliance

- Always include unsubscribe links (CAN-SPAM, GDPR)
- Include physical mailing address
- Honor unsubscribe requests promptly
- Keep consent records

---

## Troubleshooting

### Common Issues

**Emails not sending:**
- Check API keys are correct
- Verify sender domain is authenticated
- Check rate limits haven't been exceeded
- Review provider dashboard for errors

**Templates not rendering:**
- Clear template cache: `emailService.clearTemplateCache()`
- Check for syntax errors in Handlebars
- Verify all required variables are provided

**Styling issues in email clients:**
- Test with Litmus or Email on Acid
- Inline critical CSS
- Use tables for layout (already done in templates)
- Avoid CSS Grid/Flexbox

**Dark mode issues:**
- Use `prefers-color-scheme` media query
- Test in Apple Mail and Outlook
- Provide fallback colors

### Debugging

Enable debug logging:

```javascript
// In emailService.js
const DEBUG = process.env.EMAIL_DEBUG === 'true';

function log(...args) {
  if (DEBUG) console.log('[EmailService]', ...args);
}
```

### Support

For issues with:
- **SendGrid**: https://support.sendgrid.com
- **Mailgun**: https://help.mailgun.com
- **Template issues**: Check Handlebars documentation

---

## Changelog

### v1.0.0 (Initial Release)
- Base template with dark mode support
- 7 email templates (welcome, match, message, digest, reset, verify, subscription)
- SendGrid and Mailgun integration
- Queue support with Bull
- Unsubscribe token handling
- Rate limiting
