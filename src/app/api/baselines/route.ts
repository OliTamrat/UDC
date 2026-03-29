import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

// Returns monthly-averaged baseline values per station from real ingested data.
// Falls back gracefully when no data exists for a given station/month.
// Used by the scenario simulator to ground simulations in observed conditions.

function monthExpr(): { select: string; group: string } {
  const isPostgres = !!process.env.DATABASE_URL;
  if (isPostgres) {
    return {
      select: "EXTRACT(MONTH FROM timestamp)::INTEGER AS month",
      group: "EXTRACT(MONTH FROM timestamp)",
    };
  }
  return {
    select: "CAST(strftime('%m', timestamp) AS INTEGER) AS month",
    group: "strftime('%m', timestamp)",
  };
}

export async function GET() {
  try {
    const db = await getDbClient();
    const m = monthExpr();

    // Query monthly averages from the readings table, preferring real sensor data over seed
    const { rows } = await db.query(`
      SELECT
        station_id,
        ${m.select},
        AVG(dissolved_oxygen) AS avg_do,
        AVG(temperature) AS avg_temp,
        AVG(ph) AS avg_ph,
        AVG(turbidity) AS avg_turbidity,
        AVG(ecoli_count) AS avg_ecoli,
        COUNT(*) AS reading_count
      FROM readings
      WHERE source IN ('usgs', 'epa', 'wqp', 'manual')
      GROUP BY station_id, ${m.group}
      ORDER BY station_id, month
    `);

    // If no real data, try including seed data
    let finalRows = rows;
    if (rows.length === 0) {
      const seedResult = await db.query(`
        SELECT
          station_id,
          ${m.select},
          AVG(dissolved_oxygen) AS avg_do,
          AVG(temperature) AS avg_temp,
          AVG(ph) AS avg_ph,
          AVG(turbidity) AS avg_turbidity,
          AVG(ecoli_count) AS avg_ecoli,
          COUNT(*) AS reading_count
        FROM readings
        GROUP BY station_id, ${m.group}
        ORDER BY station_id, month
      `);
      finalRows = seedResult.rows;
    }

    // Shape into { [stationId]: { [month]: values } }
    const baselines: Record<string, Record<number, {
      dissolvedOxygen: number;
      temperature: number;
      pH: number;
      turbidity: number;
      eColiCount: number;
      readingCount: number;
    }>> = {};

    for (const row of finalRows) {
      const stationId = row.station_id as string;
      const month = row.month as number;

      if (!baselines[stationId]) baselines[stationId] = {};
      baselines[stationId][month] = {
        dissolvedOxygen: round(row.avg_do as number | null, 7.0),
        temperature: round(row.avg_temp as number | null, 20.0),
        pH: round(row.avg_ph as number | null, 7.0),
        turbidity: round(row.avg_turbidity as number | null, 20.0),
        eColiCount: Math.round(row.avg_ecoli as number ?? 300),
        readingCount: row.reading_count as number,
      };
    }

    return NextResponse.json({
      baselines,
      source: rows.length > 0 ? "real" : "seed",
      stationCount: Object.keys(baselines).length,
      totalReadings: finalRows.reduce((sum, r) => sum + (r.reading_count as number), 0),
    });
  } catch (error) {
    console.error("Baselines API error:", error);
    return NextResponse.json(
      { error: "Failed to compute baselines", baselines: {} },
      { status: 500 }
    );
  }
}

function round(val: number | null, fallback: number): number {
  if (val == null || isNaN(val)) return fallback;
  return Math.round(val * 100) / 100;
}
