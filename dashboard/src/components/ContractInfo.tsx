'use client';

import {
  SPLITTER_CONTRACT_ADDRESS,
  USDC_ADDRESS,
  BASE_CHAIN_ID,
  getBaseScanLink,
  shortenAddress,
} from '@/lib/contracts';

export default function ContractInfo() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 card-hover">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Verified Contracts
      </h2>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        All contracts are verified on BaseScan for complete transparency.
        Anyone can audit the code and verify the distribution logic.
      </p>

      {/* Main Contract */}
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              FOR THE KIDS Splitter
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Verified
            </span>
          </div>
          <div className="flex items-center justify-between">
            <code className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {shortenAddress(SPLITTER_CONTRACT_ADDRESS)}
            </code>
            <a
              href={getBaseScanLink('address', SPLITTER_CONTRACT_ADDRESS)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ftk-primary hover:underline text-sm flex items-center"
            >
              View on BaseScan
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Full address: {SPLITTER_CONTRACT_ADDRESS}
          </div>
        </div>

        {/* USDC Contract */}
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              USDC Token (Base)
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Official
            </span>
          </div>
          <div className="flex items-center justify-between">
            <code className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {shortenAddress(USDC_ADDRESS)}
            </code>
            <a
              href={getBaseScanLink('address', USDC_ADDRESS)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ftk-primary hover:underline text-sm flex items-center"
            >
              View on BaseScan
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Network Info */}
      <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              Base Mainnet
            </div>
            <div className="text-xs text-indigo-600/70 dark:text-indigo-400/70">
              Chain ID: {BASE_CHAIN_ID}
            </div>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-xs text-amber-700 dark:text-amber-300">
            <span className="font-medium">Always verify:</span> Confirm contract addresses match
            before any interactions. Only use official links from this dashboard.
          </div>
        </div>
      </div>
    </div>
  );
}
