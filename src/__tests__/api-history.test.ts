import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/stations/[id]/history/route";
import { getDb } from "@/lib/db";

beforeAll(() => {
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) as c FROM readings").get() as { c: number }).c;
  if (count === 0) {
    throw new Error("Database not seeded. Run `npm run db:seed` first.");
  }
});

function makeRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/stations/:id/history", () => {
  it("returns 12 months of data for ANA-001", async () => {
    const request = makeRequest("/api/stations/ANA-001/history");
    const response = await GET(request, { params: Promise.resolve({ id: "ANA-001" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stationId).toBe("ANA-001");
    expect(body.count).toBe(12);
    expect(body.data).toHaveLength(12);
  });

  it("returns readings with correct fields", async () => {
    const request = makeRequest("/api/stations/ANA-001/history");
    const response = await GET(request, { params: Promise.resolve({ id: "ANA-001" }) });
    const body = await response.json();

    const reading = body.data[0];
    expect(reading.timestamp).toBeTruthy();
    expect(typeof reading.temperature).toBe("number");
    expect(typeof reading.dissolvedOxygen).toBe("number");
    expect(typeof reading.pH).toBe("number");
    expect(typeof reading.turbidity).toBe("number");
    expect(typeof reading.eColiCount).toBe("number");
    expect(reading.source).toBe("seed");
  });

  it("returns 404 for nonexistent station", async () => {
    const request = makeRequest("/api/stations/FAKE-999/history");
    const response = await GET(request, { params: Promise.resolve({ id: "FAKE-999" }) });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Station not found");
  });

  it("respects date range filters", async () => {
    const request = makeRequest("/api/stations/ANA-001/history?from=2025-06-01&to=2025-08-31");
    const response = await GET(request, { params: Promise.resolve({ id: "ANA-001" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(3); // Jun, Jul, Aug
    for (const reading of body.data) {
      expect(reading.timestamp >= "2025-06-01").toBe(true);
      expect(reading.timestamp <= "2025-08-31T23:59:59").toBe(true);
    }
  });

  it("respects limit parameter", async () => {
    const request = makeRequest("/api/stations/ANA-001/history?limit=3");
    const response = await GET(request, { params: Promise.resolve({ id: "ANA-001" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(3);
  });
});
