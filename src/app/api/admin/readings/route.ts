import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

function checkAuth(request: NextRequest): NextResponse | null {
  const adminKey = process.env.ADMIN_API_KEY?.trim();

  if (!adminKey && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "ADMIN_API_KEY not configured. Admin access is disabled." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (adminKey && token !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

// GET — List readings with optional filters
export async function GET(request: NextRequest) {
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  const db = await getDbClient();
  const searchParams = request.nextUrl.searchParams;
  const stationId = searchParams.get("station");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = `SELECT r.*, s.name AS station_name FROM readings r JOIN stations s ON s.id = r.station_id`;
  const params: unknown[] = [];

  if (stationId) {
    query += " WHERE r.station_id = ?";
    params.push(stationId);
  }

  query += " ORDER BY r.timestamp DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const { rows } = await db.query(query, params);

  // Get total count
  let countQuery = "SELECT COUNT(*) AS total FROM readings";
  const countParams: unknown[] = [];
  if (stationId) {
    countQuery += " WHERE station_id = ?";
    countParams.push(stationId);
  }
  const { rows: countRows } = await db.query(countQuery, countParams);
  const total = (countRows[0]?.total as number) || 0;

  return NextResponse.json({ readings: rows, total, limit, offset });
}

// POST — Add reading(s)
export async function POST(request: NextRequest) {
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  const db = await getDbClient();
  const body = await request.json();
  const readings = Array.isArray(body) ? body : [body];

  let inserted = 0;
  const errors: string[] = [];

  for (const r of readings) {
    if (!r.station_id || !r.timestamp) {
      errors.push(`Missing station_id or timestamp in record`);
      continue;
    }

    try {
      await db.query(
        `INSERT INTO readings (station_id, timestamp, temperature, dissolved_oxygen, ph, turbidity, conductivity, ecoli_count, nitrate_n, phosphorus, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.station_id,
          r.timestamp,
          r.temperature ?? null,
          r.dissolved_oxygen ?? null,
          r.ph ?? null,
          r.turbidity ?? null,
          r.conductivity ?? null,
          r.ecoli_count ?? null,
          r.nitrate_n ?? null,
          r.phosphorus ?? null,
          r.source || "manual",
        ]
      );
      inserted++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${r.station_id} @ ${r.timestamp}: ${msg}`);
    }
  }

  return NextResponse.json({ inserted, errors }, { status: errors.length > 0 ? 207 : 201 });
}

// DELETE — Remove a reading by id
export async function DELETE(request: NextRequest) {
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  const db = await getDbClient();
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Reading id is required" }, { status: 400 });
  }

  const result = await db.query("DELETE FROM readings WHERE id = ?", [id]);

  if (result.changes === 0) {
    return NextResponse.json({ error: `Reading ${id} not found` }, { status: 404 });
  }

  return NextResponse.json({ success: true, deleted: id });
}
