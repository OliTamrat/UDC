/**
 * Database abstraction layer.
 *
 * Uses PostgreSQL when DATABASE_URL is set, and SQLite via better-sqlite3 for
 * local development when it is not.
 *
 * PRODUCTION IS AZURE DATABASE FOR POSTGRESQL — `udc-wqis-db` in Central US,
 * reached with the standard `pg` driver. There is no Neon database. The
 * `.neon.tech` branch in createPgClient below is provider portability left over
 * from the migration off Neon, not a description of what runs today.
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
  /**
   * Releases the underlying connection pool. Only the Postgres client holds
   * server connections, so only it implements this. Must be called before a
   * client is discarded, or its connections stay checked out on the server.
   */
  close?(): Promise<void>;
}

// ---------------------------------------------------------------------------
// PostgreSQL (standard pg) implementation — works with Azure, Neon, any PG
/**
 * Splits multi-statement DDL into individual statements.
 *
 * The node-postgres pool sends one statement per query, so the schema string has
 * to be split first. A plain `statements.split(";")` is not safe enough: a
 * semicolon inside a `--` comment splits the comment in half and the remainder
 * of the prose is handed to Postgres as SQL. That is not hypothetical — the
 * comment "...lives in scripts/dedupe-legacy-rows.sql now; run it by hand..."
 * produced `syntax error at or near "run"`, which made initSchema throw on every
 * cold start and took every Postgres-backed endpoint down with it.
 *
 * So walk the string instead: skip over `--` line comments and single-quoted
 * literals, and split only on semicolons at the top level. Comments are dropped
 * rather than forwarded, since a statement that is only a comment is not valid
 * to send on its own.
 */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    // Line comment: drop everything through the newline, which keeps any
    // semicolon in the prose out of the statement stream.
    if (char === "-" && sql[i + 1] === "-") {
      const newline = sql.indexOf("\n", i);
      if (newline === -1) break;
      i = newline;
      current += "\n";
      continue;
    }

    // String literal: copy verbatim, including any semicolon inside it. '' is
    // an escaped quote in SQL, so it does not end the literal.
    if (char === "'") {
      const start = i;
      i++;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") i += 2;
        else if (sql[i] === "'") break;
        else i++;
      }
      current += sql.slice(start, i + 1);
      continue;
    }

    if (char === ";") {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
      continue;
    }

    current += char;
  }

  const last = current.trim();
  if (last) statements.push(last);

  return statements;
}

// ---------------------------------------------------------------------------
function createPgClient(databaseUrl: string): DbClient {
  // Use Neon serverless driver for Neon URLs (WebSocket-based),
  // standard pg driver for everything else (Azure, local PG, etc.)
  const isNeon = databaseUrl.includes(".neon.tech");

  let pool: {
    query: (q: string, p?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
    end: () => Promise<void>;
  };

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
      for (const part of splitSqlStatements(statements)) {
        await pool.query(part);
      }
    },

    async close(): Promise<void> {
      await pool.end();
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

  -- NOTE: a one-off de-duplication DELETE used to run here on every schema
  -- init. It was a full sequential scan of readings (~237k rows) plus a
  -- HashAggregate, executed by every cold container before it could serve a
  -- single request -- and it deleted nothing, because the unique index below
  -- has prevented duplicates since it was created. That scan is what pushed
  -- /api/ingest past the ingress timeout and stalled ingestion. The cleanup
  -- lives in scripts/dedupe-legacy-rows.sql now; run it by hand if needed.

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

  -- NOTE: a one-off de-duplication DELETE used to run here on every schema
  -- init. It was a full sequential scan of measurements (~682k rows) plus a
  -- HashAggregate, executed by every cold container before it could serve a
  -- single request -- and it deleted nothing, because the unique index below
  -- has prevented duplicates since it was created. That scan is what pushed
  -- /api/ingest past the ingress timeout and stalled ingestion. The cleanup
  -- lives in scripts/dedupe-legacy-rows.sql now; run it by hand if needed.

  CREATE UNIQUE INDEX IF NOT EXISTS idx_measurements_station_param_time_source
    ON measurements(station_id, parameter_id, timestamp, source);

  CREATE INDEX IF NOT EXISTS idx_measurements_timestamp
    ON measurements(timestamp DESC);

  CREATE INDEX IF NOT EXISTS idx_measurements_parameter
    ON measurements(parameter_id);

  -- access_requests is created after the index statements above. That is safe only
  -- because the expensive dedup DELETE that used to sit here is gone: execute() runs
  -- statements in order, so a slow or failing step skips every CREATE after it, which
  -- is how this table ended up missing in production on first deploy. Keep schema init
  -- cheap and idempotent -- every request waits for it.
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

`;

/**
 * True when the app is talking to PostgreSQL rather than local SQLite.
 *
 * Named useNeon() until the provider labels were corrected. It never actually
 * tested for Neon — only for DATABASE_URL being set — and production has been
 * Azure PostgreSQL since the migration.
 */
function usePostgres(): boolean {
  return !!process.env.DATABASE_URL;
}

async function initSchema(db: DbClient): Promise<void> {
  if (schemaReady) return;
  await db.execute(usePostgres() ? PG_SCHEMA : SQLITE_SCHEMA);
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
      try {
        await initSchema(created);
      } catch (error) {
        // Release the pool before discarding this client.
        //
        // Retrying a failed initialisation (below) is only safe if the failed
        // attempt gives its connections back. createPgClient opens a NEW pool
        // every call, so without this a database that is briefly unreachable
        // turns into a spiral: each request leaks up to `max` server
        // connections, which exhausts the connection slots, which makes the
        // next initSchema fail, which leaks another pool.
        await created.close?.().catch(() => {});
        throw error;
      }
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
  if (usePostgres()) {
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
