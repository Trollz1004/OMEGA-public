# Governance Migration Runbook
## Gospel V1.4.1 SURVIVAL MODE

**Mission:** Until no kid is in need

---

## Overview

This document provides the complete runbook for transitioning the Dating App revenue router from Survival Mode to Permanent Mode. This is a one-way journey with irreversible final steps.

### Revenue Model Summary

| Platform | Allocation | Type |
|----------|------------|------|
| AI Platforms | 100% to verified pediatric charities | Immutable |
| Dating App | Survival Mode (100% founder) -> Permanent | Upgradeable |

---

## Phase 1: SURVIVAL (Current)

### Status
- **Active:** Yes
- **Founder Allocation:** 100% (10000 bps)
- **DAO Allocation:** 0%
- **Charity Allocation:** 0%

### Configuration
```
Founder:  10000 bps (100%)
DAO:      0 bps (0%)
Charity:  0 bps (0%)
```

### Role Holders
| Role | Current Holder |
|------|----------------|
| DEFAULT_ADMIN_ROLE | FOUNDER_WALLET |
| GOVERNOR_ROLE | FOUNDER_WALLET |
| UPGRADER_ROLE | FOUNDER_WALLET |

### Safety Checks
- [ ] Verify founder wallet has all roles: `hasRole(GOVERNOR_ROLE, founderAddress)`
- [ ] Verify contract is in survival mode: `permanentSplitActivated() == false`
- [ ] Verify current split: `getSplit() returns (10000, 0, 0)`

---

## Phase 2: TRANSITION

### Prerequisites
Before beginning transition, ensure:
1. Survival mode objectives have been met
2. DAO structure is defined and agreed upon
3. Gnosis Safe signers are identified and verified
4. Timelock delay period is agreed upon (7-30 days)

### Step 2.1: Deploy Gnosis Safe for DAO

**Action:** Create a new Gnosis Safe multisig wallet

```bash
# Using Gnosis Safe web interface or CLI
# Recommended: 3/5 or 4/7 multisig configuration
```

**Parameters:**
- Network: Base Mainnet (Chain ID: 8453)
- Threshold: Minimum 3 signers recommended
- Signers: [List of verified DAO member addresses]

**Verification:**
```solidity
// Verify Safe deployment
Safe safe = Safe(SAFE_ADDRESS);
require(safe.getThreshold() >= 3, "Insufficient threshold");
```

**Rollback:** Safe deployment is independent; no rollback needed.

---

### Step 2.2: Deploy Timelock Controller

**Action:** Deploy OpenZeppelin TimelockController

```solidity
// Constructor parameters
address[] memory proposers = new address[](1);
proposers[0] = DAO_SAFE_ADDRESS;

address[] memory executors = new address[](1);
executors[0] = DAO_SAFE_ADDRESS;

TimelockController timelock = new TimelockController(
    604800,        // minDelay: 7 days in seconds
    proposers,     // who can schedule
    executors,     // who can execute
    address(0)     // no admin (self-administered)
);
```

**Parameters:**
| Parameter | Value | Description |
|-----------|-------|-------------|
| minDelay | 604800 | 7 days minimum |
| maxDelay | 2592000 | 30 days maximum |
| proposers | [DAO_SAFE] | Only DAO can propose |
| executors | [DAO_SAFE] | Only DAO can execute |

**Verification:**
```solidity
require(timelock.getMinDelay() >= 604800, "Delay too short");
```

**Rollback:** Timelock deployment is independent; no rollback needed.

---

### Step 2.3: Schedule New Split

**Action:** Call `scheduleSplit()` on DatingRevenueRouter

```solidity
// Function signature
function scheduleSplit(
    uint16 newFounderBps,
    uint16 newDaoBps,
    uint16 newCharityBps
) external onlyRole(GOVERNOR_ROLE)

// Example: Transition to 10% founder, 45% DAO, 45% charity
datingRouter.scheduleSplit(
    1000,   // 10% founder
    4500,   // 45% DAO
    4500    // 45% charity
);
```

**Constraints:**
- `newFounderBps + newDaoBps + newCharityBps == 10000`
- Must have GOVERNOR_ROLE
- Cannot schedule if permanent split already active

