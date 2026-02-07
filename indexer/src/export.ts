/**
 * CSV Export Module for FOR THE KIDS Platform Indexer
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Export distribution data for finance/accounting purposes
 */

import { Router, Request, Response } from 'express';
import {
  getDistributionsByDateRange,
  getTotalsByRouter,
  DistributionRow,
  RouterTotals
} from './db';
import { formatAmount, getBaseScanLink, RouterType } from './events';

// ============================================================================
// CSV EXPORT UTILITIES
// ============================================================================

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSV(field: string | number | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert distribution row to CSV line
 */
function distributionToCSV(row: DistributionRow, decimals: number = 6): string {
  const fields = [
    row.tx_hash,
    getBaseScanLink(row.tx_hash),
    row.block_number,
    row.timestamp.toISOString(),
    row.router,
    row.token,
    formatAmount(row.total_amount, decimals),
    formatAmount(row.founder_amount, decimals),
    formatAmount(row.dao_amount, decimals),
    formatAmount(row.charity_amount, decimals)
  ];

  return fields.map(escapeCSV).join(',');
}

/**
 * Generate CSV header
 */
function getCSVHeader(): string {
  return [
    'Transaction Hash',
    'BaseScan Link',
    'Block Number',
    'Timestamp (UTC)',
    'Router Type',
    'Token Address',
    'Total Amount',
    'Founder Amount',
    'DAO Amount',
    'Charity Amount'
  ].join(',');
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export interface ExportOptions {
  startDate: Date;
  endDate: Date;
  router?: RouterType;
  decimals?: number;
}

/**
 * Export distributions to CSV string
 */
export async function exportToCSV(options: ExportOptions): Promise<string> {
  const { startDate, endDate, router, decimals = 6 } = options;

  const distributions = await getDistributionsByDateRange(startDate, endDate, router);

  const lines: string[] = [getCSVHeader()];

  for (const dist of distributions) {
    lines.push(distributionToCSV(dist, decimals));
  }

  return lines.join('\n');
}

/**
 * Export summary statistics
 */
export async function exportSummary(options: ExportOptions): Promise<ExportSummary> {
  const { startDate, endDate, router } = options;

  const distributions = await getDistributionsByDateRange(startDate, endDate, router);
  const totals = await getTotalsByRouter();

  let totalDistributed = 0n;
  let totalFounder = 0n;
  let totalDao = 0n;
  let totalCharity = 0n;

  for (const dist of distributions) {
    totalDistributed += BigInt(dist.total_amount);
    totalFounder += BigInt(dist.founder_amount);
    totalDao += BigInt(dist.dao_amount);
    totalCharity += BigInt(dist.charity_amount);
  }

  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    },
    distributionCount: distributions.length,
    totals: {
      distributed: totalDistributed.toString(),
      founder: totalFounder.toString(),
      dao: totalDao.toString(),
      charity: totalCharity.toString()
    },
    byRouter: totals.reduce((acc, t) => {
      acc[t.router] = {
        count: parseInt(t.distribution_count, 10),
        total: t.total_distributed,
        founder: t.total_founder,
        dao: t.total_dao,
        charity: t.total_charity
      };
      return acc;
    }, {} as Record<string, RouterSummary>)
  };
}

// ============================================================================
// EXPRESS ROUTER
// ============================================================================

