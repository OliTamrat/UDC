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

    for (const param of data) {
      expect(param.id).toBeTruthy();
      expect(param.name).toBeTruthy();
      expect(param.unit).toBeTruthy();
      expect(["physical", "nutrients", "metals", "biological", "organic"]).toContain(param.category);
      expect(typeof param.displayOrder).toBe("number");
    }
  });

  it("filters by category", async () => {
    const request = makeRequest("/api/parameters?category=nutrients");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBeGreaterThan(0);
    for (const param of data) {
      expect(param.category).toBe("nutrients");
    }
  });

  it("includes EPA thresholds where defined", async () => {
    const request = makeRequest("/api/parameters");
    const response = await GET(request);
    const data = await response.json();

    const doParam = data.find((p: { id: string }) => p.id === "dissolved_oxygen");
    expect(doParam).toBeDefined();
    expect(doParam.epaMin).toBe(5.0);

    const phParam = data.find((p: { id: string }) => p.id === "ph");
    expect(phParam).toBeDefined();
    expect(phParam.epaMin).toBe(6.5);
    expect(phParam.epaMax).toBe(9.0);

    const leadParam = data.find((p: { id: string }) => p.id === "lead_total");
    expect(leadParam).toBeDefined();
    expect(leadParam.epaMax).toBe(15.0);
  });

  it("returns emerging contaminants in organic category", async () => {
    const request = makeRequest("/api/parameters?category=organic");
    const response = await GET(request);
    const data = await response.json();

    expect(data.length).toBe(5);
    const ids = data.map((p: { id: string }) => p.id);
    expect(ids).toContain("methylene_chloride");
    expect(ids).toContain("vinyl_chloride");
    expect(ids).toContain("tcep");
  });
});
