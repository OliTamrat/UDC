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
// PostgreSQL (Neon) implementation
// ---------------------------------------------------------------------------
function createNeonClient(databaseUrl: string): DbClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool, neonConfig } = require("@neondatabase/serverless") as typeof import("@neondatabase/serverless");
  // In Node.js (local dev), we need a WebSocket polyfill; on Vercel it's built-in
  if (typeof WebSocket === "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      neonConfig.webSocketConstructor = require("ws");
    } catch { /* ws not installed — running on Vercel */ }
  }
  const pool = new Pool({ connectionString: databaseUrl });

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

  CREATE INDEX IF NOT EXISTS idx_readings_station_time
    ON readings(station_id, timestamp DESC);

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

  CREATE INDEX IF NOT EXISTS idx_measurements_station_param_time
    ON measurements(station_id, parameter_id, timestamp DESC);

  CREATE INDEX IF NOT EXISTS idx_measurements_timestamp
    ON measurements(timestamp DESC);

  CREATE INDEX IF NOT EXISTS idx_measurements_parameter
    ON measurements(parameter_id);
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

  CREATE INDEX IF NOT EXISTS idx_readings_station_time
    ON readings(station_id, timestamp DESC);

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

  CREATE INDEX IF NOT EXISTS idx_measurements_station_param_time
    ON measurements(station_id, parameter_id, timestamp DESC);

  CREATE INDEX IF NOT EXISTS idx_measurements_timestamp
    ON measurements(timestamp DESC);

  CREATE INDEX IF NOT EXISTS idx_measurements_parameter
    ON measurements(parameter_id);
`;

function useNeon(): boolean {
  return !!process.env.DATABASE_URL;
}

async function initSchema(db: DbClient): Promise<void> {
  if (schemaReady) return;
  await db.execute(useNeon() ? PG_SCHEMA : SQLITE_SCHEMA);
  schemaReady = true;
}

/**
 * Get the database client. Initialises schema on first call.
 */
export async function getDbClient(): Promise<DbClient> {
  if (!client) {
    const databaseUrl = process.env.DATABASE_URL;
    client = databaseUrl ? createNeonClient(databaseUrl) : createSqliteClient();
    await initSchema(client);
  }
  return client;
}

// ---------------------------------------------------------------------------
// Legacy synchronous API (for gradual migration — local SQLite only)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let legacyDb: any | null = null;

/** @deprecated Use getDbClient() instead */
export function getDb() {
  if (useNeon()) {
    throw new Error("getDb() is not supported with PostgreSQL. Use getDbClient() instead.");
  }
  if (!legacyDb) {
    // Dynamic require to avoid crashing on Vercel where better-sqlite3 native module is unavailable
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3") as typeof import("better-sqlite3");
    const path = require("path") as typeof import("path");
    const fs = require("fs") as typeof import("fs");

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