**Safety Checks Before Execution:**
- [ ] Verify caller has GOVERNOR_ROLE
- [ ] Verify sum equals 10000 bps
- [ ] Verify contract not in permanent mode
- [ ] Verify no pending schedule exists

**Verification:**
```solidity
(uint16 f, uint16 d, uint16 c, uint256 execTime) = datingRouter.getScheduledSplit();
require(f == 1000, "Wrong founder bps");
require(d == 4500, "Wrong DAO bps");
require(c == 4500, "Wrong charity bps");
require(execTime > block.timestamp + 604800, "Delay too short");
```

**Rollback:** Call `cancelScheduledSplit()` before execution time.

```solidity
datingRouter.cancelScheduledSplit();
```

---

### Step 2.4: Wait Mandatory Delay

**Action:** Wait minimum 7 days (604800 seconds)

**Timeline:**
```
Schedule Time:     T+0
Earliest Apply:    T+7 days (604800 seconds)
Latest Apply:      T+30 days (2592000 seconds)
```

**During Wait Period:**
- [ ] Monitor for any security concerns
- [ ] Verify DAO Safe is operational
- [ ] Verify Timelock is operational
- [ ] Prepare for role transfers
- [ ] Communicate timeline to stakeholders

**Rollback:** Cancel is still possible during this period.

---

### Step 2.5: Apply Scheduled Split

**Action:** Call `applySplit()` after delay has passed

```solidity
// Function signature
function applySplit() external onlyRole(GOVERNOR_ROLE)

// Execute
datingRouter.applySplit();
```

**Constraints:**
- Must be after scheduled execution time
- Must be before maximum delay expires
- Must have GOVERNOR_ROLE

**Safety Checks Before Execution:**
- [ ] Verify current time > scheduled execution time
- [ ] Verify current time < scheduled expiry time
- [ ] Verify caller has GOVERNOR_ROLE
- [ ] Verify DAO Safe is ready to receive funds

**Verification:**
```solidity
(uint16 f, uint16 d, uint16 c) = datingRouter.getSplit();
require(f == 1000, "Apply failed: wrong founder");
require(d == 4500, "Apply failed: wrong DAO");
require(c == 4500, "Apply failed: wrong charity");
```

**Rollback:** NOT POSSIBLE after apply. The split is now active.

---

## Phase 3: PERMANENT

### WARNING - IRREVERSIBLE ACTIONS AHEAD

The following steps contain **IRREVERSIBLE** operations. Once completed:
- Founder allocation can NEVER exceed 10%
- GOVERNOR_ROLE cannot be reclaimed by founder
- Contract upgrade path is permanently restricted

### Step 3.1: Transfer GOVERNOR_ROLE to DAO

**Action:** Grant GOVERNOR_ROLE to Timelock, then renounce from founder

```solidity
// Step 1: Grant to Timelock (which is controlled by DAO Safe)
bytes32 GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
datingRouter.grantRole(GOVERNOR_ROLE, TIMELOCK_ADDRESS);

// Step 2: Verify Timelock has role
require(datingRouter.hasRole(GOVERNOR_ROLE, TIMELOCK_ADDRESS), "Grant failed");

// Step 3: Renounce from founder wallet
datingRouter.renounceRole(GOVERNOR_ROLE, FOUNDER_ADDRESS);
```

**Safety Checks Before Execution:**
- [ ] Verify Timelock address is correct (triple-check!)
- [ ] Verify DAO Safe controls Timelock
- [ ] Verify DAO Safe signers are available
- [ ] Test DAO can execute through Timelock

**Verification:**
```solidity
require(datingRouter.hasRole(GOVERNOR_ROLE, TIMELOCK_ADDRESS), "Timelock missing role");
require(!datingRouter.hasRole(GOVERNOR_ROLE, FOUNDER_ADDRESS), "Founder still has role");
```

**Rollback:** If Step 3 (renounce) not yet executed, founder still has role.

---

### Step 3.2: Activate Permanent Split

## DANGER - THIS ACTION IS IRREVERSIBLE

**Action:** Call `activatePermanentSplit()` to permanently cap founder at 10%

```solidity
// Function signature
function activatePermanentSplit(uint16 maxFounderBps) external onlyRole(GOVERNOR_ROLE)

// Execute - caps founder at 10% FOREVER
// This must now come through Timelock (via DAO Safe)
datingRouter.activatePermanentSplit(1000);
```

