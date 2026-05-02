/**
 * Migrate UDC-WQIS data from Neon PostgreSQL to Azure PostgreSQL.
 *
 * Usage:
 *   node scripts/migrate-to-azure.mjs
 *
 * Requires env vars in .env.local:
 *   DATABASE_URL       — Neon source connection string
 *   AZURE_DATABASE_URL — Azure target connection string
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (match) process.env[match[1]] = match[2];
}

const NEON_URL = process.env.DATABASE_URL;
const AZURE_URL = process.env.AZURE_DATABASE_URL;

if (!NEON_URL) { console.error('Missing DATABASE_URL in .env.local'); process.exit(1); }
if (!AZURE_URL) { console.error('Missing AZURE_DATABASE_URL in .env.local — add it first'); process.exit(1); }

const TABLES = ['stations', 'parameters', 'readings', 'measurements', 'ingestion_log'];

async function migrate() {
  console.log('=== UDC-WQIS: Neon → Azure PostgreSQL Migration ===\n');

  // Connect to both databases
  const neon = new pg.Pool({ connectionString: NEON_URL, ssl: { rejectUnauthorized: false } });
  const azure = new pg.Pool({ connectionString: AZURE_URL, ssl: { rejectUnauthorized: false } });

  try {
    // Test connections
    console.log('[1/5] Testing connections...');
    const neonTest = await neon.query('SELECT version()');
    console.log(`  Neon:  ${neonTest.rows[0].version.split(',')[0]}`);
    const azureTest = await azure.query('SELECT version()');
    console.log(`  Azure: ${azureTest.rows[0].version.split(',')[0]}`);

    // Create schema on Azure
    console.log('\n[2/5] Creating schema on Azure...');
    const schema = `
      CREATE TABLE IF NOT EXISTS stations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        parameters TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        station_id TEXT NOT NULL REFERENCES stations(id),
        timestamp TIMESTAMPTZ NOT NULL,
        temperature DOUBLE PRECISION,
        dissolved_oxygen DOUBLE PRECISION,
        ph DOUBLE PRECISION,
        turbidity DOUBLE PRECISION,
        conductivity DOUBLE PRECISION,
        ecoli_count DOUBLE PRECISION,
        nitrate_n DOUBLE PRECISION,
        phosphorus DOUBLE PRECISION,
        source TEXT DEFAULT 'manual',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ingestion_log (
        id SERIAL PRIMARY KEY,
        source TEXT NOT NULL,
        status TEXT NOT NULL,
        records_count INTEGER DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS parameters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        usgs_pcode TEXT,
        wqp_characteristic TEXT,
        unit TEXT NOT NULL,
        category TEXT NOT NULL,
        epa_min DOUBLE PRECISION,
        epa_max DOUBLE PRECISION,
        description TEXT,
        display_order INTEGER
      );

      CREATE TABLE IF NOT EXISTS measurements (
        id SERIAL PRIMARY KEY,
        station_id TEXT NOT NULL REFERENCES stations(id),
        parameter_id TEXT NOT NULL REFERENCES parameters(id),
        timestamp TIMESTAMPTZ NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        qualifier TEXT,
        source TEXT DEFAULT 'manual',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Execute each statement separately
    for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
      await azure.query(stmt);
    }
    console.log('  Schema created successfully.');

    // Migrate data table by table
    console.log('\n[3/5] Migrating data...');
    const counts = {};

    for (const table of TABLES) {
      const { rows } = await neon.query(`SELECT * FROM ${table}`);
      counts[table] = { neon: rows.length, azure: 0 };

      if (rows.length === 0) {
        console.log(`  ${table}: 0 rows (empty)`);
        continue;
      }

      // Clear existing data on Azure (idempotent re-run)
      if (table === 'measurements') {
        await azure.query('DELETE FROM measurements');
      } else if (table === 'readings') {
        await azure.query('DELETE FROM readings');
      } else if (table === 'ingestion_log') {
        await azure.query('DELETE FROM ingestion_log');
      }

      const columns = Object.keys(rows[0]);
      // Filter out 'id' for SERIAL columns to let Azure auto-generate
      const isSerial = ['readings', 'measurements', 'ingestion_log'].includes(table);
      const insertCols = isSerial ? columns.filter(c => c !== 'id') : columns;

      // Batch insert (100 rows at a time)
      const batchSize = 100;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const values = [];
        const placeholders = [];
        let paramIdx = 1;

        for (const row of batch) {
          const rowPlaceholders = [];
          for (const col of insertCols) {
            values.push(row[col]);
            rowPlaceholders.push(`$${paramIdx++}`);
          }
          placeholders.push(`(${rowPlaceholders.join(', ')})`);
        }

        const insertSql = `INSERT INTO ${table} (${insertCols.join(', ')}) VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`;
        const result = await azure.query(insertSql, values);
        inserted += result.rowCount || 0;
      }

      counts[table].azure = inserted;
      console.log(`  ${table}: ${rows.length} rows from Neon → ${inserted} inserted to Azure`);
    }

    // Create indexes
    console.log('\n[4/5] Creating indexes...');
    const indexes = [
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_readings_station_time_source ON readings(station_id, timestamp, source)',
      'CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp DESC)',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_measurements_station_param_time_source ON measurements(station_id, parameter_id, timestamp, source)',
      'CREATE INDEX IF NOT EXISTS idx_measurements_timestamp ON measurements(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_measurements_parameter ON measurements(parameter_id)',
    ];
    for (const idx of indexes) {
      await azure.query(idx);
    }
    console.log('  Indexes created.');

    // Verify counts
    console.log('\n[5/5] Verifying migration...');
    console.log('  Table             | Neon    | Azure');
    console.log('  ------------------|---------|-------');
    let allMatch = true;
    for (const table of TABLES) {
      const azureCount = await azure.query(`SELECT COUNT(*) as c FROM ${table}`);
      const azureN = parseInt(azureCount.rows[0].c);
      const match = azureN >= counts[table].neon ? 'OK' : 'MISMATCH';
      if (match === 'MISMATCH') allMatch = false;
      console.log(`  ${table.padEnd(18)}| ${String(counts[table].neon).padEnd(8)}| ${azureN} ${match}`);
    }

    console.log(`\n=== Migration ${allMatch ? 'SUCCESSFUL' : 'COMPLETED WITH WARNINGS'} ===`);
    console.log(`\nAzure connection string (add to .env.local as AZURE_DATABASE_URL):`);
    console.log(`  Already configured.\n`);
    console.log(`Next steps:`);
    console.log(`  1. Test app locally: DATABASE_URL=<azure-url> npm run dev`);
    console.log(`  2. Update Vercel env var DATABASE_URL to Azure connection string`);
    console.log(`  3. Redeploy via git push`);

  } catch (err) {
    console.error('\nMigration failed:', err.message);
    throw err;
  } finally {
    await neon.end();
    await azure.end();
  }
}

migrate().catch(() => process.exit(1));
