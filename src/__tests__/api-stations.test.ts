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

  it("includes last reading data for seeded stations", async () => {
    const response = await GET();
    const data = await response.json();

    const withReadings = data.filter((s: Record<string, unknown>) => s.lastReading);
    expect(withReadings.length).toBeGreaterThan(0);

    const reading = withReadings[0].lastReading;
    expect(reading.timestamp).toBeTruthy();
    expect(typeof reading.temperature).toBe("number");
    expect(typeof reading.dissolvedOxygen).toBe("number");
    expect(typeof reading.pH).toBe("number");
  });
});
