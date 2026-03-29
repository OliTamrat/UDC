import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

// Force dynamic rendering so fresh data is always served after ingestion
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDbClient();

    // Prefer the latest non-seed reading; fall back to seed only if no real data exists
    const { rows: stations } = await db.query(`
      SELECT
        s.*,
        COALESCE(real_r.timestamp, seed_r.timestamp) AS last_reading_time,
        COALESCE(real_r.temperature, seed_r.temperature) AS temperature,
        COALESCE(real_r.dissolved_oxygen, seed_r.dissolved_oxygen) AS dissolved_oxygen,
        COALESCE(real_r.ph, seed_r.ph) AS ph,
        COALESCE(real_r.turbidity, seed_r.turbidity) AS turbidity,
        COALESCE(real_r.conductivity, seed_r.conductivity) AS conductivity,
        COALESCE(real_r.ecoli_count, seed_r.ecoli_count) AS ecoli_count,
        COALESCE(real_r.nitrate_n, seed_r.nitrate_n) AS nitrate_n,
        COALESCE(real_r.phosphorus, seed_r.phosphorus) AS phosphorus,
        COALESCE(real_r.source, seed_r.source) AS last_reading_source
      FROM stations s
      LEFT JOIN readings real_r ON real_r.station_id = s.id
        AND real_r.source != 'seed'
        AND real_r.timestamp = (
          SELECT MAX(timestamp) FROM readings
          WHERE station_id = s.id AND source != 'seed'
        )
      LEFT JOIN readings seed_r ON seed_r.station_id = s.id
        AND seed_r.source = 'seed'
        AND seed_r.timestamp = (
          SELECT MAX(timestamp) FROM readings
          WHERE station_id = s.id AND source = 'seed'
        )
        AND real_r.timestamp IS NULL
      ORDER BY s.name
    `);

    const result = stations.map((s) => ({
      id: s.id,
      name: s.name,
      position: [s.latitude, s.longitude],
      type: s.type,
      status: s.status,
      parameters: JSON.parse(s.parameters as string),
      lastReading: s.last_reading_time
        ? {
            timestamp: s.last_reading_time,
            temperature: s.temperature,
            dissolvedOxygen: s.dissolved_oxygen,
            pH: s.ph,
            turbidity: s.turbidity,
            conductivity: s.conductivity,
            eColiCount: s.ecoli_count,
            nitrateN: s.nitrate_n,
            phosphorus: s.phosphorus,
            source: s.last_reading_source || "seed",
          }
        : undefined,
    }));

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown database error";
    console.error("[/api/stations] Database error:", message);

    // Detect common better-sqlite3 native module issues
    if (message.includes("better-sqlite3") || message.includes("MODULE_NOT_FOUND") || message.includes("native")) {
      return NextResponse.json(
        { error: "Database driver failed to load. Run: npm rebuild better-sqlite3" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch stations", details: message },
      { status: 500 }
    );
  }
}
