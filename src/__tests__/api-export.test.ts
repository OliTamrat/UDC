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
  it("returns JSON export with all readings and citation", async () => {
    const request = makeRequest("/api/export");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.exported_at).toBeTruthy();
    expect(body.count).toBe(144); // 12 stations * 12 months
    expect(body.data).toHaveLength(144);
    // Citation metadata
    expect(body.citation).toBeTruthy();
    expect(body.citation.text).toContain("Water Resources Research Institute");
    expect(body.citation.publisher).toContain("CAUSES");
    expect(body.sources).toBeInstanceOf(Array);
  });

  it("filters by station ID", async () => {
    const request = makeRequest("/api/export?station=ANA-001");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(12);
    expect(body.citation.text).toContain("ANA-001");
    for (const row of body.data) {
      expect(row.station_id).toBe("ANA-001");
    }
  });

  it("returns CSV format with citation header and correct columns", async () => {
    const request = makeRequest("/api/export?format=csv&station=ANA-001");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("udc-water-data-ANA-001.csv");

    const csv = await response.text();
    const lines = csv.split("\n");
    // Citation lines start with #, then header row, then data rows
    const citationLines = lines.filter((l) => l.startsWith("#"));
    const dataLines = lines.filter((l) => !l.startsWith("#") && l.trim());
    expect(citationLines.length).toBeGreaterThanOrEqual(5);
    expect(citationLines[0]).toContain("Citation:");
    // Header + 12 data rows
    expect(dataLines.length).toBe(13);
    expect(dataLines[0]).toContain("station_id");
    expect(dataLines[0]).toContain("dissolved_oxygen");
    expect(dataLines[1]).toContain("ANA-001");
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
