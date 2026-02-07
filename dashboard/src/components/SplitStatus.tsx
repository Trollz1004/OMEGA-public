'use client';

import { useMemo } from 'react';
import { SplitMode, MODE_CONFIG, bpsToPercent, formatUSDC, getBaseScanLink, shortenAddress } from '@/lib/contracts';
import type { ContractState } from '@/lib/api';

interface SplitStatusProps {
  state: ContractState;
}

export default function SplitStatus({ state }: SplitStatusProps) {
  const modeConfig = MODE_CONFIG[state.currentMode as SplitMode] || MODE_CONFIG[SplitMode.SURVIVAL];

  // Calculate percentages for the visual bar
  const charityPercent = state.charityBps / 100;
  const founderPercent = state.founderBps / 100;

  // Determine if we have a valid split (should always be 100%)
  const totalBps = state.charityBps + state.founderBps;
  const isValidSplit = totalBps === 10000;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 card-hover">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Current Split Configuration
        </h2>
        <div
          className="status-badge px-3 py-1 rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: modeConfig.color }}
        >
          {modeConfig.name}
        </div>
      </div>

      {/* Mode Description */}
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        {modeConfig.description}
      </p>

      {/* Visual Split Bar */}
      <div className="mb-6">
        <div className="flex h-8 rounded-lg overflow-hidden shadow-inner">
          {/* Charity portion */}
          <div
            className="flex items-center justify-center text-white text-sm font-medium transition-all duration-500"
            style={{
              width: `${charityPercent}%`,
              backgroundColor: '#10B981',
              minWidth: charityPercent > 0 ? '60px' : '0',
            }}
          >
            {charityPercent > 10 && `${charityPercent.toFixed(1)}%`}
          </div>
          {/* Founder portion */}
          <div
            className="flex items-center justify-center text-white text-sm font-medium transition-all duration-500"
            style={{
              width: `${founderPercent}%`,
              backgroundColor: '#F59E0B',
              minWidth: founderPercent > 0 ? '60px' : '0',
            }}
          >
            {founderPercent > 10 && `${founderPercent.toFixed(1)}%`}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5"></span>
            Verified Pediatric Charities
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-amber-500 mr-1.5"></span>
            Founder (Survival)
          </span>
        </div>
      </div>

      {/* Split Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
          <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-1">
            Charity Allocation
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {bpsToPercent(state.charityBps)}
          </div>
          <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
            {state.charityBps} basis points
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
          <div className="text-amber-600 dark:text-amber-400 text-sm font-medium mb-1">
            Founder Allocation
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {bpsToPercent(state.founderBps)}
          </div>
          <div className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
            {state.founderBps} basis points
          </div>
        </div>
      </div>

      {/* Wallet Addresses */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Distribution Wallets
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Charity Wallet:</span>
            <a
              href={getBaseScanLink('address', state.charityWallet)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-ftk-primary hover:underline"
            >
              {shortenAddress(state.charityWallet)}
            </a>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Founder Wallet:</span>
            <a
              href={getBaseScanLink('address', state.founderWallet)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-ftk-accent hover:underline"
            >
              {shortenAddress(state.founderWallet)}
            </a>
          </div>
        </div>
      </div>

      {/* Contract Balance */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Pending Distribution:
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {formatUSDC(state.contractBalance)}
          </span>
        </div>
      </div>

      {/* Permanent Mode Indicator */}
      {state.isPermanent && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              PERMANENT MODE ACTIVE - Split configuration is now immutable
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
