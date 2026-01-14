/**
 * FOR THE KIDS Platform - Event Indexer Service
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Tracks on-chain distributions from CharityRouter and DatingRouter
 * on Base Mainnet for verified pediatric charities.
 *
 * "Until no kid is in need"
 */

import { ethers, Contract, Log, Provider, WebSocketProvider, JsonRpcProvider } from 'ethers';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import * as dotenv from 'dotenv';

import {
  DistributionEvent,
  PendingSplit,
  CHARITY_ROUTER_ABI,
  DATING_ROUTER_ABI,
  EVENT_SIGNATURES,
  parseCharityDistributed,
  parseDatingDistributed,
  parseSplitScheduled,
  buildDistributionEvent,
  RouterType
} from './events';

import {
  initDb,
  closeDb,
  runMigrations,
  getLastIndexedBlock,
  updateLastIndexedBlock,
  insertDistribution,
  insertPendingSplit,
  getActivePendingSplits,
  markSplitApplied,
  getRecentDistributions,
  getDbHealth,
  getUpcomingSplits
} from './db';

import { createExportRouter } from './export';

// Load environment variables
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

interface Config {
  // RPC Configuration
  rpcUrl: string;
  wsUrl?: string;

  // Contract Addresses
  charityRouterAddress: string;
  datingRouterAddress: string;

  // Database
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;

  // Server
  port: number;

  // Indexer Settings
  startBlock: number;
  batchSize: number;
  pollIntervalMs: number;
}

function loadConfig(): Config {
  return {
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    wsUrl: process.env.BASE_WS_URL,

    charityRouterAddress: process.env.CHARITY_ROUTER_ADDRESS || '',
    datingRouterAddress: process.env.DATING_ROUTER_ADDRESS || '',

    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: parseInt(process.env.DB_PORT || '5432', 10),
    dbName: process.env.DB_NAME || 'indexer',
    dbUser: process.env.DB_USER || 'postgres',
    dbPassword: process.env.DB_PASSWORD || '',

    port: parseInt(process.env.PORT || '3000', 10),

    startBlock: parseInt(process.env.START_BLOCK || '0', 10),
    batchSize: parseInt(process.env.BATCH_SIZE || '1000', 10),
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '12000', 10)
  };
}

// ============================================================================
// INDEXER SERVICE
// ============================================================================

class IndexerService {
  private config: Config;
  private provider: Provider;
  private charityRouter: Contract | null = null;
  private datingRouter: Contract | null = null;
  private isRunning: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(config: Config) {
    this.config = config;

    // Use WebSocket if available for real-time events, otherwise HTTP
    if (config.wsUrl) {
      console.log('[Indexer] Using WebSocket provider');
      this.provider = new WebSocketProvider(config.wsUrl);
    } else {
      console.log('[Indexer] Using HTTP provider');
      this.provider = new JsonRpcProvider(config.rpcUrl);
    }
  }

  /**
   * Initialize contracts
   */
  async initialize(): Promise<void> {
    if (this.config.charityRouterAddress) {
      this.charityRouter = new Contract(
        this.config.charityRouterAddress,
        CHARITY_ROUTER_ABI,
        this.provider
      );
      console.log(`[Indexer] CharityRouter: ${this.config.charityRouterAddress}`);
    }

    if (this.config.datingRouterAddress) {
      this.datingRouter = new Contract(
        this.config.datingRouterAddress,
        DATING_ROUTER_ABI,
        this.provider
      );
      console.log(`[Indexer] DatingRouter: ${this.config.datingRouterAddress}`);
    }

    // Test connection
    const blockNumber = await this.provider.getBlockNumber();
    console.log(`[Indexer] Connected to Base. Current block: ${blockNumber}`);
  }

  /**
   * Start the indexer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[Indexer] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[Indexer] Starting...');

    // Set up event listeners for real-time indexing
    await this.setupEventListeners();

    // Start historical sync
    await this.syncHistorical();

    // Start polling for new blocks (backup for WebSocket)
    this.startPolling();

    console.log('[Indexer] Started successfully');
  }

  /**
   * Stop the indexer
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Remove event listeners
    if (this.charityRouter) {
      this.charityRouter.removeAllListeners();
    }
    if (this.datingRouter) {
      this.datingRouter.removeAllListeners();
    }

    console.log('[Indexer] Stopped');
  }

  /**
   * Set up real-time event listeners
   */
  private async setupEventListeners(): Promise<void> {
    // CharityRouter Distributed events
    if (this.charityRouter) {
      this.charityRouter.on('Distributed', async (token, amount, charityAmount, event) => {
        console.log(`[Indexer] CharityRouter Distributed event: ${event.log.transactionHash}`);
        await this.processCharityEvent(event.log);
      });
    }

    // DatingRouter Distributed events
    if (this.datingRouter) {
      this.datingRouter.on('Distributed', async (token, total, founder, dao, charity, event) => {
        console.log(`[Indexer] DatingRouter Distributed event: ${event.log.transactionHash}`);
        await this.processDatingEvent(event.log);
      });

      // SplitScheduled events
      this.datingRouter.on('SplitScheduled', async (effectiveTime, founderPct, daoPct, charityPct, event) => {
        console.log(`[Indexer] SplitScheduled event: ${event.log.transactionHash}`);
        await this.processSplitScheduled(event.log);
      });
    }
  }

