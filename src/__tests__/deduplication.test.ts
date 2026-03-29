import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "@/lib/db";

/**
 * Tests that the UNIQUE index deduplication works correctly
 * for readings and measurements tables.
 */

beforeAll(() => {
  const db = getDb();
  // Ensure schema is initialized
  const count = (db.prepare("SELECT COUNT(*) as c FROM stations").get() as { c: number }).c;
  if (count === 0) {
    throw new Error("Database not seeded. Run `npm run db:seed` first.");
  }
});

describe("Deduplication (UNIQUE index)", () => {
  it("readings table has unique index on (station_id, timestamp, source)", () => {
    const db = getDb();
    const indexes = db
      .prepare("SELECT name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'readings'")
      .all() as { name: string; sql: string }[];

    const dedupIdx = indexes.find((i) => i.name === "idx_readings_station_time_source");
    expect(dedupIdx).toBeDefined();
    expect(dedupIdx!.sql).toContain("UNIQUE");
    expect(dedupIdx!.sql).toContain("station_id");
    expect(dedupIdx!.sql).toContain("timestamp");
    expect(dedupIdx!.sql).toContain("source");
  });

  it("measurements table has unique index on (station_id, parameter_id, timestamp, source)", () => {
    const db = getDb();
    const indexes = db
      .prepare("SELECT name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'measurements'")
      .all() as { name: string; sql: string }[];

    const dedupIdx = indexes.find((i) => i.name === "idx_measurements_station_param_time_source");
    expect(dedupIdx).toBeDefined();
    expect(dedupIdx!.sql).toContain("UNIQUE");
    expect(dedupIdx!.sql).toContain("station_id");
    expect(dedupIdx!.sql).toContain("parameter_id");
    expect(dedupIdx!.sql).toContain("timestamp");
    expect(dedupIdx!.sql).toContain("source");
  });

  it("duplicate reading inserts are handled by ON CONFLICT (upsert)", () => {
    const db = getDb();
    const testTimestamp = "2099-01-01T00:00:00";

    // Insert first reading
    db.prepare(
      `INSERT OR REPLACE INTO readings (station_id, timestamp, temperature, source)
       VALUES (?, ?, ?, ?)`
    ).run("ANA-001", testTimestamp, 10.0, "test");

    // Insert duplicate with updated value
    db.prepare(
      `INSERT INTO readings (station_id, timestamp, temperature, source)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (station_id, timestamp, source) DO UPDATE SET temperature = excluded.temperature`
    ).run("ANA-001", testTimestamp, 20.0, "test");

    // Should have exactly one row
    const rows = db
      .prepare("SELECT * FROM readings WHERE station_id = ? AND timestamp = ? AND source = ?")
      .all("ANA-001", testTimestamp, "test") as { temperature: number }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].temperature).toBe(20.0);

    // Cleanup
    db.prepare("DELETE FROM readings WHERE station_id = ? AND timestamp = ? AND source = ?")
      .run("ANA-001", testTimestamp, "test");
  });

  it("duplicate measurement inserts are handled by ON CONFLICT (upsert)", () => {
    const db = getDb();
    const testTimestamp = "2099-01-01T00:00:00";

    // Insert first measurement
    db.prepare(
      `INSERT OR REPLACE INTO measurements (station_id, parameter_id, timestamp, value, source)
       VALUES (?, ?, ?, ?, ?)`
    ).run("ANA-001", "temperature", testTimestamp, 10.0, "test");

    // Insert duplicate with updated value
    db.prepare(
      `INSERT INTO measurements (station_id, parameter_id, timestamp, value, source)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (station_id, parameter_id, timestamp, source) DO UPDATE SET value = excluded.value`
    ).run("ANA-001", "temperature", testTimestamp, 25.0, "test");

    // Should have exactly one row
    const rows = db
      .prepare("SELECT * FROM measurements WHERE station_id = ? AND parameter_id = ? AND timestamp = ? AND source = ?")
      .all("ANA-001", "temperature", testTimestamp, "test") as { value: number }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe(25.0);

    // Cleanup
    db.prepare("DELETE FROM measurements WHERE station_id = ? AND parameter_id = ? AND timestamp = ? AND source = ?")
      .run("ANA-001", "temperature", testTimestamp, "test");
  });
});
