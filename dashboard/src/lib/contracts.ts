/**
 * Contract addresses and ABIs for FOR THE KIDS transparency dashboard
 * Gospel V1.4.1 SURVIVAL MODE
 */

// Main splitter contract on Base Mainnet
export const SPLITTER_CONTRACT_ADDRESS = '0x9855B75061D4c841791382998f0CE8B2BCC965A4';

// Base Mainnet configuration
export const BASE_CHAIN_ID = 8453;
export const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org';
export const BASESCAN_URL = process.env.NEXT_PUBLIC_BASESCAN_URL || 'https://basescan.org';

// USDC on Base
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const USDC_DECIMALS = 6;

// Split mode enumeration
export enum SplitMode {
  SURVIVAL = 0,
  TRANSITION = 1,
  PERMANENT = 2,
}

// Mode display names and colors
export const MODE_CONFIG = {
  [SplitMode.SURVIVAL]: {
    name: 'SURVIVAL',
    description: 'Founder receives dating app revenue for sustainability',
    color: '#FF9800',
    bgClass: 'bg-ftk-survival',
  },
  [SplitMode.TRANSITION]: {
    name: 'TRANSITION',
    description: 'Scheduled split change pending timelock',
    color: '#2196F3',
    bgClass: 'bg-ftk-transition',
  },
  [SplitMode.PERMANENT]: {
    name: 'PERMANENT DAO',
    description: 'Immutable charity-first allocation',
    color: '#4CAF50',
    bgClass: 'bg-ftk-permanent',
  },
};

// Splitter contract ABI (read functions only)
export const SPLITTER_ABI = [
  // View functions
  {
    inputs: [],
    name: 'currentMode',
    outputs: [{ type: 'uint8', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'charityBps',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'founderBps',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pendingCharityBps',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pendingFounderBps',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'splitScheduledAt',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'splitEffectiveAt',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'timelockDays',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'charityWallet',
    outputs: [{ type: 'address', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'founderWallet',
    outputs: [{ type: 'address', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalDistributed',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalToCharity',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalToFounder',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isPermanent',
    outputs: [{ type: 'bool', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events for indexing
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'totalAmount', type: 'uint256' },
      { indexed: false, name: 'charityAmount', type: 'uint256' },
      { indexed: false, name: 'founderAmount', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'Distributed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'newCharityBps', type: 'uint256' },
      { indexed: false, name: 'newFounderBps', type: 'uint256' },
      { indexed: false, name: 'effectiveAt', type: 'uint256' },
    ],
    name: 'SplitScheduled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'charityBps', type: 'uint256' },
      { indexed: false, name: 'founderBps', type: 'uint256' },
    ],
    name: 'SplitApplied',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: 'timestamp', type: 'uint256' }],
    name: 'PermanentModeActivated',
    type: 'event',
  },
] as const;

// ERC20 ABI for USDC balance checks
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Helper to format USDC amounts
export function formatUSDC(amount: bigint): string {
  const value = Number(amount) / 10 ** USDC_DECIMALS;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Helper to format basis points as percentage
export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

// Helper to generate BaseScan links
export function getBaseScanLink(type: 'tx' | 'address', hash: string): string {
  return `${BASESCAN_URL}/${type}/${hash}`;
}

// Helper to shorten addresses for display
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
