# FOR THE KIDS Platform

## Gospel V1.4.1 SURVIVAL MODE

A blockchain-powered charitable giving platform that ensures 100% of AI platform revenue goes directly to verified pediatric charities.

---

## Overview

FOR THE KIDS is built on a foundation of radical transparency. Every transaction is recorded on-chain, every distribution is auditable, and the smart contracts are immutable - ensuring that charitable allocations can never be changed.

### Revenue Model

| Platform | Allocation | Status |
|----------|------------|--------|
| AI Solutions Store | 100% to verified pediatric charities | Permanent (Immutable) |
| Dating App | 100% to founder | Temporary (Survival Mode) |

> **Survival Mode**: Dating app revenue temporarily supports founder operations. Once sustainable, governance transitions to DAO with founder allocation capped at 10%.

---

## Quick Start

### Prerequisites

- Node.js 18+
- Git
- Access to Base Mainnet RPC
- Azure account (for Key Vault and deployments)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ai-Solutions-Store/AiCollabForTheKids.git
cd AiCollabForTheKids

# Install dependencies
npm install

# Configure environment (see docs/Runbooks/env-promotion.md)
cp .env.example .env.local

# Run tests
npm test

# Deploy (see docs/Runbooks/deploy.md)
npm run deploy
```

---

## Architecture

```
+------------------+     +------------------+     +------------------+
|   AI Platforms   |     |    Dating App    |     |   Web Frontend   |
|  (100% Charity)  |     | (Survival Mode)  |     |   (Dashboard)    |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+--------+---------+     +--------+---------+     +--------+---------+
| CharityRouter100 |     |DatingRevenueRouter|    |   API Gateway    |
|   (Immutable)    |     |   (DAO Governed) |     |   (Azure APIM)   |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         +------------------------+------------------------+
                                  |
                                  v
                    +-------------+-------------+
                    |        Base Mainnet       |
                    |  Contract: 0x9855B750... |
                    +---------------------------+
```

### Core Components

| Component | Description | Location |
|-----------|-------------|----------|
| Smart Contracts | Solidity contracts for revenue routing | `/contracts` |
| API Layer | Azure Functions for webhook processing | `/api` |
| Frontend | React dashboard for transparency reporting | `/frontend` |
| Infrastructure | Terraform/Bicep for Azure resources | `/infra` |

---

## Fleet Architecture

| Node | IP Address | Role |
|------|------------|------|
| T5500 | 192.168.0.101 | Command Center |
| 9020 | 192.168.0.103 | Database Node |

---

## Smart Contract

**Address**: `0x9855B75061D4c841791382998f0CE8B2BCC965A4`
**Network**: Base Mainnet
**Status**: Deployed and Verified

---

## Documentation

- [Architecture Overview](./Architecture.md)
- [Security Checklist](./Security-Checklist.md)
- [Deployment Runbook](./Runbooks/deploy.md)
- [Rollback Procedures](./Runbooks/rollback.md)
- [Key Rotation Guide](./Runbooks/key-rotation.md)
- [Environment Promotion](./Runbooks/env-promotion.md)

---

## Repositories

| Repository | Purpose | Organization |
|------------|---------|--------------|
| AiCollabForTheKids | 100% Charity Platform | Ai-Solutions-Store |
| OPUStrustForTheKidsPlatform | DAO/Founder Operations | Trollz1004 |

---

## Contributing

We welcome contributions that further our mission. Please read our contributing guidelines and ensure all PRs include appropriate tests.

---

## License

See LICENSE file for details.

---

*"Until no kid is in need"*
