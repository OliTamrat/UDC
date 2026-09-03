import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

// Force dynamic rendering so fresh data is always served after ingestion
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDbClient();

    // Only a real (non-seed) reading counts as a current reading.
    //
    // This used to COALESCE onto the seed row when no real reading existed,
    // which meant stations with no working gauge served their December 2025
    // seed values in the same shape, and the same visual weight, as a reading
    // taken an hour ago. The seed timestamp is still selected, but only to
    // report when the station was last heard from - never as a value.
    const { rows: stations } = await db.query(`
      SELECT
        s.*,
        real_r.timestamp AS last_reading_time,
        real_r.temperature,
        real_r.dissolved_oxygen,
        real_r.ph,
        real_r.turbidity,
        real_r.conductivity,
        real_r.ecoli_count,
        real_r.nitrate_n,
        real_r.phosphorus,
        real_r.source AS last_reading_source,
        seed_r.timestamp AS seed_reading_time
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
      ORDER BY s.name
    `);

    const result = stations.map((s) => {
      const hasCurrent = s.last_reading_time != null;
      return {
        id: s.id,
        name: s.name,
        position: [s.latitude, s.longitude],
        type: s.type,
        // Derive status from whether data is actually arriving rather than from
        // the static column, which drifted out of step with reality: PB-001 read
        // "offline" while ingesting normally, and SW-001 and GI-001 read "active"
        // on top of 2025 seed rows.
        status: hasCurrent ? "active" : "offline",
        configuredStatus: s.status,
        parameters: JSON.parse(s.parameters as string),
        // No current reading means no reading is reported at all. Consumers
        // already treat lastReading as optional.
        lastReading: hasCurrent
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
              source: s.last_reading_source,
            }
          : undefined,
        dataStatus: hasCurrent ? "current" : "no_current_data",
        // When the station was last heard from, for an honest "no current data"
        // label. A timestamp only - never presented as a measurement.
        lastKnownReadingTime: hasCurrent ? s.last_reading_time : s.seed_reading_time ?? null,
      };
    });

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
