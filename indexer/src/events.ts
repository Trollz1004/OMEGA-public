/**
 * Event Types and Parsing for FOR THE KIDS Platform
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Tracks Distribution events from both CharityRouter and DatingRouter
 */

import { ethers, Log, EventLog } from 'ethers';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type RouterType = 'charity' | 'dating';
export type RecipientType = 'founder' | 'dao' | 'charity';

export interface Recipient {
  address: string;
  amount: string;
  type: RecipientType;
}

export interface DistributionEvent {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  router: RouterType;
  token: string;
  amount: string;
  recipients: Recipient[];
}

export interface PendingSplit {
  routerAddress: string;
  scheduledAt: number;
  effectiveAt: number;
  newFounderPct: number;
  newDaoPct: number;
  newCharityPct: number;
}

export interface ParsedDistribution {
  token: string;
  totalAmount: bigint;
  founderAmount: bigint;
  daoAmount: bigint;
  charityAmount: bigint;
}

export interface ParsedPendingSplit {
  scheduledTime: bigint;
  effectiveTime: bigint;
  newFounderPct: bigint;
  newDaoPct: bigint;
  newCharityPct: bigint;
}

// ============================================================================
// CONTRACT ABIs (Event signatures only)
// ============================================================================

export const CHARITY_ROUTER_ABI = [
  'event Distributed(address indexed token, uint256 amount, uint256 charityAmount)',
  'event CharityUpdated(address indexed oldCharity, address indexed newCharity)',
  'function charity() view returns (address)',
  'function DAO_TREASURY() view returns (address)'
];

export const DATING_ROUTER_ABI = [
  'event Distributed(address indexed token, uint256 total, uint256 founderAmt, uint256 daoAmt, uint256 charityAmt)',
  'event SplitScheduled(uint256 effectiveTime, uint8 newFounderPct, uint8 newDaoPct, uint8 newCharityPct)',
  'event SplitApplied(uint8 founderPct, uint8 daoPct, uint8 charityPct)',
  'function founderPct() view returns (uint8)',
  'function daoPct() view returns (uint8)',
  'function charityPct() view returns (uint8)',
  'function pendingSplit() view returns (uint256 effectiveTime, uint8 newFounderPct, uint8 newDaoPct, uint8 newCharityPct)',
  'function FOUNDER() view returns (address)',
  'function DAO_TREASURY() view returns (address)',
  'function CHARITY() view returns (address)'
];

// Event signatures (keccak256 hashes)
export const EVENT_SIGNATURES = {
  // CharityRouter: Distributed(address,uint256,uint256)
  CHARITY_DISTRIBUTED: ethers.id('Distributed(address,uint256,uint256)'),
  // DatingRouter: Distributed(address,uint256,uint256,uint256,uint256)
  DATING_DISTRIBUTED: ethers.id('Distributed(address,uint256,uint256,uint256,uint256)'),
  // DatingRouter: SplitScheduled(uint256,uint8,uint8,uint8)
  SPLIT_SCHEDULED: ethers.id('SplitScheduled(uint256,uint8,uint8,uint8)'),
  // DatingRouter: SplitApplied(uint8,uint8,uint8)
  SPLIT_APPLIED: ethers.id('SplitApplied(uint8,uint8,uint8)')
};

// ============================================================================
// EVENT PARSING FUNCTIONS
// ============================================================================

/**
 * Parse a CharityRouter Distributed event
 */
export function parseCharityDistributed(log: Log | EventLog): ParsedDistribution {
  const iface = new ethers.Interface(CHARITY_ROUTER_ABI);
  const decoded = iface.parseLog({
    topics: log.topics as string[],
    data: log.data
  });

  if (!decoded) {
    throw new Error('Failed to decode CharityRouter Distributed event');
  }

  const token = decoded.args[0] as string;
  const amount = decoded.args[1] as bigint;
  const charityAmount = decoded.args[2] as bigint;

  return {
    token,
    totalAmount: amount,
    founderAmount: 0n,
    daoAmount: 0n,
    charityAmount
  };
}

/**
 * Parse a DatingRouter Distributed event
 */
export function parseDatingDistributed(log: Log | EventLog): ParsedDistribution {
  const iface = new ethers.Interface(DATING_ROUTER_ABI);
  const decoded = iface.parseLog({
    topics: log.topics as string[],
    data: log.data
  });

  if (!decoded) {
    throw new Error('Failed to decode DatingRouter Distributed event');
  }

  const token = decoded.args[0] as string;
  const total = decoded.args[1] as bigint;
  const founderAmt = decoded.args[2] as bigint;
  const daoAmt = decoded.args[3] as bigint;
  const charityAmt = decoded.args[4] as bigint;

  return {
    token,
    totalAmount: total,
    founderAmount: founderAmt,
    daoAmount: daoAmt,
    charityAmount: charityAmt
  };
}

/**
 * Parse a SplitScheduled event
 */
export function parseSplitScheduled(log: Log | EventLog): ParsedPendingSplit {
  const iface = new ethers.Interface(DATING_ROUTER_ABI);
  const decoded = iface.parseLog({
    topics: log.topics as string[],
    data: log.data
  });

  if (!decoded) {
    throw new Error('Failed to decode SplitScheduled event');
  }

  return {
    scheduledTime: BigInt(Math.floor(Date.now() / 1000)),
    effectiveTime: decoded.args[0] as bigint,
    newFounderPct: decoded.args[1] as bigint,
    newDaoPct: decoded.args[2] as bigint,
    newCharityPct: decoded.args[3] as bigint
  };
}

/**
 * Determine router type from event signature
 */
export function getRouterTypeFromEvent(topic0: string): RouterType | null {
  if (topic0 === EVENT_SIGNATURES.CHARITY_DISTRIBUTED) {
    return 'charity';
  }
  if (topic0 === EVENT_SIGNATURES.DATING_DISTRIBUTED) {
    return 'dating';
  }
  return null;
}

/**
 * Build a DistributionEvent from parsed data
 */
export function buildDistributionEvent(
  log: Log | EventLog,
  parsed: ParsedDistribution,
  router: RouterType,
  timestamp: number,
  addresses: { founder?: string; dao?: string; charity?: string }
): DistributionEvent {
  const recipients: Recipient[] = [];

  if (parsed.founderAmount > 0n && addresses.founder) {
    recipients.push({
      address: addresses.founder,
      amount: parsed.founderAmount.toString(),
      type: 'founder'
    });
  }

  if (parsed.daoAmount > 0n && addresses.dao) {
    recipients.push({
      address: addresses.dao,
      amount: parsed.daoAmount.toString(),
      type: 'dao'
    });
  }

  if (parsed.charityAmount > 0n && addresses.charity) {
    recipients.push({
      address: addresses.charity,
      amount: parsed.charityAmount.toString(),
      type: 'charity'
    });
  }

  return {
    txHash: log.transactionHash,
    blockNumber: log.blockNumber,
    timestamp,
    router,
    token: parsed.token,
    amount: parsed.totalAmount.toString(),
    recipients
  };
}

/**
 * Format amount for display (assumes 6 decimals for USDC, 18 for ETH)
 */
export function formatAmount(amount: string, decimals: number = 6): string {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0');
  return `${whole}.${fractionStr}`;
}

/**
 * Get BaseScan link for transaction
 */
export function getBaseScanLink(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}
