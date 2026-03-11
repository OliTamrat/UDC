import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

export async function GET() {
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
}
