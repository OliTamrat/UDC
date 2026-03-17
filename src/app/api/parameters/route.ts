import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/parameters — List all parameter definitions
 *
 * Query params:
 *   category — filter by category (physical, nutrients, metals, biological, organic)
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDbClient();
    const category = request.nextUrl.searchParams.get("category");

    let query = "SELECT * FROM parameters";
    const params: unknown[] = [];

    if (category) {
      query += " WHERE category = ?";
      params.push(category);
    }

    query += " ORDER BY display_order ASC";

    const { rows } = await db.query(query, params);

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      usgsPcode: r.usgs_pcode,
      wqpCharacteristic: r.wqp_characteristic,
      unit: r.unit,
      category: r.category,
      epaMin: r.epa_min,
      epaMax: r.epa_max,
      description: r.description,
      displayOrder: r.display_order,
    }));

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown database error";
    console.error("[/api/parameters] Error:", message);
    return NextResponse.json({ error: "Failed to fetch parameters", details: message }, { status: 500 });
  }
}
