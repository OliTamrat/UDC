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

describe("GET /api/measurements", () => {
  it("returns paginated measurements with metadata", async () => {
    const request = makeRequest("/api/measurements?limit=10");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBeLessThanOrEqual(10);
    expect(body.total).toBeGreaterThan(0);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeLessThanOrEqual(10);
  });

  it("each measurement has required fields", async () => {
    const request = makeRequest("/api/measurements?limit=5");
    const response = await GET(request);
    const body = await response.json();

    for (const m of body.data) {
      expect(m.stationId).toBeTruthy();
      expect(m.parameterId).toBeTruthy();
      expect(m.parameterName).toBeTruthy();
      expect(m.timestamp).toBeTruthy();
      expect(typeof m.value).toBe("number");
      expect(m.unit).toBeTruthy();
      expect(m.category).toBeTruthy();
      expect(typeof m.exceedsThreshold).toBe("boolean");
    }
  });

  it("filters by station ID", async () => {
    const request = makeRequest("/api/measurements?stations=ANA-001&limit=20");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    for (const m of body.data) {
      expect(m.stationId).toBe("ANA-001");
    }
  });

  it("filters by category", async () => {
    const request = makeRequest("/api/measurements?category=physical&limit=20");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    for (const m of body.data) {
      expect(m.category).toBe("physical");
    }
  });

  it("filters by parameter IDs", async () => {
    const request = makeRequest("/api/measurements?params=temperature,ph&limit=20");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    for (const m of body.data) {
      expect(["temperature", "ph"]).toContain(m.parameterId);
    }
  });

  it("violations filter returns only threshold exceedances", async () => {
    const request = makeRequest("/api/measurements?violations=true&limit=100");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    for (const m of body.data) {
      expect(m.exceedsThreshold).toBe(true);
    }
  });

  it("returns empty for nonexistent station", async () => {
    const request = makeRequest("/api/measurements?stations=FAKE-999");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(0);
    expect(body.total).toBe(0);
  });
});
