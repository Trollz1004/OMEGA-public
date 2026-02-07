-- ============================================================================
-- FOR THE KIDS Platform - Initial Database Schema
-- Gospel V1.4.1 SURVIVAL MODE
-- Migration: 001_initial.sql
-- ============================================================================

-- Distribution events table
-- Tracks all Distributed events from CharityRouter and DatingRouter
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
-- Tracks SplitScheduled events and their application status
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
-- Tracks the last processed block for resumable indexing
CREATE TABLE IF NOT EXISTS indexer_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_block_number BIGINT NOT NULL,
  last_block_timestamp TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Distribution queries
CREATE INDEX IF NOT EXISTS idx_distributions_timestamp ON distributions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_distributions_router ON distributions(router);
CREATE INDEX IF NOT EXISTS idx_distributions_token ON distributions(token);
CREATE INDEX IF NOT EXISTS idx_distributions_block ON distributions(block_number DESC);

-- Pending split queries
CREATE INDEX IF NOT EXISTS idx_pending_splits_effective ON pending_splits(effective_at);
CREATE INDEX IF NOT EXISTS idx_pending_splits_applied ON pending_splits(applied);
CREATE INDEX IF NOT EXISTS idx_pending_splits_router ON pending_splits(router_address);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Initialize indexer state (block 0 means start from configured start block)
INSERT INTO indexer_state (id, last_block_number)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE distributions IS 'Tracks all distribution events from CharityRouter and DatingRouter contracts';
COMMENT ON TABLE pending_splits IS 'Tracks scheduled split ratio changes for DatingRouter';
COMMENT ON TABLE indexer_state IS 'Tracks indexer progress for resumable block processing';

COMMENT ON COLUMN distributions.router IS 'charity = 100% to verified pediatric charities, dating = survival mode split';
COMMENT ON COLUMN distributions.total_amount IS 'Total amount distributed in token base units';
COMMENT ON COLUMN distributions.founder_amount IS 'Amount sent to founder (dating router only, survival mode)';
COMMENT ON COLUMN distributions.dao_amount IS 'Amount sent to DAO treasury';
COMMENT ON COLUMN distributions.charity_amount IS 'Amount sent to verified pediatric charities';

COMMENT ON COLUMN pending_splits.effective_at IS 'When the new split ratios become active';
COMMENT ON COLUMN pending_splits.applied IS 'TRUE once the split has been applied on-chain';
