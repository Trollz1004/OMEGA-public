# System Architecture

## FOR THE KIDS Platform - Technical Architecture Overview

**Version**: Gospel V1.4.1 SURVIVAL MODE
**Last Updated**: 2026-01-14

---

## High-Level Architecture

```
                                    ┌─────────────────────────────────────┐
                                    │           USER INTERFACES           │
                                    ├─────────────────────────────────────┤
                                    │  Web Dashboard  │  Mobile App (TBD) │
                                    └────────┬────────┴────────┬──────────┘
                                             │                 │
                                             ▼                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY (Azure APIM)                      │
│  • Rate Limiting  • Authentication  • Request Routing  • DDoS Protection   │
└────────────────────────────────────────────────────────────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
         ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
         │   Payment API    │    │  Transparency    │    │   Admin API      │
         │ (Azure Functions)│    │      API         │    │ (Azure Functions)│
         └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
                  │                       │                        │
                  ▼                       ▼                        ▼
         ┌──────────────────────────────────────────────────────────────────┐
         │                        SERVICE LAYER                             │
         │  • Webhook Processing  • Revenue Routing  • Event Emission       │
         └──────────────────────────────────────────────────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
                    ▼                                         ▼
         ┌──────────────────┐                      ┌──────────────────┐
         │   Data Store     │                      │   Blockchain     │
         │  (Azure SQL/     │                      │  (Base Mainnet)  │
         │   Cosmos DB)     │                      │                  │
         └──────────────────┘                      └──────────────────┘
```

---

## Infrastructure Components

### Fleet Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LOCAL NETWORK (192.168.0.x)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────┐     ┌─────────────────┐                      │
│   │     T5500       │     │      9020       │                      │
│   │  192.168.0.101  │     │  192.168.0.103  │                      │
│   │                 │     │                 │                      │
│   │ Command Center  │────▶│ Database Node   │                      │
│   │ • Development   │     │ • PostgreSQL    │                      │
│   │ • Deployment    │     │ • Redis Cache   │                      │
│   │ • Monitoring    │     │ • Backups       │                      │
│   └─────────────────┘     └─────────────────┘                      │
│                                                                     │
│   Note: Sabertooth (192.168.0.104) - OUT OF SCOPE                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Cloud Infrastructure (Azure)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AZURE RESOURCE GROUP                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Key Vault  │  │  Function   │  │ Static Web  │                 │
│  │             │  │    App      │  │    App      │                 │
│  │ • Secrets   │  │ • APIs      │  │ • Frontend  │                 │
│  │ • Keys      │  │ • Webhooks  │  │ • Dashboard │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   SQL DB    │  │    CDN      │  │  App Insights│                │
│  │             │  │             │  │              │                │
│  │ • Users     │  │ • Caching   │  │ • Logging    │                │
│  │ • Txns      │  │ • Global    │  │ • Metrics    │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Smart Contract Architecture

### Contract Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SMART CONTRACT ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    ┌───────────────────────┐                       │
│                    │    ProxyAdmin         │                       │
│                    │  (Upgrade Control)    │                       │
│                    └───────────┬───────────┘                       │
│                                │                                    │
│            ┌───────────────────┴───────────────────┐               │
│            │                                       │                │
│            ▼                                       ▼                │
│  ┌─────────────────────┐             ┌─────────────────────┐       │
│  │  CharityRouter100   │             │ DatingRevenueRouter │       │
│  │    (IMMUTABLE)      │             │   (DAO Governed)    │       │
│  ├─────────────────────┤             ├─────────────────────┤       │
│  │ • 100% to charity   │             │ • Survival: 100% F  │       │
│  │ • No admin functions│             │ • Growth: 50/30/20  │       │
│  │ • Permanent rules   │             │ • Mature: 10/60/30  │       │
│  └─────────────────────┘             └─────────────────────┘       │
│                                                                     │
│  Contract Address: 0x9855B75061D4c841791382998f0CE8B2BCC965A4      │
│  Network: Base Mainnet                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Contract Flow

```
Payment Received
       │
       ▼
┌──────────────┐
│ Identify     │
│ Source       │
└──────┬───────┘
       │
       ├─────────────────────────────┐
       │                             │
       ▼                             ▼
┌──────────────┐            ┌──────────────┐
│ AI Platform  │            │  Dating App  │
└──────┬───────┘            └──────┬───────┘
       │                           │
       ▼                           ▼
┌──────────────┐            ┌──────────────┐
│ Charity      │            │ Revenue      │
│ Router100    │            │ Router       │
└──────┬───────┘            └──────┬───────┘
       │                           │
       ▼                           ▼
┌──────────────┐            ┌──────────────┐
│ 100% Charity │            │ Split per    │
│              │            │ Current Mode │
└──────────────┘            └──────────────┘
```

---

## Data Flow Architecture

