import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const isVercel = !!process.env.VERCEL;

// On Vercel, the project filesystem is read-only; copy the pre-seeded DB to /tmp
function resolveDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;

  const sourceDb = path.join(process.cwd(), "data", "udc-water.db");

  if (isVercel) {
    const tmpDb = "/tmp/udc-water.db";
    // Copy the bundled DB to /tmp if it doesn't already exist there
    if (!fs.existsSync(tmpDb) && fs.existsSync(sourceDb)) {
      fs.copyFileSync(sourceDb, tmpDb);
    }
    return tmpDb;
  }

  return sourceDb;
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = resolveDbPath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('river', 'stream', 'stormwater', 'green-infrastructure')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'maintenance', 'offline')),
      parameters TEXT NOT NULL, -- JSON array of parameter names
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
      source TEXT DEFAULT 'manual', -- 'usgs', 'epa', 'manual', 'seed'
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
  `);
}
