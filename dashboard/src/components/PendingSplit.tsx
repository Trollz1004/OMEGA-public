'use client';

import { useState, useEffect, useMemo } from 'react';
import { bpsToPercent } from '@/lib/contracts';
import type { ContractState } from '@/lib/api';

interface PendingSplitProps {
  state: ContractState;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeRemaining(effectiveAt: number): TimeRemaining {
  const now = Math.floor(Date.now() / 1000);
  const total = Math.max(0, effectiveAt - now);

  return {
    days: Math.floor(total / (24 * 60 * 60)),
    hours: Math.floor((total % (24 * 60 * 60)) / (60 * 60)),
    minutes: Math.floor((total % (60 * 60)) / 60),
    seconds: total % 60,
    total,
  };
}

export default function PendingSplit({ state }: PendingSplitProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(state.splitEffectiveAt)
  );

  // Check if there's a pending split
  const hasPendingSplit = state.splitEffectiveAt > 0 && state.splitScheduledAt > 0;

  // Update countdown every second
  useEffect(() => {
    if (!hasPendingSplit) return;

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(state.splitEffectiveAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasPendingSplit, state.splitEffectiveAt]);

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (!hasPendingSplit) return 0;
    const totalDuration = state.splitEffectiveAt - state.splitScheduledAt;
    const elapsed = Math.floor(Date.now() / 1000) - state.splitScheduledAt;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }, [hasPendingSplit, state.splitScheduledAt, state.splitEffectiveAt]);

  // If no pending split, show a different message
  if (!hasPendingSplit) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 card-hover">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Scheduled Split Change
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-slate-500 dark:text-slate-400">
              No pending split changes
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Current configuration is active
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isReady = timeRemaining.total === 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Scheduled Split Change
        </h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            isReady
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          }`}
        >
          {isReady ? 'Ready to Apply' : 'Timelock Active'}
        </span>
      </div>

      {/* Countdown Timer */}
      <div className="mb-6">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-ftk-primary animate-countdown">
              {String(timeRemaining.days).padStart(2, '0')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Days</div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-ftk-primary animate-countdown">
              {String(timeRemaining.hours).padStart(2, '0')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Hours</div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-ftk-primary animate-countdown">
              {String(timeRemaining.minutes).padStart(2, '0')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Minutes</div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-ftk-primary animate-countdown">
              {String(timeRemaining.seconds).padStart(2, '0')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Seconds</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
          <span>Timelock Progress</span>
          <span>{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-ftk-primary to-ftk-secondary transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Pending Split Details */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Pending Configuration
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
            <div className="text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-1">
              New Charity Split
            </div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {bpsToPercent(state.pendingCharityBps)}
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
            <div className="text-amber-600 dark:text-amber-400 text-xs font-medium mb-1">
              New Founder Split
            </div>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
              {bpsToPercent(state.pendingFounderBps)}
            </div>
          </div>
        </div>
      </div>

      {/* Timelock Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Timelock Protection</p>
            <p className="text-blue-600/80 dark:text-blue-400/80 mt-1">
              Split changes require a {state.timelockDays}-day waiting period for transparency.
              The community can review all scheduled changes before they take effect.
            </p>
          </div>
        </div>
      </div>

      {/* Scheduled/Effective Timestamps */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Scheduled:</span>
          <div className="font-medium text-slate-700 dark:text-slate-300">
            {new Date(state.splitScheduledAt * 1000).toLocaleString()}
          </div>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Effective:</span>
          <div className="font-medium text-slate-700 dark:text-slate-300">
            {new Date(state.splitEffectiveAt * 1000).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
