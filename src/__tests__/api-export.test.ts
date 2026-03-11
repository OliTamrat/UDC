import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/export/route";
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

describe("GET /api/export", () => {
  it("returns JSON export with all readings", async () => {
    const request = makeRequest("/api/export");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.exported_at).toBeTruthy();
    expect(body.count).toBe(144); // 12 stations * 12 months
    expect(body.data).toHaveLength(144);
  });

  it("filters by station ID", async () => {
    const request = makeRequest("/api/export?station=ANA-001");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(12);
    for (const row of body.data) {
      expect(row.station_id).toBe("ANA-001");
    }
  });

  it("returns CSV format with correct headers", async () => {
    const request = makeRequest("/api/export?format=csv&station=ANA-001");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("udc-water-data.csv");

    const csv = await response.text();
    const lines = csv.split("\n");
    expect(lines.length).toBe(13); // 1 header + 12 data rows
    expect(lines[0]).toContain("station_id");
    expect(lines[0]).toContain("dissolved_oxygen");
    expect(lines[1]).toContain("ANA-001");
  });

  it("returns empty data for nonexistent station", async () => {
    const request = makeRequest("/api/export?station=FAKE-999");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(0);
    expect(body.data).toHaveLength(0);
  });
});
