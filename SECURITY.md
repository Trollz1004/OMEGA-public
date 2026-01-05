# Dating Platform - Security Best Practices

Comprehensive security guide for deploying and operating the Dating Platform safely.

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [Infrastructure Security](#infrastructure-security)
5. [Application Security](#application-security)
6. [API Security](#api-security)
7. [Content Security](#content-security)
8. [User Privacy](#user-privacy)
9. [Incident Response](#incident-response)
10. [Security Checklist](#security-checklist)

---

## Security Overview

Dating platforms handle extremely sensitive personal data including:
- Personal identification information
- Location data
- Private messages
- Photos
- Payment information
- Relationship preferences

This guide outlines security measures to protect user data and maintain platform integrity.

### Security Principles

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimal access rights
3. **Security by Design** - Built into the architecture
4. **Continuous Monitoring** - Detect and respond to threats
5. **Regular Updates** - Keep systems patched

---

## Authentication & Authorization

### Password Requirements

```javascript
// Minimum password requirements
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventPersonalInfo: true
};
```

### Password Hashing

```javascript
const bcrypt = require('bcryptjs');

// Hash password with bcrypt (cost factor 12)
const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

// Verify password
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
```

### JWT Configuration

```javascript
// JWT settings
const jwtConfig = {
  algorithm: 'RS256',        // Use RSA for production
  expiresIn: '1h',           // Short-lived access tokens
  refreshExpiresIn: '7d',    // Refresh tokens
  issuer: 'dating-platform',
  audience: 'dating-platform-api'
};
```

### Session Management

- Session timeout: 30 minutes of inactivity
- Single session per device (optional)
- Session invalidation on password change
- Secure session storage (Redis with encryption)

### Multi-Factor Authentication

Recommended for:
- Admin accounts (required)
- Users with premium subscriptions
- Account recovery

Implementation options:
- TOTP (Google Authenticator, Authy)
- SMS verification (fallback only)
- Email verification codes

---

## Data Protection

### Encryption at Rest

```yaml
# PostgreSQL encryption
database:
  ssl: require
  encryption: AES-256

# S3 bucket encryption
s3:
  serverSideEncryption: AES256
  bucketKeyEnabled: true
```

### Encryption in Transit

- TLS 1.3 for all connections
- HSTS enabled
- Certificate pinning for mobile apps

### Sensitive Data Handling

```javascript
// Fields requiring encryption
const sensitiveFields = [
  'dateOfBirth',
  'phoneNumber',
  'location',
  'messages',
  'paymentInfo'
];

// Encrypt before storage
const encryptField = (data, field) => {
  if (sensitiveFields.includes(field)) {
    return encrypt(data);
  }
  return data;
};
```

### Data Retention

| Data Type | Retention Period | Deletion Method |
|-----------|-----------------|-----------------|
| User accounts | Until deletion request | Soft delete + 30 day purge |
| Messages | 2 years or deletion | Hard delete |
| Photos | Until user removes | Immediate delete |
| Logs | 90 days | Automatic purge |
| Payment records | 7 years (legal) | Archive only |

---

## Infrastructure Security

### Server Hardening

```bash
# Disable root SSH login
PermitRootLogin no

# Use SSH keys only
PasswordAuthentication no

# Limit SSH access
AllowUsers deploy_user

# Enable fail2ban
apt install fail2ban
systemctl enable fail2ban
```

### Firewall Configuration

```bash
# UFW firewall rules
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # SSH (restrict to IP)
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw enable
```

### Container Security

```yaml
# Docker security options
services:
  backend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    user: "1000:1000"
    cap_drop:
      - ALL
```

### Network Segmentation

```
Internet
    |
    v
[Load Balancer] --> [WAF]
    |
    v
[Frontend Tier]
    |
    v
[API Tier] <--> [Redis]
    |
    v
[Database Tier] (Private Subnet)
```

---

## Application Security

### Input Validation

```javascript
const Joi = require('joi');

// Profile update validation
const profileSchema = Joi.object({
  displayName: Joi.string().min(2).max(50).required(),
  bio: Joi.string().max(500).optional(),
  dateOfBirth: Joi.date().max('now').min('1900-01-01').required(),
  // ... more fields
});

// Validate all inputs
const validateInput = (schema, data) => {
  const { error, value } = schema.validate(data, { stripUnknown: true });
  if (error) throw new ValidationError(error.details);
  return value;
};
```

### SQL Injection Prevention

```javascript
// Use Prisma ORM - prevents SQL injection by default
const user = await prisma.user.findUnique({
  where: { email: userInput }  // Automatically parameterized
});

// Never concatenate user input into queries
// BAD: `SELECT * FROM users WHERE email = '${email}'`
```

### XSS Prevention

```javascript
// Sanitize HTML content
const sanitizeHtml = require('sanitize-html');

const sanitizeMessage = (content) => {
  return sanitizeHtml(content, {
    allowedTags: [],           // No HTML in messages
    allowedAttributes: {},
    disallowedTagsMode: 'escape'
  });
};
```

### CSRF Protection

```javascript
const csrf = require('csurf');
app.use(csrf({ cookie: true }));

// Include token in forms
<input type="hidden" name="_csrf" value="{{csrfToken}}">
```

### Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.squareup.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

---

## API Security

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests'
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                     // 5 failed attempts
  skipSuccessfulRequests: true
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

### API Authentication

```javascript
// JWT middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

### CORS Configuration

```javascript
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
```

---

## Content Security

### Photo Moderation

```javascript
// AI-powered photo scanning
const moderatePhoto = async (photoUrl) => {
  // Google Cloud Vision API
  const [result] = await visionClient.safeSearchDetection(photoUrl);
  const safe = result.safeSearchAnnotation;

  // Reject unsafe content
  if (safe.adult === 'LIKELY' || safe.adult === 'VERY_LIKELY') {
    return { approved: false, reason: 'adult_content' };
  }
  if (safe.violence === 'LIKELY' || safe.violence === 'VERY_LIKELY') {
    return { approved: false, reason: 'violence' };
  }

  return { approved: true };
};
```

### Message Moderation

```javascript
// Content filtering
const moderateMessage = async (content) => {
  // Check for prohibited content
  const checks = [
    checkSpam(content),
    checkProfanity(content),
    checkPhoneNumbers(content),
    checkExternalLinks(content),
    checkSolicitation(content)
  ];

  const results = await Promise.all(checks);
  const flagged = results.filter(r => r.flagged);

  if (flagged.length > 0) {
    return { approved: false, reasons: flagged };
  }

  return { approved: true };
};
```

### Report Handling

1. User reports content
2. Automated initial review
3. Queue for human moderation (if needed)
4. Action taken (warn, suspend, ban)
5. Appeal process available

---

## User Privacy

### Data Access Controls

```javascript
// Users can only access their own data
const authorizeDataAccess = (req, res, next) => {
  const requestedUserId = req.params.userId;
  const authenticatedUserId = req.user.id;

  if (requestedUserId !== authenticatedUserId) {
    // Allow admins
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }
  }
  next();
};
```

### Location Privacy

```javascript
// Fuzzy location display
const getFuzzyLocation = (lat, lng) => {
  // Add random offset (up to 1km)
  const offset = 0.01;  // ~1km
  return {
    lat: lat + (Math.random() - 0.5) * offset,
    lng: lng + (Math.random() - 0.5) * offset
  };
};

// Incognito mode
const hideFromSearch = async (userId) => {
  await prisma.profile.update({
    where: { userId },
    data: { isVisible: false }
  });
};
```

### GDPR Compliance

```javascript
// Data export
const exportUserData = async (userId) => {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      messages: true,
      matches: true,
      // ... all related data
    }
  });
  return JSON.stringify(userData);
};

// Right to be forgotten
const deleteUserData = async (userId) => {
  // Anonymize data that must be retained
  await prisma.message.updateMany({
    where: { senderId: userId },
    data: { senderId: 'DELETED_USER' }
  });

  // Delete user and cascade
  await prisma.user.delete({
    where: { id: userId }
  });
};
```

---

## Incident Response

### Incident Types

| Severity | Examples | Response Time |
|----------|----------|---------------|
| Critical | Data breach, system compromise | Immediate |
| High | Security vulnerability, abuse | < 4 hours |
| Medium | Suspicious activity, policy violation | < 24 hours |
| Low | Minor issues, questions | < 48 hours |

### Response Plan

1. **Detect** - Automated monitoring + user reports
2. **Contain** - Isolate affected systems
3. **Investigate** - Determine scope and cause
4. **Remediate** - Fix vulnerability, restore service
5. **Communicate** - Notify affected users (if required)
6. **Review** - Post-incident analysis

### Security Contacts

- Security Team: security@your-domain.com
- Bug Bounty: bounty@your-domain.com
- Legal: legal@your-domain.com

---

## Security Checklist

### Pre-Launch

- [ ] All secrets in environment variables (not code)
- [ ] SSL/TLS configured and tested
- [ ] Database not publicly accessible
- [ ] Redis requires authentication
- [ ] Admin accounts have MFA enabled
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] Security headers enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection enabled
- [ ] Photo moderation active
- [ ] Message moderation active
- [ ] Age verification implemented
- [ ] Backup system tested
- [ ] Logging configured
- [ ] Monitoring alerts set up
- [ ] Incident response plan documented
- [ ] Privacy policy reviewed
- [ ] Terms of service reviewed

### Ongoing

- [ ] Weekly dependency updates
- [ ] Monthly security scans
- [ ] Quarterly penetration testing
- [ ] Annual security audit
- [ ] Regular backup testing
- [ ] Access review (quarterly)
- [ ] Log review (weekly)
- [ ] Training for new team members

### Monitoring

- [ ] Failed login attempts
- [ ] Unusual API patterns
- [ ] Large data exports
- [ ] Admin actions
- [ ] Payment anomalies
- [ ] Server resource usage
- [ ] Error rates
- [ ] Response times

---

## Security Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- NIST Cybersecurity: https://www.nist.gov/cyberframework
- CIS Controls: https://www.cisecurity.org/controls/
- Node.js Security: https://nodejs.org/en/docs/guides/security/

---

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. Email security@your-domain.com
2. Include detailed description
3. Provide reproduction steps
4. Do not disclose publicly until fixed

We commit to:
- Acknowledge within 24 hours
- Provide updates every 48 hours
- Credit researchers (if desired)
