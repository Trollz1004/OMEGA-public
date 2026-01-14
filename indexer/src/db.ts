/**
 * Database Layer for FOR THE KIDS Platform Indexer
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Postgres schema and queries for distribution tracking
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { DistributionEvent, PendingSplit, RouterType } from './events';

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

let pool: Pool | null = null;

/**
 * Initialize database connection pool
 */
export function initDb(config: DbConfig): Pool {
  pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });

  pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err);
  });

  return pool;
}

/**
 * Get the database pool
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return pool;
}

/**
 * Close database connections
 */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

export const SCHEMA_SQL = `
-- Distribution events table
CREATE TABLE IF NOT EXISTS distributions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66) NOT NULL UNIQUE,
  block_number BIGINT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  router VARCHAR(20) NOT NULL CHECK (router IN ('charity', 'dating')),
  token VARCHAR(42) NOT NULL,
  total_amount NUMERIC(78, 0) NOT NULL,
  founder_amount NUMERIC(78, 0) DEFAULT 0,
  dao_amount NUMERIC(78, 0) DEFAULT 0,
  charity_amount NUMERIC(78, 0) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pending split schedules (DatingRouter only)
CREATE TABLE IF NOT EXISTS pending_splits (
  id SERIAL PRIMARY KEY,
  router_address VARCHAR(42) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  new_founder_pct INTEGER NOT NULL CHECK (new_founder_pct >= 0 AND new_founder_pct <= 100),
  new_dao_pct INTEGER NOT NULL CHECK (new_dao_pct >= 0 AND new_dao_pct <= 100),
  new_charity_pct INTEGER NOT NULL CHECK (new_charity_pct >= 0 AND new_charity_pct <= 100),
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pct_sum_check CHECK (new_founder_pct + new_dao_pct + new_charity_pct = 100)
);

-- Indexer state tracking
CREATE TABLE IF NOT EXISTS indexer_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_block_number BIGINT NOT NULL,
  last_block_timestamp TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_distributions_timestamp ON distributions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_distributions_router ON distributions(router);
CREATE INDEX IF NOT EXISTS idx_distributions_token ON distributions(token);
CREATE INDEX IF NOT EXISTS idx_distributions_block ON distributions(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_pending_splits_effective ON pending_splits(effective_at);
CREATE INDEX IF NOT EXISTS idx_pending_splits_applied ON pending_splits(applied);

-- Initialize indexer state if not exists
INSERT INTO indexer_state (id, last_block_number)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
`;

// ============================================================================
// DISTRIBUTION QUERIES
// ============================================================================

/**
 * Insert a distribution event
 */
export async function insertDistribution(event: DistributionEvent): Promise<number> {
  const db = getPool();

  const founderAmount = event.recipients.find(r => r.type === 'founder')?.amount || '0';
  const daoAmount = event.recipients.find(r => r.type === 'dao')?.amount || '0';
  const charityAmount = event.recipients.find(r => r.type === 'charity')?.amount || '0';

  const result = await db.query<{ id: number }>(
    `INSERT INTO distributions
     (tx_hash, block_number, timestamp, router, token, total_amount, founder_amount, dao_amount, charity_amount)
     VALUES ($1, $2, to_timestamp($3), $4, $5, $6, $7, $8, $9)
     ON CONFLICT (tx_hash) DO NOTHING
     RETURNING id`,
    [
      event.txHash,
      event.blockNumber,
      event.timestamp,
      event.router,
      event.token,
      event.amount,
      founderAmount,
      daoAmount,
      charityAmount
    ]
  );

  return result.rows[0]?.id || 0;
}

/**
 * Get distributions by date range
 */
export async function getDistributionsByDateRange(
  startDate: Date,
  endDate: Date,
  router?: RouterType
): Promise<DistributionRow[]> {
  const db = getPool();

  let query = `
    SELECT * FROM distributions
    WHERE timestamp >= $1 AND timestamp <= $2
  `;
  const params: (Date | string)[] = [startDate, endDate];

  if (router) {
    query += ` AND router = $3`;
    params.push(router);
  }

  query += ` ORDER BY timestamp DESC`;

  const result = await db.query<DistributionRow>(query, params);
  return result.rows;
}

/**
 * Get total distributions by router type
 */
export async function getTotalsByRouter(): Promise<RouterTotals[]> {
  const db = getPool();

  const result = await db.query<RouterTotals>(`
    SELECT
      router,
      COUNT(*) as distribution_count,
      SUM(total_amount) as total_distributed,
      SUM(founder_amount) as total_founder,
      SUM(dao_amount) as total_dao,
      SUM(charity_amount) as total_charity
    FROM distributions
    GROUP BY router
  `);

  return result.rows;
}

/**
 * Get recent distributions
 */
