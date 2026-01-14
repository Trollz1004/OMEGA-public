/**
 * API client for fetching distribution data
 * Gospel V1.4.1 SURVIVAL MODE
 */

import { ethers } from 'ethers';
import {
  SPLITTER_CONTRACT_ADDRESS,
  SPLITTER_ABI,
  BASE_RPC_URL,
  USDC_ADDRESS,
  ERC20_ABI,
  SplitMode,
} from './contracts';

// Types for contract state
export interface ContractState {
  currentMode: SplitMode;
  charityBps: number;
  founderBps: number;
  pendingCharityBps: number;
  pendingFounderBps: number;
  splitScheduledAt: number;
  splitEffectiveAt: number;
  timelockDays: number;
  charityWallet: string;
  founderWallet: string;
  totalDistributed: bigint;
  totalToCharity: bigint;
  totalToFounder: bigint;
  isPermanent: boolean;
  contractBalance: bigint;
}

// Types for distribution events
export interface Distribution {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  totalAmount: bigint;
  charityAmount: bigint;
  founderAmount: bigint;
}

// Types for aggregated stats
export interface DistributionStats {
  total30Days: bigint;
  total90Days: bigint;
  totalAllTime: bigint;
  charity30Days: bigint;
  charity90Days: bigint;
  charityAllTime: bigint;
  distributionCount: number;
}

// Create provider instance
let providerInstance: ethers.JsonRpcProvider | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!providerInstance) {
    providerInstance = new ethers.JsonRpcProvider(BASE_RPC_URL);
  }
  return providerInstance;
}

// Get contract instance
function getContract(): ethers.Contract {
  const provider = getProvider();
  return new ethers.Contract(SPLITTER_CONTRACT_ADDRESS, SPLITTER_ABI, provider);
}

// Fetch current contract state
export async function fetchContractState(): Promise<ContractState> {
  const contract = getContract();
  const provider = getProvider();

  // Fetch all state in parallel
  const [
    currentMode,
    charityBps,
    founderBps,
    pendingCharityBps,
    pendingFounderBps,
    splitScheduledAt,
    splitEffectiveAt,
    timelockDays,
    charityWallet,
    founderWallet,
    totalDistributed,
    totalToCharity,
    totalToFounder,
    isPermanent,
  ] = await Promise.all([
    contract.currentMode().catch(() => 0),
    contract.charityBps().catch(() => BigInt(10000)),
    contract.founderBps().catch(() => BigInt(0)),
    contract.pendingCharityBps().catch(() => BigInt(0)),
    contract.pendingFounderBps().catch(() => BigInt(0)),
    contract.splitScheduledAt().catch(() => BigInt(0)),
    contract.splitEffectiveAt().catch(() => BigInt(0)),
    contract.timelockDays().catch(() => BigInt(7)),
    contract.charityWallet().catch(() => ethers.ZeroAddress),
    contract.founderWallet().catch(() => ethers.ZeroAddress),
    contract.totalDistributed().catch(() => BigInt(0)),
    contract.totalToCharity().catch(() => BigInt(0)),
    contract.totalToFounder().catch(() => BigInt(0)),
    contract.isPermanent().catch(() => false),
  ]);

  // Get contract USDC balance
  const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
  const contractBalance = await usdcContract.balanceOf(SPLITTER_CONTRACT_ADDRESS).catch(() => BigInt(0));

  return {
    currentMode: Number(currentMode),
    charityBps: Number(charityBps),
    founderBps: Number(founderBps),
    pendingCharityBps: Number(pendingCharityBps),
    pendingFounderBps: Number(pendingFounderBps),
    splitScheduledAt: Number(splitScheduledAt),
    splitEffectiveAt: Number(splitEffectiveAt),
    timelockDays: Number(timelockDays),
    charityWallet,
    founderWallet,
    totalDistributed,
    totalToCharity,
    totalToFounder,
    isPermanent,
    contractBalance,
  };
}

// Fetch distribution events
export async function fetchDistributions(limit: number = 30): Promise<Distribution[]> {
  const contract = getContract();
  const provider = getProvider();

  try {
    // Get current block
    const currentBlock = await provider.getBlockNumber();

    // Look back ~30 days (assuming ~2 second blocks on Base)
    const blocksPerDay = (24 * 60 * 60) / 2;
    const lookbackBlocks = Math.min(blocksPerDay * 90, currentBlock); // 90 days max
    const fromBlock = currentBlock - lookbackBlocks;

    // Query Distributed events
    const filter = contract.filters.Distributed();
    const events = await contract.queryFilter(filter, fromBlock, currentBlock);

    // Process events
    const distributions: Distribution[] = await Promise.all(
      events.slice(-limit).reverse().map(async (event) => {
        const block = await event.getBlock();
        const log = event as ethers.EventLog;

        return {
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: block?.timestamp || 0,
          totalAmount: BigInt(log.args?.[0] || 0),
          charityAmount: BigInt(log.args?.[1] || 0),
          founderAmount: BigInt(log.args?.[2] || 0),
        };
      })
    );

    return distributions;
  } catch (error) {
    console.error('Error fetching distributions:', error);
    return [];
  }
}

// Calculate distribution statistics
export async function fetchDistributionStats(): Promise<DistributionStats> {
  const distributions = await fetchDistributions(1000); // Get more for stats
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
  const ninetyDaysAgo = now - (90 * 24 * 60 * 60);

  let total30Days = BigInt(0);
  let total90Days = BigInt(0);
  let totalAllTime = BigInt(0);
  let charity30Days = BigInt(0);
  let charity90Days = BigInt(0);
  let charityAllTime = BigInt(0);

  for (const dist of distributions) {
    totalAllTime += dist.totalAmount;
    charityAllTime += dist.charityAmount;

    if (dist.timestamp >= ninetyDaysAgo) {
      total90Days += dist.totalAmount;
      charity90Days += dist.charityAmount;
    }

    if (dist.timestamp >= thirtyDaysAgo) {
      total30Days += dist.totalAmount;
      charity30Days += dist.charityAmount;
    }
  }

  return {
    total30Days,
    total90Days,
    totalAllTime,
    charity30Days,
    charity90Days,
    charityAllTime,
    distributionCount: distributions.length,
  };
}

// Combined data fetch for dashboard
export interface DashboardData {
  state: ContractState;
  distributions: Distribution[];
  stats: DistributionStats;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [state, distributions] = await Promise.all([
    fetchContractState(),
    fetchDistributions(30),
  ]);

  // Calculate stats from fetched distributions
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
  const ninetyDaysAgo = now - (90 * 24 * 60 * 60);

  let total30Days = BigInt(0);
  let total90Days = BigInt(0);
  let charity30Days = BigInt(0);
  let charity90Days = BigInt(0);

  for (const dist of distributions) {
    if (dist.timestamp >= ninetyDaysAgo) {
      total90Days += dist.totalAmount;
      charity90Days += dist.charityAmount;
    }
    if (dist.timestamp >= thirtyDaysAgo) {
      total30Days += dist.totalAmount;
      charity30Days += dist.charityAmount;
    }
  }

  const stats: DistributionStats = {
    total30Days,
    total90Days,
    totalAllTime: state.totalDistributed,
    charity30Days,
    charity90Days,
    charityAllTime: state.totalToCharity,
    distributionCount: distributions.length,
  };

  return { state, distributions, stats };
}
