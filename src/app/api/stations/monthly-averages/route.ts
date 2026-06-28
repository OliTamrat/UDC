import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const db = await getDbClient();
  const searchParams = request.nextUrl.searchParams;

  // Default: last 13 months of data, excluding seed
  const monthsBack = parseInt(searchParams.get("months") || "13");
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - monthsBack);
  const fromStr = fromDate.toISOString().slice(0, 10);

  // Stations to aggregate (default: all river/tributary stations)
  const stationParam = searchParams.get("stations");
  const stations = stationParam
    ? stationParam.split(",")
    : ["ANA-001", "ANA-002", "ANA-003", "ANA-004", "WB-001", "HR-001", "PB-001"];

  const placeholders = stations.map(() => "?").join(",");

  // Compute monthly averages server-side using PostgreSQL SQL
  // Production uses Azure PostgreSQL; EXTRACT syntax is Postgres-specific
  const query = `
    SELECT
      EXTRACT(MONTH FROM timestamp::timestamp)::int AS month_num,
      COUNT(*) AS reading_count,
      ROUND(AVG(temperature)::numeric, 1) AS avg_temperature,
      ROUND(AVG(dissolved_oxygen)::numeric, 1) AS avg_dissolved_oxygen,
      ROUND(AVG(ph)::numeric, 2) AS avg_ph,
      ROUND(AVG(turbidity)::numeric, 1) AS avg_turbidity,
      ROUND(AVG(conductivity)::numeric, 0) AS avg_conductivity,
      ROUND(AVG(ecoli_count)::numeric, 0) AS avg_ecoli
    FROM readings
    WHERE station_id IN (${placeholders})
      AND source != 'seed'
      AND timestamp >= ?
    GROUP BY EXTRACT(MONTH FROM timestamp::timestamp)
    ORDER BY month_num
  `;

  try {
    const { rows } = await db.query(query, [...stations, fromStr]);

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Build 12-month array, null for months with no data
    const months = MONTH_NAMES.map((name, i) => {
      const row = rows.find((r: Record<string, unknown>) => Number(r.month_num) === i + 1);
      if (!row) {
        return { month: name, monthNum: i + 1, measured: false, readingCount: 0 };
      }
      return {
        month: name,
        monthNum: i + 1,
        measured: true,
        readingCount: Number(row.reading_count),
        dissolvedOxygen: row.avg_dissolved_oxygen != null ? Number(row.avg_dissolved_oxygen) : null,
        temperature: row.avg_temperature != null ? Number(row.avg_temperature) : null,
        pH: row.avg_ph != null ? Number(row.avg_ph) : null,
        turbidity: row.avg_turbidity != null ? Number(row.avg_turbidity) : null,
        conductivity: row.avg_conductivity != null ? Number(row.avg_conductivity) : null,
        eColiCount: row.avg_ecoli != null ? Number(row.avg_ecoli) : null,
      };
    });

    const totalReadings = months.reduce((sum, m) => sum + m.readingCount, 0);
    const measuredMonths = months.filter((m) => m.measured).length;

    return NextResponse.json({
      stations,
      from: fromStr,
      totalReadings,
      measuredMonths,
      months,
    });
  } catch (error) {
    console.error("[monthly-averages] Query error:", error);
    return NextResponse.json({ error: "Failed to compute monthly averages" }, { status: 500 });
  }
}