export async function getRecentDistributions(limit: number = 50): Promise<DistributionRow[]> {
  const db = getPool();

  const result = await db.query<DistributionRow>(
    `SELECT * FROM distributions ORDER BY timestamp DESC LIMIT $1`,
    [limit]
  );

  return result.rows;
}

// ============================================================================
// PENDING SPLIT QUERIES
// ============================================================================

/**
 * Insert a pending split schedule
 */
export async function insertPendingSplit(split: PendingSplit): Promise<number> {
  const db = getPool();

  const result = await db.query<{ id: number }>(
    `INSERT INTO pending_splits
     (router_address, scheduled_at, effective_at, new_founder_pct, new_dao_pct, new_charity_pct)
     VALUES ($1, to_timestamp($2), to_timestamp($3), $4, $5, $6)
     RETURNING id`,
    [
      split.routerAddress,
      split.scheduledAt,
      split.effectiveAt,
      split.newFounderPct,
      split.newDaoPct,
      split.newCharityPct
    ]
  );

  return result.rows[0].id;
}

/**
 * Get active (not yet applied) pending splits
 */
export async function getActivePendingSplits(): Promise<PendingSplitRow[]> {
  const db = getPool();

  const result = await db.query<PendingSplitRow>(
    `SELECT * FROM pending_splits WHERE applied = FALSE ORDER BY effective_at ASC`
  );

  return result.rows;
}

/**
 * Mark a pending split as applied
 */
export async function markSplitApplied(id: number): Promise<void> {
  const db = getPool();
  await db.query(`UPDATE pending_splits SET applied = TRUE WHERE id = $1`, [id]);
}

/**
 * Get upcoming splits (effective in the future)
 */
export async function getUpcomingSplits(): Promise<PendingSplitRow[]> {
  const db = getPool();

  const result = await db.query<PendingSplitRow>(
    `SELECT * FROM pending_splits
     WHERE applied = FALSE AND effective_at > NOW()
     ORDER BY effective_at ASC`
  );

  return result.rows;
}

// ============================================================================
// INDEXER STATE QUERIES
// ============================================================================

/**
 * Get the last indexed block number
 */
export async function getLastIndexedBlock(): Promise<number> {
  const db = getPool();

  const result = await db.query<{ last_block_number: string }>(
    `SELECT last_block_number FROM indexer_state WHERE id = 1`
  );

  return parseInt(result.rows[0]?.last_block_number || '0', 10);
}

/**
 * Update the last indexed block
 */
export async function updateLastIndexedBlock(
  blockNumber: number,
  timestamp?: Date
): Promise<void> {
  const db = getPool();

  await db.query(
    `UPDATE indexer_state
     SET last_block_number = $1,
         last_block_timestamp = $2,
         updated_at = NOW()
     WHERE id = 1`,
    [blockNumber, timestamp || null]
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Run migrations
 */
export async function runMigrations(): Promise<void> {
  const db = getPool();
  console.log('[DB] Running migrations...');
  await db.query(SCHEMA_SQL);
  console.log('[DB] Migrations complete.');
}

/**
 * Check if distribution already exists
 */
export async function distributionExists(txHash: string): Promise<boolean> {
  const db = getPool();

  const result = await db.query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM distributions WHERE tx_hash = $1)`,
    [txHash]
  );

  return result.rows[0].exists;
}

/**
 * Get database health status
 */
export async function getDbHealth(): Promise<DbHealth> {
  const db = getPool();

  try {
    const start = Date.now();
    await db.query('SELECT 1');
    const latency = Date.now() - start;

    const stats = await db.query<{ count: string }>(`SELECT COUNT(*) FROM distributions`);

    return {
      connected: true,
      latencyMs: latency,
      totalDistributions: parseInt(stats.rows[0].count, 10)
    };
  } catch (error) {
    return {
      connected: false,
      latencyMs: -1,
      totalDistributions: 0,
      error: (error as Error).message
    };
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DistributionRow {
  id: number;
  tx_hash: string;
  block_number: string;
  timestamp: Date;
  router: RouterType;
  token: string;
  total_amount: string;
  founder_amount: string;
  dao_amount: string;
  charity_amount: string;
  created_at: Date;
}

export interface PendingSplitRow {
  id: number;
  router_address: string;
  scheduled_at: Date;
  effective_at: Date;
  new_founder_pct: number;
  new_dao_pct: number;
  new_charity_pct: number;
  applied: boolean;
  created_at: Date;
}

export interface RouterTotals {
  router: RouterType;
  distribution_count: string;
  total_distributed: string;
  total_founder: string;
  total_dao: string;
  total_charity: string;
}

export interface DbHealth {
  connected: boolean;
  latencyMs: number;
  totalDistributions: number;
  error?: string;
}
