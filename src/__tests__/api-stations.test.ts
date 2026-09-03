import { describe, it, expect, beforeAll } from "vitest";
import { GET } from "@/app/api/stations/route";
import { getDb } from "@/lib/db";

// Ensure DB is seeded before tests
beforeAll(() => {
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) as c FROM stations").get() as { c: number }).c;
  if (count === 0) {
    throw new Error("Database not seeded. Run `npm run db:seed` first.");
  }
});

describe("GET /api/stations", () => {
  it("returns all 12 stations", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(12);
  });

  it("each station has required fields", async () => {
    const response = await GET();
    const data = await response.json();

    for (const station of data) {
      expect(station.id).toBeTruthy();
      expect(station.name).toBeTruthy();
      expect(station.position).toHaveLength(2);
      expect(typeof station.position[0]).toBe("number");
      expect(typeof station.position[1]).toBe("number");
      expect(["river", "stream", "stormwater", "green-infrastructure"]).toContain(station.type);
      expect(["active", "maintenance", "offline"]).toContain(station.status);
      expect(Array.isArray(station.parameters)).toBe(true);
    }
  });

  it("never reports a seed row as a current reading", async () => {
    // Every reading in the seeded database is a seed row. None of them may
    // surface as lastReading: presenting a December 2025 demonstration value
    // with the same weight as an hour-old sensor reading is precisely the
    // behaviour this endpoint used to have.
    const response = await GET();
    const data = await response.json();

    for (const station of data) {
      expect(station.lastReading).toBeUndefined();
      expect(station.dataStatus).toBe("no_current_data");
      // The timestamp is still reported so the UI can say when the station was
      // last heard from - a date, never a measurement.
      expect(station.lastKnownReadingTime).toBeTruthy();
      expect(station.status).toBe("offline");
    }
  });

  it("reports a real reading as current", async () => {
    const db = getDb();
    const station = "ANA-002";
    const ts = "2026-09-03T12:00:00.000Z";
    db.prepare(
      `INSERT OR REPLACE INTO readings
         (station_id, timestamp, temperature, dissolved_oxygen, ph, turbidity, source)
       VALUES (?, ?, ?, ?, ?, ?, 'usgs')`
    ).run(station, ts, 21.5, 8.2, 7.4, 3.1);

    try {
      const response = await GET();
      const data = await response.json();
      const s = data.find((x: { id: string }) => x.id === station);

      expect(s.dataStatus).toBe("current");
      expect(s.status).toBe("active");
      expect(s.lastReading).toBeDefined();
      expect(s.lastReading.source).toBe("usgs");
      expect(s.lastReading.temperature).toBe(21.5);
    } finally {
      db.prepare("DELETE FROM readings WHERE station_id = ? AND timestamp = ? AND source = 'usgs'").run(station, ts);
    }
  });
});
