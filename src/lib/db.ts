/**
 * Database abstraction layer.
 * Uses Neon PostgreSQL when DATABASE_URL is set (production/Vercel),
 * falls back to SQLite via better-sqlite3 for local development.
 */

// ---------------------------------------------------------------------------
// Shared interface
// ---------------------------------------------------------------------------
export interface DbResult {
  rows: Record<string, unknown>[];
  changes?: number;
}

export interface DbClient {
  query(sql: string, params?: unknown[]): Promise<DbResult>;
  execute(sql: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// PostgreSQL (standard pg) implementation — works with Azure, Neon, any PG
// ---------------------------------------------------------------------------
function createPgClient(databaseUrl: string): DbClient {
  // Use Neon serverless driver for Neon URLs (WebSocket-based),
  // standard pg driver for everything else (Azure, local PG, etc.)
  const isNeon = databaseUrl.includes(".neon.tech");

  let pool: { query: (q: string, p?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }> };

  if (isNeon) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool, neonConfig } = require("@neondatabase/serverless") as typeof import("@neondatabase/serverless");
    if (typeof WebSocket === "undefined") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        neonConfig.webSocketConstructor = require("ws");
      } catch { /* ws not installed — running on Vercel */ }
    }
    pool = new Pool({ connectionString: databaseUrl });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool: PgPool } = require("pg") as typeof import("pg");
    // max:5 — PGBouncer (port 6432) multiplexes app connections; keep pool small per replica.
    // allowExitOnIdle: true — lets the process exit cleanly in cron/job contexts.
    pool = new PgPool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      allowExitOnIdle: true,
    });
  }

  return {
    async query(query: string, params: unknown[] = []): Promise<DbResult> {
      // Convert ? placeholders to $1, $2, … for PostgreSQL
      let idx = 0;
      const pgQuery = query.replace(/\?/g, () => `$${++idx}`);
      const result = await pool.query(pgQuery, params);
      return { rows: result.rows as Record<string, unknown>[], changes: result.rowCount ?? 0 };
    },

    async execute(statements: string): Promise<void> {
      // Split on semicolons for multi-statement DDL
      const parts = statements
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const part of parts) {
        await pool.query(part);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// SQLite implementation (wraps synchronous better-sqlite3 in async interface)
// ---------------------------------------------------------------------------
function createSqliteClient(): DbClient {
  let Database: typeof import("better-sqlite3");
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Database = require("better-sqlite3") as typeof import("better-sqlite3");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to load better-sqlite3 native module. ` +
      `This usually means native binaries need rebuilding for your platform. ` +
      `Run: npm rebuild better-sqlite3\n` +
      `Original error: ${msg}`
    );
  }
  const path = require("path") as typeof import("path");
  const fs = require("fs") as typeof import("fs");

  const isVercel = !!process.env.VERCEL;

  function resolveDbPath(): string {
    if (process.env.DB_PATH) return process.env.DB_PATH;
    const sourceDb = path.join(process.cwd(), "data", "udc-water.db");
    if (isVercel) {
      const tmpDb = "/tmp/udc-water.db";
      if (!fs.existsSync(tmpDb) && fs.existsSync(sourceDb)) {
        fs.copyFileSync(sourceDb, tmpDb);
      }
      return tmpDb;
    }
    return sourceDb;
  }

  const dbPath = resolveDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return {
    async query(sql: string, params: unknown[] = []): Promise<DbResult> {
      const trimmed = sql.trim().toUpperCase();
      if (
        trimmed.startsWith("INSERT") ||
        trimmed.startsWith("UPDATE") ||
        trimmed.startsWith("DELETE")
      ) {
        // A mutation with RETURNING produces rows, and better-sqlite3 throws if
        // such a statement is run with .run(). Postgres has always supported
        // RETURNING here, so route it to .all() to keep both backends
        // behaviourally identical for callers that need the inserted id.
        if (/\bRETURNING\b/i.test(sql)) {
          const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
          return { rows, changes: rows.length };
        }
        const info = db.prepare(sql).run(...params);
        return { rows: [], changes: info.changes };
      }
      const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
      return { rows };
    },

    async execute(statements: string): Promise<void> {
      db.exec(statements);
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton & schema init
// ---------------------------------------------------------------------------
let client: DbClient | null = null;
let clientPromise: Promise<DbClient> | null = null;
let schemaReady = false;

const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('river', 'stream', 'stormwater', 'green-infrastructure')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'maintenance', 'offline')),
    parameters TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id TEXT NOT NULL REFERENCES stations(id),
    timestamp TEXT NOT NULL,
    temperature REAL,
    dissolved_oxygen REAL,
    ph REAL,
    turbidity REAL,
    conductivity REAL,
    ecoli_count REAL,
    nitrate_n REAL,
    phosphorus REAL,
    source TEXT DEFAULT 'manual',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_readings_station_time_source
    ON readings(station_id, timestamp, source);

  CREATE INDEX IF NOT EXISTS idx_readings_timestamp
    ON readings(timestamp DESC);

  CREATE TABLE IF NOT EXISTS ingestion_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('success', 'error')),
    records_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS parameters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    usgs_pcode TEXT,
    wqp_characteristic TEXT,
    unit TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('physical', 'nutrients', 'metals', 'biological', 'organic')),
    epa_min REAL,
    epa_max REAL,
    description TEXT,
    display_order INTEGER
  );

  CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id TEXT NOT NULL REFERENCES stations(id),
    parameter_id TEXT NOT NULL REFERENCES parameters(id),
    timestamp TEXT NOT NULL,
    value REAL NOT NULL,
    qualifier TEXT,
    source TEXT DEFAULT 'manual',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_measurements_station_param_time_source
    ON measurements(station_id, parameter_id, timestamp, source);

  CREATE INDEX IF NOT EXISTS idx_measurements_timestamp
    ON measurements(timestamp DESC);

  CREATE INDEX IF NOT EXISTS idx_measurements_parameter
    ON measurements(parameter_id);

  -- Level 2 researcher access requests. Backs the "Request Researcher Access"
  -- button published on UDC's WRRI page. This is a request queue, NOT an auth
  -- system - approval is recorded here and acted on by WRRI manually until
  -- identity lands (see docs/WQIS_LEVEL2_ACCESS_DESIGN.md).
  CREATE TABLE IF NOT EXISTS access_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    affiliation TEXT NOT NULL,
    requester_role TEXT NOT NULL CHECK(requester_role IN ('student', 'faculty', 'researcher', 'partner', 'other')),
    purpose TEXT NOT NULL,
    datasets TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'denied')),
    -- A denial must name a reason from a fixed list. Free-form judgement is
    -- where inconsistent treatment hides; a controlled vocabulary makes the
    -- basis for every refusal reviewable.
    decision_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Retention: rows are purged after RETENTION days (see purgeExpiredRequests).
    -- No IP address, user agent or any other identifier beyond what the person
    -- typed is stored against a request.
    reviewed_at TEXT,
    reviewed_by TEXT,
    review_note TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_access_requests_status
    ON access_requests(status, created_at DESC);
`;

const PG_SCHEMA = `
  CREATE TABLE IF NOT EXISTS stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('river', 'stream', 'stormwater', 'green-infrastructure')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'maintenance', 'offline')),
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

  -- NOTE: a one-off duplicate cleanup used to run here on every boot. See
  -- scripts/dedupe-legacy-rows.sql - it is a migration, not a startup step.
  CREATE UNIQUE INDEX IF NOT EXISTS idx_readings_station_time_source
    ON readings(station_id, timestamp, source);

  CREATE INDEX IF NOT EXISTS idx_readings_timestamp
    ON readings(timestamp DESC);

  CREATE TABLE IF NOT EXISTS ingestion_log (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('success', 'error')),
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
    category TEXT NOT NULL CHECK(category IN ('physical', 'nutrients', 'metals', 'biological', 'organic')),
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

  -- Created BEFORE the maintenance statements below. The measurements dedup
  -- DELETE grows more expensive as the table grows, and if it fails or times
  -- out every statement after it is skipped - which is exactly how this table
  -- ended up missing in production on first deploy.
  -- See the matching note in SQLITE_SCHEMA.
  CREATE TABLE IF NOT EXISTS access_requests (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    affiliation TEXT NOT NULL,
    requester_role TEXT NOT NULL CHECK(requester_role IN ('student', 'faculty', 'researcher', 'partner', 'other')),
    purpose TEXT NOT NULL,
    datasets TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'denied')),
    -- See the matching note in SQLITE_SCHEMA.
    decision_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    review_note TEXT
  );

  ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS decision_reason TEXT;

  CREATE INDEX IF NOT EXISTS idx_access_requests_status
    ON access_requests(status, created_at DESC);

  -- NOTE: see the matching note above readings' unique index.
  CREATE UNIQUE INDEX IF NOT EXISTS idx_measurements_station_param_time_source
    ON measurements(station_id, parameter_id, timestamp, source);

  CREATE INDEX IF NOT EXISTS idx_measurements_timestamp
    ON measurements(timestamp DESC);

  CREATE INDEX IF NOT EXISTS idx_measurements_parameter
    ON measurements(parameter_id);

`;

function useNeon(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * Applies the schema. Runs once per process, awaited by every caller.
 *
 * Everything here must be CHEAP and IDEMPOTENT. It runs on every cold start, and
 * every request waits for it.
 *
 * Two `DELETE ... WHERE id NOT IN (SELECT MIN(id) ... GROUP BY ...)` statements
 * used to sit in this path to clear duplicates before the unique indexes were
 * created. They were fine against a small table and became full anti-join scans
 * as readings and measurements grew into the millions - taking over 60s and
 * timing out every database-backed request on a cold container. They have moved
 * to scripts/dedupe-legacy-rows.sql, to be run by hand if a database ever needs
 * it. The unique indexes plus ON CONFLICT upserts in the ingestion pipeline mean
 * new duplicates cannot occur.
 */
async function initSchema(db: DbClient): Promise<void> {
  if (schemaReady) return;
  await db.execute(useNeon() ? PG_SCHEMA : SQLITE_SCHEMA);
  schemaReady = true;
}

/**
 * Get the database client. Initialises schema on first call.
 */
export async function getDbClient(): Promise<DbClient> {
  // Every caller awaits the SAME initialisation promise.
  //
  // This previously assigned `client` and then awaited initSchema separately,
  // which had two consequences: a concurrent request could receive the client
  // before the schema existed, and if initSchema threw, the half-built client
  // stayed cached so no later request ever retried it. A single failed startup
  // left tables permanently missing while unrelated endpoints kept working.
  if (!clientPromise) {
    clientPromise = (async () => {
      const databaseUrl = process.env.DATABASE_URL;
      const created = databaseUrl ? createPgClient(databaseUrl) : createSqliteClient();
      await initSchema(created);
      client = created;
      return created;
    })().catch((error) => {
      // Clear the cache so the next request retries rather than inheriting a
      // permanently broken connection.
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}

// ---------------------------------------------------------------------------
// Legacy synchronous API (for gradual migration — local SQLite only)
// ---------------------------------------------------------------------------
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let legacyDb: Database.Database | null = null;

/** @deprecated Use getDbClient() instead */
export function getDb(): Database.Database {
  if (useNeon()) {
    throw new Error("getDb() is not supported with PostgreSQL. Use getDbClient() instead.");
  }
  if (!legacyDb) {
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "udc-water.db");
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    legacyDb = new Database(dbPath);
    legacyDb.pragma("journal_mode = WAL");
    legacyDb.pragma("foreign_keys = ON");
    legacyDb.exec(SQLITE_SCHEMA);
  }
  return legacyDb;
}
