import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

// Force dynamic rendering so fresh data is always served after ingestion
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDbClient();

    const { rows: stations } = await db.query(`
      SELECT
        s.*,
        r.timestamp AS last_reading_time,
        r.temperature,
        r.dissolved_oxygen,
        r.ph,
        r.turbidity,
        r.conductivity,
        r.ecoli_count,
        r.nitrate_n,
        r.phosphorus,
        r.source AS last_reading_source
      FROM stations s
      LEFT JOIN readings r ON r.station_id = s.id
        AND r.timestamp = (SELECT MAX(timestamp) FROM readings WHERE station_id = s.id)
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
