import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/parameters/route";
import { getDb } from "@/lib/db";

beforeAll(() => {
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) as c FROM parameters").get() as { c: number }).c;
  if (count === 0) {
    throw new Error("Database not seeded. Run `npm run db:seed` first.");
  }
});

function makeRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/parameters", () => {
  it("returns all 25 parameter definitions", async () => {
    const request = makeRequest("/api/parameters");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(25);
  });

  it("each parameter has required fields", async () => {
    const request = makeRequest("/api/parameters");
    const response = await GET(request);
    const data = await response.json();

    for (const p of data) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.unit).toBeTruthy();
      expect(["physical", "nutrients", "metals", "biological", "organic"]).toContain(p.category);
      expect(typeof p.displayOrder).toBe("number");
    }
  });

  it("filters by category", async () => {
    const request = makeRequest("/api/parameters?category=nutrients");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBeGreaterThan(0);
    for (const p of data) {
      expect(p.category).toBe("nutrients");
    }
  });

  it("returns ordered by display_order", async () => {
    const request = makeRequest("/api/parameters");
    const response = await GET(request);
    const data = await response.json();

    for (let i = 1; i < data.length; i++) {
      expect(data[i].displayOrder).toBeGreaterThanOrEqual(data[i - 1].displayOrder);
    }
  });

  it("includes EPA threshold data where applicable", async () => {
    const request = makeRequest("/api/parameters");
    const response = await GET(request);
    const data = await response.json();

    // Dissolved oxygen has epaMin = 5.0
    const doParam = data.find((p: { id: string }) => p.id === "dissolved_oxygen");
    expect(doParam).toBeDefined();
    expect(doParam.epaMin).toBe(5.0);
  });
});