### Payment Processing Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Customer│───▶│ Stripe/ │───▶│ Webhook │───▶│ Revenue │───▶│Blockchain│
│         │    │Coinbase │    │ Handler │    │ Router  │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │              │              │              │
                    ▼              ▼              ▼              ▼
               Payment        Signature      Route to       Distribution
               Initiated      Validated      Contract       Event Emitted
```

### Transparency Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Blockchain │───▶│   Indexer   │───▶│  Database   │───▶│  Dashboard  │
│   Events    │    │  (Listener) │    │   Cache     │    │    API      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                         │                  │                  │
                         ▼                  ▼                  ▼
                    Event           Aggregated          Real-time
                    Parsing         Statistics          Updates
```

---

## Security Architecture

### Defense Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Layer 1: Edge                                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  • Azure Front Door  • WAF  • DDoS Protection  • Geo-blocking │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Layer 2: Application                                               │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  • Rate Limiting  • Input Validation  • CORS  • CSP Headers   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Layer 3: Authentication                                            │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  • JWT Validation  • Webhook Signatures  • API Keys           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Layer 4: Data                                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  • Encryption at Rest  • TLS in Transit  • Key Vault          │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Layer 5: Smart Contract                                            │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  • Immutable Code  • Access Control  • Reentrancy Guards      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Secret Management

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SECRET MANAGEMENT                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Local Development          Azure Key Vault          Applications  │
│   ┌─────────────┐           ┌─────────────┐          ┌───────────┐ │
│   │ .env.local  │──────────▶│  Key Vault  │─────────▶│ Functions │ │
│   │ (gitignored)│   sync    │  (Encrypted)│  inject  │   API     │ │
│   └─────────────┘           └─────────────┘          └───────────┘ │
│                                    │                               │
│   Credential Paths:               │                               │
│   • C:\Keys\MASTER-PLATFORM-ENV.env (local reference)             │
│   • C:\Users\t55o\SecureSecrets\ (secure backup)                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

### Monorepo Layout

```
FOR-THE-KIDS/
├── contracts/                 # Smart contracts (Solidity)
│   ├── CharityRouter100.sol
│   ├── DatingRevenueRouter.sol
│   └── test/
├── api/                       # Azure Functions
│   ├── webhooks/
│   ├── transparency/
│   └── admin/
├── frontend/                  # React dashboard
│   ├── src/
│   ├── public/
│   └── tests/
├── infra/                     # Infrastructure as Code
│   ├── terraform/
│   ├── bicep/
│   └── scripts/
├── docs/                      # Documentation
│   ├── README.md
│   ├── Architecture.md
│   ├── Security-Checklist.md
│   └── Runbooks/
├── marketing/                 # Marketing materials
│   └── copy/
└── scripts/                   # Utility scripts
    ├── deploy.sh
    └── test.sh
```

### Repository Distribution

| Repository | Organization | Purpose |
|------------|--------------|---------|
| AiCollabForTheKids | Ai-Solutions-Store | 100% Charity Platform |
| OPUStrustForTheKidsPlatform | Trollz1004 | DAO/Founder Operations |

---

## Deployment Architecture

### CI/CD Pipeline

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Push   │───▶│  Build  │───▶│  Test   │───▶│ Security│───▶│ Deploy  │
│         │    │         │    │         │    │  Scan   │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │              │              │              │
                    ▼              ▼              ▼              ▼
               Compile        Unit Tests     Slither       Staging/
               Contracts      Integration    npm audit     Production
```

### Environment Progression

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Development │───▶│   Staging   │───▶│ Production  │
│             │    │             │    │             │
│ Base Sepolia│    │ Base Sepolia│    │ Base Mainnet│
│ Dev KV      │    │ Staging KV  │    │ Prod KV     │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## Monitoring and Observability

### Metrics Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY STACK                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│   │ App Insights│  │   Grafana   │  │  PagerDuty  │                │
│   │             │  │             │  │             │                │
│   │ • Traces    │  │ • Dashboards│  │ • Alerts    │                │
│   │ • Logs      │  │ • Metrics   │  │ • On-Call   │                │
│   │ • Metrics   │  │ • Blockchain│  │ • Escalation│                │
│   └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Metrics

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Transaction Success Rate | Blockchain | < 99% |
| API Latency P95 | App Insights | > 500ms |
| Error Rate | App Insights | > 1% |
| Charity Distribution Delay | Contract Events | > 1 hour |

---

## Disaster Recovery

### Recovery Objectives

| Component | RTO | RPO |
|-----------|-----|-----|
| Smart Contracts | N/A (immutable) | N/A |
| API | 1 hour | 15 minutes |
| Database | 4 hours | 1 hour |
| Frontend | 30 minutes | N/A |

### Backup Strategy

- **Database**: Point-in-time restore, 7-day retention
- **Key Vault**: Soft delete enabled, 90-day retention
- **Code**: Git repository, multi-region mirrors

---

*Architecture designed for transparency, built for permanence.*
