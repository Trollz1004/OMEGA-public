/**
 * Database Migration Runner
 * FOR THE KIDS Platform - Gospel V1.4.1 SURVIVAL MODE
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { initDb, closeDb, getPool } from './db';

dotenv.config();

async function runMigrations(): Promise<void> {
  console.log('========================================');
  console.log('FOR THE KIDS Platform - Migration Runner');
  console.log('Gospel V1.4.1 SURVIVAL MODE');
  console.log('========================================\n');

  // Initialize database
  initDb({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'indexer',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  });

  const pool = getPool();

  // Create migrations tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Get list of migration files
  const migrationsDir = path.join(__dirname, '..', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('[Migrate] No migrations directory found');
    await closeDb();
    return;
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`[Migrate] Found ${migrationFiles.length} migration files`);

  // Get already executed migrations
  const result = await pool.query<{ name: string }>('SELECT name FROM migrations');
  const executedMigrations = new Set(result.rows.map(r => r.name));

  // Run pending migrations
  for (const file of migrationFiles) {
    if (executedMigrations.has(file)) {
      console.log(`[Migrate] Skipping ${file} (already executed)`);
      continue;
    }

    console.log(`[Migrate] Running ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`[Migrate] Completed ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`[Migrate] Failed ${file}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  console.log('\n[Migrate] All migrations complete');
  await closeDb();
}

runMigrations().catch((error) => {
  console.error('[Migrate] Fatal error:', error);
  process.exit(1);
});
