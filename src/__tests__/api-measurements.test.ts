import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/measurements/route";
import { getDb } from "@/lib/db";

beforeAll(() => {
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) as c FROM measurements").get() as { c: number }).c;
  if (count === 0) {
    throw new Error("Database not seeded. Run `npm run db:seed` first.");
  }
});

function makeRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

// The seeded test database contains only seed rows, and /api/measurements now
// excludes those unless a caller names them. These cases are about paging and
// filtering rather than provenance, so they opt in the same way the admin
// explorer does. Default-exclusion is covered by its own case below.
const ALL_SOURCES = "sources=usgs,wqp,epa,manual,seed";

describe("GET /api/measurements", () => {
  it("returns measurements with pagination metadata", async () => {
    const request = makeRequest(`/api/measurements?limit=10&${ALL_SOURCES}`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBeLessThanOrEqual(10);
    expect(typeof body.total).toBe("number");
    expect(body.total).toBeGreaterThan(0);
    expect(body.offset).toBe(0);
    expect(body.limit).toBe(10);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("each measurement has required fields", async () => {
    const request = makeRequest(`/api/measurements?limit=5&${ALL_SOURCES}`);
    const response = await GET(request);
    const body = await response.json();

    for (const m of body.data) {
      expect(m.id).toBeDefined();
      expect(m.stationId).toBeTruthy();
      expect(m.parameterId).toBeTruthy();
      expect(m.parameterName).toBeTruthy();
      expect(m.timestamp).toBeTruthy();
      expect(typeof m.value).toBe("number");
      expect(m.unit).toBeTruthy();
      expect(m.source).toBeTruthy();
      expect(["physical", "nutrients", "metals", "biological", "organic"]).toContain(m.category);
      expect(typeof m.exceedsThreshold).toBe("boolean");
    }
  });

  it("filters by station ID", async () => {
    const request = makeRequest(`/api/measurements?stations=ANA-001&limit=20&${ALL_SOURCES}`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    for (const m of body.data) {
      expect(m.stationId).toBe("ANA-001");
    }
  });

  it("filters by parameter ID", async () => {
    const request = makeRequest(`/api/measurements?params=temperature&limit=20&${ALL_SOURCES}`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    for (const m of body.data) {
      expect(m.parameterId).toBe("temperature");
    }
  });

  it("filters by category", async () => {
    const request = makeRequest(`/api/measurements?category=nutrients&limit=20&${ALL_SOURCES}`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    for (const m of body.data) {
      expect(m.category).toBe("nutrients");
    }
  });

  it("respects pagination offset", async () => {
    const req1 = makeRequest(`/api/measurements?limit=5&offset=0&${ALL_SOURCES}`);
    const res1 = await GET(req1);
    const body1 = await res1.json();

    const req2 = makeRequest(`/api/measurements?limit=5&offset=5&${ALL_SOURCES}`);
    const res2 = await GET(req2);
    const body2 = await res2.json();

    expect(body1.data.length).toBe(5);
    expect(body2.data.length).toBe(5);
    // Different pages should have different IDs
    const ids1 = new Set(body1.data.map((m: { id: number }) => m.id));
    const ids2 = new Set(body2.data.map((m: { id: number }) => m.id));
    const overlap = [...ids1].filter((id) => ids2.has(id));
    expect(overlap.length).toBe(0);
  });

  it("excludes seed measurements by default", async () => {
    // Every row in the seeded database is a seed row, so the unfiltered
    // response must be empty. This is what keeps December 2025 demonstration
    // values out of the dashboard, the station page and the AI assistant.
    const request = makeRequest("/api/measurements?limit=10");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(0);
    expect(body.data).toHaveLength(0);
  });

  it("limits max results to 10000", async () => {
    const request = makeRequest(`/api/measurements?limit=99999&${ALL_SOURCES}`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.limit).toBe(10000);
  });
});