export function createExportRouter(): Router {
  const router = Router();

  /**
   * GET /export/csv
   * Query params:
   *   - start: ISO date string (required)
   *   - end: ISO date string (required)
   *   - router: 'charity' | 'dating' (optional)
   *   - decimals: number (optional, default 6 for USDC)
   */
  router.get('/csv', async (req: Request, res: Response) => {
    try {
      const { start, end, router: routerType, decimals } = req.query;

      if (!start || !end) {
        res.status(400).json({
          error: 'Missing required parameters: start and end dates'
        });
        return;
      }

      const startDate = new Date(start as string);
      const endDate = new Date(end as string);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          error: 'Invalid date format. Use ISO 8601 format.'
        });
        return;
      }

      const csv = await exportToCSV({
        startDate,
        endDate,
        router: routerType as RouterType | undefined,
        decimals: decimals ? parseInt(decimals as string, 10) : 6
      });

      const filename = `distributions_${start}_${end}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      console.error('[Export] CSV export error:', error);
      res.status(500).json({
        error: 'Failed to generate CSV export',
        details: (error as Error).message
      });
    }
  });

  /**
   * GET /export/summary
   * Query params:
   *   - start: ISO date string (required)
   *   - end: ISO date string (required)
   *   - router: 'charity' | 'dating' (optional)
   */
  router.get('/summary', async (req: Request, res: Response) => {
    try {
      const { start, end, router: routerType } = req.query;

      if (!start || !end) {
        res.status(400).json({
          error: 'Missing required parameters: start and end dates'
        });
        return;
      }

      const startDate = new Date(start as string);
      const endDate = new Date(end as string);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          error: 'Invalid date format. Use ISO 8601 format.'
        });
        return;
      }

      const summary = await exportSummary({
        startDate,
        endDate,
        router: routerType as RouterType | undefined
      });

      res.json(summary);
    } catch (error) {
      console.error('[Export] Summary export error:', error);
      res.status(500).json({
        error: 'Failed to generate summary',
        details: (error as Error).message
      });
    }
  });

  /**
   * GET /export/json
   * Query params:
   *   - start: ISO date string (required)
   *   - end: ISO date string (required)
   *   - router: 'charity' | 'dating' (optional)
   */
  router.get('/json', async (req: Request, res: Response) => {
    try {
      const { start, end, router: routerType } = req.query;

      if (!start || !end) {
        res.status(400).json({
          error: 'Missing required parameters: start and end dates'
        });
        return;
      }

      const startDate = new Date(start as string);
      const endDate = new Date(end as string);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          error: 'Invalid date format. Use ISO 8601 format.'
        });
        return;
      }

      const distributions = await getDistributionsByDateRange(
        startDate,
        endDate,
        routerType as RouterType | undefined
      );

      // Format for readability
      const formatted = distributions.map(dist => ({
        txHash: dist.tx_hash,
        baseScanLink: getBaseScanLink(dist.tx_hash),
        blockNumber: parseInt(dist.block_number, 10),
        timestamp: dist.timestamp.toISOString(),
        router: dist.router,
        token: dist.token,
        amounts: {
          total: formatAmount(dist.total_amount),
          founder: formatAmount(dist.founder_amount),
          dao: formatAmount(dist.dao_amount),
          charity: formatAmount(dist.charity_amount)
        },
        rawAmounts: {
          total: dist.total_amount,
          founder: dist.founder_amount,
          dao: dist.dao_amount,
          charity: dist.charity_amount
        }
      }));

      res.json({
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        count: formatted.length,
        distributions: formatted
      });
    } catch (error) {
      console.error('[Export] JSON export error:', error);
      res.status(500).json({
        error: 'Failed to generate JSON export',
        details: (error as Error).message
      });
    }
  });

  return router;
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RouterSummary {
  count: number;
  total: string;
  founder: string;
  dao: string;
  charity: string;
}

export interface ExportSummary {
  period: {
    start: string;
    end: string;
  };
  distributionCount: number;
  totals: {
    distributed: string;
    founder: string;
    dao: string;
    charity: string;
  };
  byRouter: Record<string, RouterSummary>;
}

// ============================================================================
// CLI EXPORT (for direct invocation)
// ============================================================================

/**
 * CLI entry point for exports
 */
export async function runCLIExport(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: ts-node src/export.ts <start-date> <end-date> [router]');
    console.log('Example: ts-node src/export.ts 2024-01-01 2024-12-31 charity');
    process.exit(1);
  }

  const [startStr, endStr, routerStr] = args;
  const startDate = new Date(startStr);
  const endDate = new Date(endStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error('Invalid date format. Use YYYY-MM-DD.');
    process.exit(1);
  }

  // Initialize database from environment
  const { initDb, closeDb } = await import('./db');
  initDb({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'indexer',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    const csv = await exportToCSV({
      startDate,
      endDate,
      router: routerStr as RouterType | undefined
    });

    console.log(csv);
  } finally {
    await closeDb();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  runCLIExport().catch(console.error);
}
