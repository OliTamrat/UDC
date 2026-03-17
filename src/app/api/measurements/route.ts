import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/measurements — Query EAV measurements with flexible filters
 *
 * Query params:
 *   params    — comma-separated parameter IDs (e.g., "temperature,ph,lead_total")
 *   stations  — comma-separated station IDs (e.g., "ANA-001,WB-001")
 *   category  — filter by parameter category (nutrients, physical, metals, biological, organic)
 *   sources   — comma-separated sources (usgs, wqp, epa, manual, seed)
 *   from      — start date (ISO 8601)
 *   to        — end date (ISO 8601)
 *   violations — "true" to show only EPA threshold exceedances
 *   limit     — max results (default 1000, max 10000)
 *   offset    — pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDbClient();
    const sp = request.nextUrl.searchParams;

    const paramIds = sp.get("params")?.split(",").filter(Boolean);
    const stationIds = sp.get("stations")?.split(",").filter(Boolean);
    const category = sp.get("category");
    const sources = sp.get("sources")?.split(",").filter(Boolean);
    const from = sp.get("from");
    const to = sp.get("to");
    const violations = sp.get("violations") === "true";
    const limit = Math.min(parseInt(sp.get("limit") || "1000"), 10000);
    const offset = parseInt(sp.get("offset") || "0");

    const conditions: string[] = [];
    const queryParams: unknown[] = [];

    if (paramIds && paramIds.length > 0) {
      conditions.push(`m.parameter_id IN (${paramIds.map(() => "?").join(",")})`);
      queryParams.push(...paramIds);
    }

    if (stationIds && stationIds.length > 0) {
      conditions.push(`m.station_id IN (${stationIds.map(() => "?").join(",")})`);
      queryParams.push(...stationIds);
    }

    if (category) {
      conditions.push("p.category = ?");
      queryParams.push(category);
    }

    if (sources && sources.length > 0) {
      conditions.push(`m.source IN (${sources.map(() => "?").join(",")})`);
      queryParams.push(...sources);
    }

    if (from) {
      conditions.push("m.timestamp >= ?");
      queryParams.push(from);
    }

    if (to) {
      conditions.push("m.timestamp <= ?");
      queryParams.push(to);
    }

    if (violations) {
      conditions.push("((p.epa_max IS NOT NULL AND m.value > p.epa_max) OR (p.epa_min IS NOT NULL AND m.value < p.epa_min))");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT
        m.id, m.station_id, m.parameter_id, m.timestamp, m.value,
        m.qualifier, m.source,
        p.name AS parameter_name, p.unit, p.category, p.epa_min, p.epa_max,
        s.name AS station_name
      FROM measurements m
      JOIN parameters p ON p.id = m.parameter_id
      JOIN stations s ON s.id = m.station_id
      ${whereClause}
      ORDER BY m.timestamp DESC
      LIMIT ? OFFSET ?
    `;
    queryParams.push(limit, offset);

    const { rows } = await db.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM measurements m
      JOIN parameters p ON p.id = m.parameter_id
      JOIN stations s ON s.id = m.station_id
      ${whereClause}
    `;
    const { rows: countRows } = await db.query(countQuery, queryParams.slice(0, -2));
    const total = Number(countRows[0]?.total ?? 0);

    const data = rows.map((r) => ({
      id: r.id,
      stationId: r.station_id,
      stationName: r.station_name,
      parameterId: r.parameter_id,
      parameterName: r.parameter_name,
      timestamp: r.timestamp,
      value: r.value,
      unit: r.unit,
      qualifier: r.qualifier,
      source: r.source,
      category: r.category,
      epaMin: r.epa_min,
      epaMax: r.epa_max,
      exceedsThreshold:
        (r.epa_max != null && (r.value as number) > (r.epa_max as number)) ||
        (r.epa_min != null && (r.value as number) < (r.epa_min as number)),
    }));

    return NextResponse.json({
      count: data.length,
      total,
      offset,
      limit,
      data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown database error";
    console.error("[/api/measurements] Error:", message);
    return NextResponse.json({ error: "Failed to fetch measurements", details: message }, { status: 500 });
  }
}