  /**
   * Sync historical events
   */
  private async syncHistorical(): Promise<void> {
    const lastBlock = await getLastIndexedBlock();
    const currentBlock = await this.provider.getBlockNumber();

    let fromBlock = lastBlock > 0 ? lastBlock + 1 : this.config.startBlock;

    if (fromBlock >= currentBlock) {
      console.log('[Indexer] Already synced to current block');
      return;
    }

    console.log(`[Indexer] Syncing from block ${fromBlock} to ${currentBlock}`);

    while (fromBlock < currentBlock && this.isRunning) {
      const toBlock = Math.min(fromBlock + this.config.batchSize - 1, currentBlock);

      console.log(`[Indexer] Processing blocks ${fromBlock} - ${toBlock}`);

      // Fetch CharityRouter events
      if (this.charityRouter) {
        const charityLogs = await this.provider.getLogs({
          address: this.config.charityRouterAddress,
          topics: [EVENT_SIGNATURES.CHARITY_DISTRIBUTED],
          fromBlock,
          toBlock
        });

        for (const log of charityLogs) {
          await this.processCharityEvent(log);
        }
      }

      // Fetch DatingRouter events
      if (this.datingRouter) {
        const datingDistributedLogs = await this.provider.getLogs({
          address: this.config.datingRouterAddress,
          topics: [EVENT_SIGNATURES.DATING_DISTRIBUTED],
          fromBlock,
          toBlock
        });

        for (const log of datingDistributedLogs) {
          await this.processDatingEvent(log);
        }

        const splitLogs = await this.provider.getLogs({
          address: this.config.datingRouterAddress,
          topics: [EVENT_SIGNATURES.SPLIT_SCHEDULED],
          fromBlock,
          toBlock
        });

        for (const log of splitLogs) {
          await this.processSplitScheduled(log);
        }
      }

      // Update checkpoint
      await updateLastIndexedBlock(toBlock);
      fromBlock = toBlock + 1;
    }

    console.log('[Indexer] Historical sync complete');
  }

  /**
   * Start polling for new blocks
   */
  private startPolling(): void {
    this.pollInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const lastBlock = await getLastIndexedBlock();
        const currentBlock = await this.provider.getBlockNumber();

        if (currentBlock > lastBlock) {
          await this.syncHistorical();
        }
      } catch (error) {
        console.error('[Indexer] Polling error:', error);
      }
    }, this.config.pollIntervalMs);
  }

  /**
   * Process CharityRouter Distributed event
   */
  private async processCharityEvent(log: Log): Promise<void> {
    try {
      const parsed = parseCharityDistributed(log);
      const block = await this.provider.getBlock(log.blockNumber);
      const timestamp = block?.timestamp || Math.floor(Date.now() / 1000);

      // Get charity address from contract
      let charityAddress = '';
      if (this.charityRouter) {
        charityAddress = await this.charityRouter.charity();
      }

      const event = buildDistributionEvent(log, parsed, 'charity', timestamp, {
        charity: charityAddress
      });

      await insertDistribution(event);
      console.log(`[Indexer] Stored CharityRouter distribution: ${log.transactionHash}`);
    } catch (error) {
      console.error('[Indexer] Error processing CharityRouter event:', error);
    }
  }

  /**
   * Process DatingRouter Distributed event
   */
  private async processDatingEvent(log: Log): Promise<void> {
    try {
      const parsed = parseDatingDistributed(log);
      const block = await this.provider.getBlock(log.blockNumber);
      const timestamp = block?.timestamp || Math.floor(Date.now() / 1000);

      // Get addresses from contract
      let addresses = { founder: '', dao: '', charity: '' };
      if (this.datingRouter) {
        addresses = {
          founder: await this.datingRouter.FOUNDER(),
          dao: await this.datingRouter.DAO_TREASURY(),
          charity: await this.datingRouter.CHARITY()
        };
      }

      const event = buildDistributionEvent(log, parsed, 'dating', timestamp, addresses);

      await insertDistribution(event);
      console.log(`[Indexer] Stored DatingRouter distribution: ${log.transactionHash}`);
    } catch (error) {
      console.error('[Indexer] Error processing DatingRouter event:', error);
    }
  }

  /**
   * Process SplitScheduled event
   */
  private async processSplitScheduled(log: Log): Promise<void> {
    try {
      const parsed = parseSplitScheduled(log);

      const split: PendingSplit = {
        routerAddress: this.config.datingRouterAddress,
        scheduledAt: Number(parsed.scheduledTime),
        effectiveAt: Number(parsed.effectiveTime),
        newFounderPct: Number(parsed.newFounderPct),
        newDaoPct: Number(parsed.newDaoPct),
        newCharityPct: Number(parsed.newCharityPct)
      };

      await insertPendingSplit(split);
      console.log(`[Indexer] Stored SplitScheduled: effective at ${new Date(split.effectiveAt * 1000).toISOString()}`);
    } catch (error) {
      console.error('[Indexer] Error processing SplitScheduled event:', error);
    }
  }

  /**
   * Get indexer status
   */
  async getStatus(): Promise<IndexerStatus> {
    const lastBlock = await getLastIndexedBlock();
    const currentBlock = await this.provider.getBlockNumber();
    const dbHealth = await getDbHealth();

    return {
      isRunning: this.isRunning,
      lastIndexedBlock: lastBlock,
      currentBlock,
      blocksBehind: currentBlock - lastBlock,
      database: dbHealth,
      contracts: {
        charityRouter: this.config.charityRouterAddress || 'not configured',
        datingRouter: this.config.datingRouterAddress || 'not configured'
      }
    };
  }
}

