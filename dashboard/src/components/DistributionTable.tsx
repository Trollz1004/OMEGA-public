'use client';

import { useMemo } from 'react';
import { formatUSDC, getBaseScanLink, shortenAddress } from '@/lib/contracts';
import type { Distribution, DistributionStats } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface DistributionTableProps {
  distributions: Distribution[];
  stats: DistributionStats;
}

export default function DistributionTable({ distributions, stats }: DistributionTableProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      {/* Stats Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Distribution History
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              30 Days
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {formatUSDC(stats.total30Days)}
            </div>
            <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
              {formatUSDC(stats.charity30Days)} to charity
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              90 Days
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
              {formatUSDC(stats.total90Days)}
            </div>
            <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
              {formatUSDC(stats.charity90Days)} to charity
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
            <div className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
              All Time
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
              {formatUSDC(stats.totalAllTime)}
            </div>
            <div className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
              {formatUSDC(stats.charityAllTime)} to charity
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date/Time
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                To Charity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                To Founder
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Transaction
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {distributions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <svg
                    className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400">
                    No distributions recorded yet
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    Distributions will appear here once processed
                  </p>
                </td>
              </tr>
            ) : (
              distributions.map((dist, index) => (
                <tr
                  key={dist.txHash}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {new Date(dist.timestamp * 1000).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(dist.timestamp * 1000).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatDistanceToNow(new Date(dist.timestamp * 1000), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatUSDC(dist.totalAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {formatUSDC(dist.charityAmount)}
                    </div>
                    {dist.totalAmount > 0 && (
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {((Number(dist.charityAmount) / Number(dist.totalAmount)) * 100).toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      {formatUSDC(dist.founderAmount)}
                    </div>
                    {dist.totalAmount > 0 && (
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {((Number(dist.founderAmount) / Number(dist.totalAmount)) * 100).toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <a
                      href={getBaseScanLink('tx', dist.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-ftk-primary hover:text-white transition-colors text-xs font-medium"
                    >
                      <svg
                        className="w-3.5 h-3.5 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      View
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {distributions.length > 0 && (
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              Showing {distributions.length} most recent distributions
            </span>
            <a
              href={getBaseScanLink('address', process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ftk-primary hover:underline"
            >
              View all on BaseScan
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
