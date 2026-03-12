import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDbClient();

  const { rows: stationRows } = await db.query(
    "SELECT * FROM stations WHERE id = ?",
    [id]
  );
  if (stationRows.length === 0) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "365"), 1000);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = `
    SELECT timestamp, temperature, dissolved_oxygen, ph, turbidity,
           conductivity, ecoli_count, nitrate_n, phosphorus, source
    FROM readings
    WHERE station_id = ?
  `;
  const queryParams: unknown[] = [id];

  if (from) {
    query += " AND timestamp >= ?";
    queryParams.push(from);
  }
  if (to) {
    query += " AND timestamp <= ?";
    queryParams.push(to);
  }

  query += " ORDER BY timestamp ASC LIMIT ?";
  queryParams.push(limit);

  const { rows: readings } = await db.query(query, queryParams);

  const data = readings.map((r) => ({
    timestamp: r.timestamp,
    temperature: r.temperature,
    dissolvedOxygen: r.dissolved_oxygen,
    pH: r.ph,
    turbidity: r.turbidity,
    conductivity: r.conductivity,
    eColiCount: r.ecoli_count,
    nitrateN: r.nitrate_n,
    phosphorus: r.phosphorus,
    source: r.source,
  }));

  return NextResponse.json({
    stationId: id,
    count: data.length,
    data,
  });
}