// ============================================================================
// API SERVER
// ============================================================================

function createServer(indexer: IndexerService): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', async (req: Request, res: Response) => {
    const status = await indexer.getStatus();
    res.json({
      status: status.isRunning ? 'healthy' : 'stopped',
      ...status
    });
  });

  // Recent distributions
  app.get('/distributions', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const distributions = await getRecentDistributions(limit);
      res.json({ count: distributions.length, distributions });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Upcoming splits
  app.get('/pending-splits', async (req: Request, res: Response) => {
    try {
      const splits = await getUpcomingSplits();
      res.json({ count: splits.length, splits });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Export routes
  app.use('/export', createExportRouter());

  // Root
  app.get('/', (req: Request, res: Response) => {
    res.json({
      service: 'FOR THE KIDS Platform - Event Indexer',
      version: 'Gospel V1.4.1 SURVIVAL MODE',
      endpoints: [
        'GET /health - Service health and status',
        'GET /distributions - Recent distributions',
        'GET /pending-splits - Upcoming split changes',
        'GET /export/csv - Export distributions as CSV',
        'GET /export/json - Export distributions as JSON',
        'GET /export/summary - Export summary statistics'
      ],
      mission: 'Until no kid is in need'
    });
  });

  return app;
}

// ============================================================================
// CRON JOBS
// ============================================================================

function setupCronJobs(indexer: IndexerService): void {
  // Check for pending splits that should be marked as applied
  cron.schedule('*/5 * * * *', async () => {
    try {
      const activeSplits = await getActivePendingSplits();
      const now = Date.now();

      for (const split of activeSplits) {
        if (new Date(split.effective_at).getTime() <= now) {
          await markSplitApplied(split.id);
          console.log(`[Cron] Marked split ${split.id} as applied`);
        }
      }
    } catch (error) {
      console.error('[Cron] Error checking pending splits:', error);
    }
  });

  // Log status every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const status = await indexer.getStatus();
      console.log(`[Cron] Status: ${status.blocksBehind} blocks behind, ${status.database.totalDistributions} distributions indexed`);
    } catch (error) {
      console.error('[Cron] Error logging status:', error);
    }
  });
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

interface IndexerStatus {
  isRunning: boolean;
  lastIndexedBlock: number;
  currentBlock: number;
  blocksBehind: number;
  database: {
    connected: boolean;
    latencyMs: number;
    totalDistributions: number;
    error?: string;
  };
  contracts: {
    charityRouter: string;
    datingRouter: string;
  };
}

async function main(): Promise<void> {
  console.log('========================================');
  console.log('FOR THE KIDS Platform - Event Indexer');
  console.log('Gospel V1.4.1 SURVIVAL MODE');
  console.log('"Until no kid is in need"');
  console.log('========================================\n');

  const config = loadConfig();

  // Initialize database
  console.log('[Main] Initializing database...');
  initDb({
    host: config.dbHost,
    port: config.dbPort,
    database: config.dbName,
    user: config.dbUser,
    password: config.dbPassword
  });

  await runMigrations();

  // Initialize indexer
  console.log('[Main] Initializing indexer...');
  const indexer = new IndexerService(config);
  await indexer.initialize();

  // Start indexer
  await indexer.start();

  // Set up cron jobs
  setupCronJobs(indexer);

  // Start API server
  const app = createServer(indexer);
  app.listen(config.port, () => {
    console.log(`[Main] API server listening on port ${config.port}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Main] Received ${signal}, shutting down...`);
    await indexer.stop();
    await closeDb();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Run
main().catch((error) => {
  console.error('[Main] Fatal error:', error);
  process.exit(1);
});
