/**
 * Seed script — populates the SQLite database with existing static data.
 * Run with: npx tsx scripts/seed.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { monitoringStations, getStationHistoricalData } from "../src/data/dc-waterways";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "udc-water.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create schema
db.exec(`
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
`);

// Seed stations
const insertStation = db.prepare(`
  INSERT OR REPLACE INTO stations (id, name, latitude, longitude, type, status, parameters)
  VALUES (@id, @name, @latitude, @longitude, @type, @status, @parameters)
`);

const insertReading = db.prepare(`
  INSERT INTO readings (station_id, timestamp, temperature, dissolved_oxygen, ph, turbidity, ecoli_count, source)
  VALUES (@station_id, @timestamp, @temperature, @dissolved_oxygen, @ph, @turbidity, @ecoli_count, 'seed')
`);

const seedAll = db.transaction(() => {
  let stationCount = 0;
  let readingCount = 0;

  for (const station of monitoringStations) {
    insertStation.run({
      id: station.id,
      name: station.name,
      latitude: station.position[0],
      longitude: station.position[1],
      type: station.type,
      status: station.status,
      parameters: JSON.stringify(station.parameters),
    });
    stationCount++;

    // Seed historical data
    const historical = getStationHistoricalData(station.id);
    if (historical) {
      for (const reading of historical.data) {
        const monthIndex = historical.months.indexOf(reading.month);
        const timestamp = `2025-${String(monthIndex + 1).padStart(2, "0")}-15T12:00:00Z`;
        insertReading.run({
          station_id: station.id,
          timestamp,
          temperature: reading.temperature,
          dissolved_oxygen: reading.dissolvedOxygen,
          ph: reading.pH,
          turbidity: reading.turbidity,
          ecoli_count: reading.eColiCount,
        });
        readingCount++;
      }
    }
  }

  return { stationCount, readingCount };
});

const result = seedAll();
console.log(`Seeded ${result.stationCount} stations and ${result.readingCount} readings`);
db.close();
