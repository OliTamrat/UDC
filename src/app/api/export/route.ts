import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = getDb();
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "json";
  const stationId = searchParams.get("station");

  let query = `
    SELECT
      r.station_id, s.name AS station_name, s.type AS station_type,
      r.timestamp, r.temperature, r.dissolved_oxygen, r.ph,
      r.turbidity, r.conductivity, r.ecoli_count, r.nitrate_n, r.phosphorus, r.source
    FROM readings r
    JOIN stations s ON s.id = r.station_id
  `;
  const params: unknown[] = [];

  if (stationId) {
    query += " WHERE r.station_id = ?";
    params.push(stationId);
  }
  query += " ORDER BY r.timestamp ASC";

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];

  if (format === "csv") {
    const headers = [
      "station_id", "station_name", "station_type", "timestamp",
      "temperature", "dissolved_oxygen", "ph", "turbidity",
      "conductivity", "ecoli_count", "nitrate_n", "phosphorus", "source",
    ];
    const csvLines = [headers.join(",")];
    for (const row of rows) {
      csvLines.push(headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") ? `"${str}"` : str;
      }).join(","));
    }

    return new NextResponse(csvLines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=udc-water-data.csv",
      },
    });
  }

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    count: rows.length,
    data: rows,
  });
}
