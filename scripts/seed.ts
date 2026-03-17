/**
 * Seed script — populates the database with existing static data.
 * Supports both SQLite (local) and PostgreSQL (Neon).
 * Seeds both legacy readings table and new EAV measurements table.
 *
 * Usage:
 *   Local SQLite:  npx tsx scripts/seed.ts
 *   Neon PG:       DATABASE_URL=postgresql://... npx tsx scripts/seed.ts
 */
import { monitoringStations, getStationHistoricalData } from "../src/data/dc-waterways";
import { ALL_PARAMETERS, LEGACY_COLUMN_TO_PARAM } from "../src/data/parameters";

// ---------------------------------------------------------------------------
// Database abstraction (mirrors src/lib/db.ts but standalone for scripts)
// ---------------------------------------------------------------------------
interface SeedDb {
  execute(sql: string): Promise<void>;
  query(sql: string, params?: unknown[]): Promise<void>;
  close(): Promise<void>;
}

async function createSeedDb(): Promise<SeedDb> {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    // PostgreSQL via Neon — needs WebSocket in Node.js
    const { Pool, neonConfig } = await import("@neondatabase/serverless");
    const ws = await import("ws");
    neonConfig.webSocketConstructor = ws.default;
    const pool = new Pool({ connectionString: databaseUrl });

    return {
      async execute(statements: string) {
        const parts = statements.split(";").map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
          await pool.query(part);
        }
      },
      async query(query: string, params: unknown[] = []) {
        let idx = 0;
        const pgQuery = query.replace(/\?/g, () => `$${++idx}`);
        await pool.query(pgQuery, params);
      },
      async close() { await pool.end(); },
    };
  } else {
    // SQLite via better-sqlite3
    const Database = (await import("better-sqlite3")).default;
    const path = await import("path");
    const fs = await import("fs");

    const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "udc-water.db");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    return {
      async execute(statements: string) {
        db.exec(statements);
      },
      async query(sql: string, params: unknown[] = []) {
        db.prepare(sql).run(...params);
      },
      async close() {
        db.close();
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const isPostgres = !!process.env.DATABASE_URL;

const SCHEMA = isPostgres
  ? `
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
    ON measurements(parameter_id)
`
  : `
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
    ON measurements(parameter_id)
`;

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
async function seed() {
  const db = await createSeedDb();
  const provider = isPostgres ? "PostgreSQL (Neon)" : "SQLite";
  console.log(`Seeding ${provider} database...`);

  // Create schema
  await db.execute(SCHEMA);

  // Clear existing seed data
  await db.query("DELETE FROM readings WHERE source = 'seed'");
  await db.query("DELETE FROM measurements WHERE source = 'seed'");

  let stationCount = 0;
  let readingCount = 0;
  let measurementCount = 0;

  // --- Seed parameter definitions ---
  const upsertParamSQL = isPostgres
    ? `INSERT INTO parameters (id, name, usgs_pcode, wqp_characteristic, unit, category, epa_min, epa_max, description, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, usgs_pcode = EXCLUDED.usgs_pcode,
         wqp_characteristic = EXCLUDED.wqp_characteristic, unit = EXCLUDED.unit,
         category = EXCLUDED.category, epa_min = EXCLUDED.epa_min, epa_max = EXCLUDED.epa_max,
         description = EXCLUDED.description, display_order = EXCLUDED.display_order`
    : `INSERT OR REPLACE INTO parameters (id, name, usgs_pcode, wqp_characteristic, unit, category, epa_min, epa_max, description, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  for (const param of ALL_PARAMETERS) {
    await db.query(upsertParamSQL, [
      param.id,
      param.name,
      param.usgs_pcode,
      param.wqp_characteristic,
      param.unit,
      param.category,
      param.epa_min,
      param.epa_max,
      param.description,
      param.display_order,
    ]);
  }
  console.log(`Seeded ${ALL_PARAMETERS.length} parameter definitions`);

  // --- Seed stations and readings ---
  const upsertStationSQL = isPostgres
    ? `INSERT INTO stations (id, name, latitude, longitude, type, status, parameters)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude, type = EXCLUDED.type, status = EXCLUDED.status,
         parameters = EXCLUDED.parameters, updated_at = NOW()`
    : `INSERT OR REPLACE INTO stations (id, name, latitude, longitude, type, status, parameters)
       VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const insertReadingSQL = isPostgres
    ? `INSERT INTO readings (station_id, timestamp, temperature, dissolved_oxygen, ph, turbidity, ecoli_count, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'seed')`
    : `INSERT INTO readings (station_id, timestamp, temperature, dissolved_oxygen, ph, turbidity, ecoli_count, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'seed')`;

  const insertMeasurementSQL = isPostgres
    ? `INSERT INTO measurements (station_id, parameter_id, timestamp, value, source)
       VALUES (?, ?, ?, ?, 'seed')`
    : `INSERT INTO measurements (station_id, parameter_id, timestamp, value, source)
       VALUES (?, ?, ?, ?, 'seed')`;

  // Map from historical data keys to parameter IDs
  const HIST_KEY_TO_PARAM: Record<string, string> = {
    temperature: "temperature",
    dissolvedOxygen: "dissolved_oxygen",
    pH: "ph",
    turbidity: "turbidity",
    eColiCount: "ecoli",
  };

  for (const station of monitoringStations) {
    await db.query(upsertStationSQL, [
      station.id,
      station.name,
      station.position[0],
      station.position[1],
      station.type,
      station.status,
      JSON.stringify(station.parameters),
    ]);
    stationCount++;

    // Seed historical data
    const historical = getStationHistoricalData(station.id);
    if (historical) {
      for (const reading of historical.data) {
        const monthIndex = historical.months.indexOf(reading.month);
        const timestamp = `2025-${String(monthIndex + 1).padStart(2, "0")}-15T12:00:00Z`;

        // Legacy readings table
        await db.query(insertReadingSQL, [
          station.id,
          timestamp,
          reading.temperature,
          reading.dissolvedOxygen,
          reading.pH,
          reading.turbidity,
          reading.eColiCount,
        ]);
        readingCount++;

        // New EAV measurements table
        for (const [key, paramId] of Object.entries(HIST_KEY_TO_PARAM)) {
          const value = reading[key as keyof typeof reading];
          if (typeof value === "number") {
            await db.query(insertMeasurementSQL, [
              station.id,
              paramId,
              timestamp,
              value,
            ]);
            measurementCount++;
          }
        }
      }
    }

    // Also seed lastReading data into measurements (for conductivity, nitrate, phosphorus)
    if (station.lastReading) {
      const lr = station.lastReading;
      const ts = lr.timestamp;
      const extraParams: [string, number | undefined][] = [
        ["conductivity", lr.conductivity],
        ["nitrate_n", lr.nitrateN],
        ["phosphorus_total", lr.phosphorus],
      ];
      for (const [paramId, val] of extraParams) {
        if (val != null) {
          await db.query(insertMeasurementSQL, [station.id, paramId, ts, val]);
          measurementCount++;
        }
      }
    }
  }

  console.log(`Seeded ${stationCount} stations, ${readingCount} readings (legacy), ${measurementCount} measurements (EAV) to ${provider}`);
  await db.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
