# Dating Platform - Compliance Guide

Regulatory compliance requirements for operating a dating platform, including MCC 7273 compliance, age verification, content moderation, and data protection regulations.

## Table of Contents

1. [Regulatory Overview](#regulatory-overview)
2. [MCC 7273 Compliance](#mcc-7273-compliance)
3. [Age Verification](#age-verification)
4. [Content Moderation](#content-moderation)
5. [FOSTA-SESTA Compliance](#fosta-sesta-compliance)
6. [Data Protection (GDPR/CCPA)](#data-protection-gdprccpa)
7. [Payment Processing](#payment-processing)
8. [Terms of Service Requirements](#terms-of-service-requirements)
9. [Record Keeping](#record-keeping)
10. [Compliance Checklist](#compliance-checklist)

---

## Regulatory Overview

Dating platforms are subject to multiple regulatory frameworks:

| Regulation | Jurisdiction | Key Requirements |
|------------|-------------|------------------|
| MCC 7273 | Payment Networks | High-risk merchant classification |
| FOSTA-SESTA | United States | Anti-trafficking provisions |
| GDPR | European Union | Data protection |
| CCPA | California | Consumer privacy rights |
| COPPA | United States | Children's privacy (under 13) |
| Local Dating Laws | Various | Age requirements, licensing |

### Consequences of Non-Compliance

- Payment processing termination
- Legal liability and fines
- Platform removal from app stores
- Criminal prosecution (trafficking laws)
- Reputational damage

---

## MCC 7273 Compliance

MCC 7273 (Merchant Category Code for Dating and Escort Services) is a high-risk classification that requires enhanced due diligence.

### Requirements

1. **Business Documentation**
   - Valid business registration
   - Government-issued ID of owners
   - Physical business address
   - Bank account in company name

2. **Website Requirements**
   - Clear description of services
   - Age restriction notice
   - Terms of service
   - Privacy policy
   - Contact information
   - Refund/cancellation policy

3. **Content Standards**
   - No explicit sexual content
   - No escort/prostitution services
   - No human trafficking facilitation
   - Active content moderation

### Implementation

```javascript
// Age gate on landing page
const AgeGate = () => (
  <div className="age-gate">
    <h2>Age Verification Required</h2>
    <p>You must be 18 years or older to use this service.</p>
    <button onClick={confirmAge}>I am 18 or older</button>
    <button onClick={denyAccess}>I am under 18</button>
  </div>
);
```

### Required Disclosures

Display prominently:
```html
<footer>
  <p>This platform is intended for adults 18 years of age or older.</p>
  <p>By using this service, you confirm that you are of legal age.</p>
  <a href="/terms">Terms of Service</a> |
  <a href="/privacy">Privacy Policy</a> |
  <a href="/contact">Contact Us</a>
</footer>
```

---

## Age Verification

### Minimum Requirements

All users must be verified as 18+ before:
- Creating a profile
- Viewing other profiles
- Sending messages
- Making payments

### Verification Methods

#### Tier 1: Self-Declaration (Minimum)
```javascript
// Basic age declaration
const ageDeclaration = {
  statement: "I confirm I am 18 years of age or older",
  timestamp: new Date(),
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
};
```

#### Tier 2: Date of Birth Verification
```javascript
// Calculate age from DOB
const verifyAge = (dateOfBirth) => {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 18;
};
```

#### Tier 3: ID Verification (Recommended)
```javascript
// Integration with verification provider (e.g., Onfido, Jumio)
const verifyIdentity = async (userId, documentImage, selfieImage) => {
  const verification = await onfidoClient.createCheck({
    applicantId: userId,
    reportNames: ['document', 'facial_similarity_photo']
  });

  return verification.result === 'clear';
};
```

### Record Keeping

```javascript
// Store verification records
const AgeVerification = {
  userId: String,
  method: 'declaration' | 'dob' | 'id_document',
  verifiedAt: Date,
  expiresAt: Date,  // Re-verify periodically
  documentType: String,  // If ID verified
  verificationProvider: String,
  verificationId: String
};
```

---

## Content Moderation

### Prohibited Content

1. **Illegal Content**
   - Child exploitation material (CSAM)
   - Human trafficking
   - Prostitution/escort services
   - Illegal drugs
   - Weapons

2. **Platform Policy Violations**
   - Explicit nudity
   - Violence or threats
   - Harassment or hate speech
   - Spam or scams
   - Fake profiles
   - Solicitation

### Moderation System

```javascript
// Automated content scanning
const contentModerationPipeline = async (content, type) => {
  const checks = [];

  if (type === 'photo') {
    checks.push(
      scanForNudity(content),
      scanForViolence(content),
      scanForMinors(content),
      scanForFakeImages(content)
    );
  }

  if (type === 'text') {
    checks.push(
      checkProfanity(content),
      checkContactInfo(content),
      checkSolicitation(content),
      checkThreats(content)
    );
  }

  const results = await Promise.all(checks);

  // Flag for human review if any check fails
  if (results.some(r => r.flagged)) {
    await queueForReview(content, type, results);
    return { approved: false, pending: true };
  }

  return { approved: true };
};
```

### Human Review Process

1. Content flagged by AI or user report
2. Added to moderation queue
3. Reviewed by trained moderator
4. Action taken:
   - Approve content
   - Remove content
   - Warn user
   - Suspend user
   - Ban user
   - Report to authorities (if illegal)

### Response Times

| Content Type | Priority | Response Time |
|--------------|----------|---------------|
| CSAM/Trafficking | Critical | Immediate + Report |
| Violence/Threats | High | < 1 hour |
| Nudity/Explicit | Medium | < 4 hours |
| Harassment | Medium | < 24 hours |
| Policy Violation | Low | < 48 hours |

---

## FOSTA-SESTA Compliance

The Allow States and Victims to Fight Online Sex Trafficking Act (FOSTA) and Stop Enabling Sex Traffickers Act (SESTA) impose liability on platforms that knowingly facilitate sex trafficking.

### Requirements

1. **Proactive Monitoring**
   - Monitor for trafficking indicators
   - Report suspected trafficking
   - Cooperate with law enforcement

2. **Prohibited Activities**
   - No escort services
   - No sugar dating
   - No paid companionship
   - No commercial sex

3. **Reporting Obligations**
   - Report CSAM to NCMEC
   - Cooperate with law enforcement
   - Preserve evidence when requested

### Implementation

```javascript
// Trafficking indicator detection
const traffickingIndicators = [
  /escort/i,
  /sugar\s*(daddy|baby|momma)/i,
  /paid\s*companion/i,
  /generous\s*gentleman/i,
  /travel\s*arrangement/i,
  // Add more patterns
];

const checkForTrafficking = (content) => {
  for (const pattern of traffickingIndicators) {
    if (pattern.test(content)) {
      return {
        flagged: true,
        pattern: pattern.toString(),
        action: 'review_and_report'
      };
    }
  }
  return { flagged: false };
};
```

### NCMEC Reporting

```javascript
// Report to National Center for Missing & Exploited Children
const reportToNCMEC = async (report) => {
  const ncmecReport = {
    reporterType: 'ESP',  // Electronic Service Provider
    incidentType: report.type,
    uploadedImages: report.evidence,
    reporterInfo: {
      companyName: 'Your Company',
      contactName: 'Compliance Officer',
      contactEmail: 'compliance@yourcompany.com'
    },
    // ... additional required fields
  };

  // Submit via NCMEC CyberTipline API
  await ncmecClient.submit(ncmecReport);

  // Preserve internally
  await preserveEvidence(report);
};
```

---

## Data Protection (GDPR/CCPA)

### User Rights

| Right | GDPR | CCPA | Implementation |
|-------|------|------|----------------|
| Access | Yes | Yes | Data export feature |
| Deletion | Yes | Yes | Account deletion |
| Portability | Yes | No | Data download |
| Correction | Yes | No | Profile editing |
| Opt-out of Sale | No | Yes | Privacy settings |

### Privacy Notice Requirements

```html
<!-- Required disclosures -->
<div class="privacy-notice">
  <h2>How We Use Your Data</h2>

  <h3>Data Collection</h3>
  <ul>
    <li>Profile information you provide</li>
    <li>Photos you upload</li>
    <li>Messages you send</li>
    <li>Location data (with permission)</li>
    <li>Usage analytics</li>
  </ul>

  <h3>Purpose of Processing</h3>
  <ul>
    <li>Matching with other users</li>
    <li>Service improvement</li>
    <li>Safety and security</li>
    <li>Legal compliance</li>
  </ul>

  <h3>Your Rights</h3>
  <ul>
    <li>Access your data</li>
    <li>Request deletion</li>
    <li>Export your data</li>
    <li>Opt-out of marketing</li>
  </ul>
</div>
```

### Data Subject Requests

```javascript
// Handle data subject access requests
const handleDSAR = async (userId, requestType) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  switch (requestType) {
    case 'access':
      return await exportAllUserData(userId);

    case 'deletion':
      await anonymizeData(userId);
      await deleteUser(userId);
      return { success: true };

    case 'portability':
      return await exportPortableData(userId);

    case 'optout':
      await updatePrivacySettings(userId, { noSale: true });
      return { success: true };
  }
};
```

### Cookie Consent

```javascript
// Cookie consent banner
const CookieConsent = () => (
  <div className="cookie-banner">
    <p>We use cookies to improve your experience.</p>
    <button onClick={() => acceptCookies('all')}>Accept All</button>
    <button onClick={() => acceptCookies('necessary')}>Necessary Only</button>
    <button onClick={showCookieSettings}>Manage Preferences</button>
  </div>
);
```

---

## Payment Processing

### PCI DSS Compliance

- Never store full card numbers
- Use tokenization (Square handles this)
- Encrypt sensitive data in transit
- Regular security assessments

### Refund Policy

Required disclosures:
```
REFUND POLICY

Subscriptions may be canceled at any time through your account settings.

- Cancellation takes effect at the end of the current billing period
- No partial refunds for unused time
- Refunds may be requested within 14 days of initial purchase
- Premium features purchased separately are non-refundable

For refund requests, contact support@yourplatform.com
```

### Billing Descriptors

Clear billing descriptors to prevent chargebacks:
```
Descriptor: YOURPLATFORM*PREMIUM
```

---

## Terms of Service Requirements

### Essential Sections

1. **Eligibility**
   - Age requirement (18+)
   - Legal capacity
   - Geographic restrictions

2. **User Conduct**
   - Prohibited activities
   - Content standards
   - Consequences of violations

3. **Account Termination**
   - Platform rights
   - User rights
   - Data handling on termination

4. **Disclaimers**
   - User interactions
   - Third-party content
   - Service availability

5. **Dispute Resolution**
   - Arbitration clause
   - Class action waiver
   - Jurisdiction

### Sample Clauses

```
ELIGIBILITY

You must be at least 18 years of age to use this Service. By using
the Service, you represent and warrant that:
(a) you are at least 18 years old;
(b) you have the legal capacity to enter into these Terms;
(c) you are not a convicted sex offender;
(d) you will not use the Service for any unlawful purpose.

USER CONDUCT

You agree not to:
- Post false, misleading, or deceptive content
- Harass, threaten, or abuse other users
- Solicit money or commercial services
- Attempt to obtain personal information from other users
- Post sexually explicit content
- Use the Service for commercial purposes without authorization
```

---

## Record Keeping

### Required Records

| Record Type | Retention Period | Purpose |
|-------------|-----------------|---------|
| User registrations | Duration of account + 2 years | Identity verification |
| Age verifications | 7 years | Legal compliance |
| Content moderation | 3 years | Policy enforcement |
| Payment records | 7 years | Tax/legal requirements |
| CSAM reports | Per NCMEC requirements | Law enforcement |
| User communications | 2 years | Dispute resolution |

### Logging Requirements

```javascript
// Audit log for compliance
const logComplianceEvent = async (event) => {
  await prisma.complianceLog.create({
    data: {
      eventType: event.type,
      userId: event.userId,
      details: event.details,
      timestamp: new Date(),
      ipAddress: event.ip,
      retentionDate: calculateRetention(event.type)
    }
  });
};
```

---

## Compliance Checklist

### Pre-Launch

- [ ] MCC 7273 approval obtained
- [ ] Age verification implemented
- [ ] Content moderation system active
- [ ] Terms of Service drafted and reviewed
- [ ] Privacy Policy drafted and reviewed
- [ ] Cookie consent mechanism
- [ ] Refund policy published
- [ ] Contact information visible
- [ ] NCMEC reporting capability
- [ ] Data export functionality
- [ ] Account deletion functionality

### Ongoing

- [ ] Monitor moderation queue daily
- [ ] Review flagged content within SLA
- [ ] Process data subject requests within 30 days
- [ ] Update policies as needed
- [ ] Train new moderators
- [ ] Conduct quarterly audits
- [ ] Review and update age verification
- [ ] Test data export/deletion
- [ ] Update compliance training

### Annual

- [ ] Full compliance audit
- [ ] Legal review of terms
- [ ] Privacy policy update
- [ ] Staff training refresh
- [ ] Third-party security assessment
- [ ] Record retention review
- [ ] Policy effectiveness review

---

## Resources

- NCMEC CyberTipline: https://www.missingkids.org/gethelpnow/cybertipline
- GDPR Official Text: https://gdpr.eu/
- CCPA Information: https://oag.ca.gov/privacy/ccpa
- PCI DSS: https://www.pcisecuritystandards.org/
- FOSTA-SESTA: https://www.congress.gov/bill/115th-congress/house-bill/1865

---

## Contacts

- Compliance Officer: compliance@yourplatform.com
- Legal Team: legal@yourplatform.com
- Privacy Inquiries: privacy@yourplatform.com
- Law Enforcement: legal@yourplatform.com

For emergencies involving child safety, contact NCMEC immediately:
1-800-THE-LOST (1-800-843-5678)