**What This Does:**
1. Sets `permanentSplitActivated = true`
2. Sets `maxFounderBps = 1000` (10%)
3. Emits `PermanentSplitActivated(1000)` event
4. **CANNOT BE UNDONE**

**Constraints:**
- `maxFounderBps <= 1000` (10% maximum)
- Must have GOVERNOR_ROLE (now held by Timelock)
- Can only be called once ever

**Safety Checks Before Execution:**
- [ ] This is the final step - are you absolutely sure?
- [ ] Verify current split has founder <= maxFounderBps
- [ ] Verify DAO governance is fully operational
- [ ] Verify all stakeholders have approved
- [ ] Document the decision with signatures

**Verification:**
```solidity
require(datingRouter.permanentSplitActivated() == true, "Activation failed");
require(datingRouter.maxFounderBps() == 1000, "Wrong max bps");
```

**Rollback:** **IMPOSSIBLE** - This action cannot be undone.

---

## Post-Migration State

### Final Configuration
```
Founder:  <= 10% (1000 bps maximum, forever)
DAO:      Governed by Gnosis Safe + Timelock
Charity:  Minimum enforced by smart contract
```

### Role Holders (Final)
| Role | Final Holder |
|------|--------------|
| DEFAULT_ADMIN_ROLE | DAO_SAFE + TIMELOCK |
| GOVERNOR_ROLE | DAO_SAFE + TIMELOCK |
| UPGRADER_ROLE | DAO_SAFE + TIMELOCK |

### Governance Flow (Post-Migration)
```
1. DAO Safe proposes change (multisig vote)
2. Proposal sent to Timelock (7+ day delay)
3. After delay, DAO Safe executes via Timelock
4. Contract state updated
```

---

## Timeline Recommendations

| Phase | Duration | Notes |
|-------|----------|-------|
| Survival | Until sustainable | No fixed timeline |
| Transition Prep | 2-4 weeks | Deploy Safe, Timelock |
| Schedule to Apply | 7-30 days | Mandatory delay |
| Role Transfer | 1 day | After apply |
| Permanent Activation | When ready | No rush - irreversible |

---

## Emergency Procedures

### During Survival Mode
- Founder has full control
- Can pause distributions if needed
- Can upgrade contract if critical bug found

### During Transition (Before Apply)
- Can cancel scheduled split
- Can modify parameters and reschedule
- Founder retains all roles

### After Permanent Activation
- No emergency founder override
- All changes require DAO vote + Timelock delay
- Contract upgrades require DAO approval

---

## Checklist Summary

### Pre-Transition
- [ ] Survival mode objectives met
- [ ] DAO structure finalized
- [ ] Legal review completed
- [ ] Stakeholder communication done

### Transition
- [ ] Gnosis Safe deployed and tested
- [ ] Timelock deployed and tested
- [ ] Split scheduled with correct parameters
- [ ] Waited minimum delay period
- [ ] Split applied successfully
- [ ] New allocations verified

### Permanent
- [ ] GOVERNOR_ROLE transferred to Timelock
- [ ] DAO can execute through Timelock (tested)
- [ ] Final stakeholder approval obtained
- [ ] Permanent split activated
- [ ] All roles transferred to DAO

---

## Appendix: Function Signatures

```solidity
// Survival Mode
function getSplit() external view returns (uint16 founder, uint16 dao, uint16 charity);
function hasRole(bytes32 role, address account) external view returns (bool);

// Transition
function scheduleSplit(uint16 newFounder, uint16 newDao, uint16 newCharity) external;
function cancelScheduledSplit() external;
function getScheduledSplit() external view returns (uint16, uint16, uint16, uint256);
function applySplit() external;

// Permanent
function activatePermanentSplit(uint16 maxFounderBps) external;
function permanentSplitActivated() external view returns (bool);
function maxFounderBps() external view returns (uint16);

// Role Management
function grantRole(bytes32 role, address account) external;
function revokeRole(bytes32 role, address account) external;
function renounceRole(bytes32 role, address account) external;
```

---

**Gospel V1.4.1 SURVIVAL MODE**
*"Until no kid is in need"*
