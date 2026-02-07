'use client';

import { useEffect, useState, useCallback } from 'react';
import SplitStatus from '@/components/SplitStatus';
import PendingSplit from '@/components/PendingSplit';
import DistributionTable from '@/components/DistributionTable';
import MermaidDiagram from '@/components/MermaidDiagram';
import ContractInfo from '@/components/ContractInfo';
import { fetchDashboardData, type DashboardData, type ContractState, type Distribution, type DistributionStats } from '@/lib/api';
import { SplitMode } from '@/lib/contracts';

// Default state for initial render
const defaultState: ContractState = {
  currentMode: SplitMode.SURVIVAL,
  charityBps: 10000,
  founderBps: 0,
  pendingCharityBps: 0,
  pendingFounderBps: 0,
  splitScheduledAt: 0,
  splitEffectiveAt: 0,
  timelockDays: 7,
  charityWallet: '0x0000000000000000000000000000000000000000',
  founderWallet: '0x0000000000000000000000000000000000000000',
  totalDistributed: BigInt(0),
  totalToCharity: BigInt(0),
  totalToFounder: BigInt(0),
  isPermanent: false,
  contractBalance: BigInt(0),
};

const defaultStats: DistributionStats = {
  total30Days: BigInt(0),
  total90Days: BigInt(0),
  totalAllTime: BigInt(0),
  charity30Days: BigInt(0),
  charity90Days: BigInt(0),
  charityAllTime: BigInt(0),
  distributionCount: 0,
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    state: defaultState,
    distributions: [],
    stats: defaultStats,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const dashboardData = await fetchDashboardData();
      setData(dashboardData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load data from blockchain. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
          Transparency Dashboard
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Real-time tracking of all distributions to verified pediatric charities.
          Every transaction is recorded on Base blockchain for complete transparency.
        </p>

        {/* Last Updated */}
        <div className="mt-4 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          {lastUpdated && (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 live-pulse"></span>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </>
          )}
          <button
            onClick={loadData}
            disabled={isLoading}
            className="ml-4 text-ftk-primary hover:text-ftk-primary/80 disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700 dark:text-red-300">{error}</span>
            <button
              onClick={loadData}
              className="ml-auto text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 font-medium text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !data.state.charityWallet && (
        <div className="flex flex-col items-center justify-center py-20">
          <svg
            className="animate-spin h-12 w-12 text-ftk-primary mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-slate-600 dark:text-slate-400">Loading blockchain data...</p>
        </div>
      )}

      {/* Main Content */}
      {(!isLoading || data.state.charityWallet) && (
        <>
          {/* Split Configuration Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SplitStatus state={data.state} />
            <PendingSplit state={data.state} />
          </div>

          {/* Distribution History */}
          <div className="mb-8">
            <DistributionTable
              distributions={data.distributions}
              stats={data.stats}
            />
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MermaidDiagram />
            <ContractInfo />
          </div>

          {/* Mission Statement */}
          <div className="mt-10 text-center p-8 bg-gradient-to-r from-ftk-primary/10 to-ftk-secondary/10 rounded-2xl">
            <h2 className="text-2xl font-bold gradient-text mb-3">
              Our Mission
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              100% of AI platform revenue goes directly to verified pediatric charities.
              Every distribution is recorded on-chain for complete transparency.
              Our goal: <span className="font-semibold">&quot;Until no kid is in need.&quot;</span>
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                100% Transparent
              </div>
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                On-Chain Verified
              </div>
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Gospel V1.4.1 SURVIVAL MODE
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
