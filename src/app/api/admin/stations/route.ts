import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

function checkAuth(request: NextRequest): NextResponse | null {
  const adminKey = process.env.ADMIN_API_KEY?.trim();

  // In production, ADMIN_API_KEY must be configured — block all access if missing
  if (!adminKey && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "ADMIN_API_KEY not configured. Admin access is disabled." },
      { status: 503 }
    );
  }

  // If key is set, require valid Bearer token
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (adminKey && token !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

// GET — List all stations
export async function GET(request: NextRequest) {
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  const db = await getDbClient();
  const { rows } = await db.query(
    `SELECT s.*,
       (SELECT COUNT(*) FROM readings WHERE station_id = s.id) AS reading_count,
       (SELECT MAX(timestamp) FROM readings WHERE station_id = s.id) AS last_reading
     FROM stations s ORDER BY s.id`
  );

  return NextResponse.json({ stations: rows });
}

// POST — Add a new station
export async function POST(request: NextRequest) {
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  const db = await getDbClient();
  const body = await request.json();
  const { id, name, latitude, longitude, type, status, parameters } = body;

  if (!id || !name || latitude == null || longitude == null || !type) {
    return NextResponse.json(
      { error: "Missing required fields: id, name, latitude, longitude, type" },
      { status: 400 }
    );
  }

  const validTypes = ["river", "stream", "stormwater", "green-infrastructure"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    await db.query(
      `INSERT INTO stations (id, name, latitude, longitude, type, status, parameters)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        latitude,
        longitude,
        type,
        status || "active",
        JSON.stringify(parameters || ["temperature", "dissolved_oxygen", "ph", "turbidity"]),
      ]
    );

    return NextResponse.json({ success: true, station: { id, name, type } }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE") || msg.includes("duplicate")) {
      return NextResponse.json({ error: `Station ${id} already exists` }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT — Update a station
export async function PUT(request: NextRequest) {
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  const db = await getDbClient();
  const body = await request.json();
  const { id, name, latitude, longitude, type, status, parameters } = body;

  if (!id) {
    return NextResponse.json({ error: "Station id is required" }, { status: 400 });
  }

  const sets: string[] = [];
  const params: unknown[] = [];

  if (name) { sets.push("name = ?"); params.push(name); }
  if (latitude != null) { sets.push("latitude = ?"); params.push(latitude); }
  if (longitude != null) { sets.push("longitude = ?"); params.push(longitude); }
  if (type) { sets.push("type = ?"); params.push(type); }
  if (status) { sets.push("status = ?"); params.push(status); }
  if (parameters) { sets.push("parameters = ?"); params.push(JSON.stringify(parameters)); }

  if (sets.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const nowFn = process.env.DATABASE_URL ? "NOW()" : "datetime('now')";
  sets.push(`updated_at = ${nowFn}`);
  params.push(id);

  const result = await db.query(
    `UPDATE stations SET ${sets.join(", ")} WHERE id = ?`,
    params
  );

  if (result.changes === 0) {
    return NextResponse.json({ error: `Station ${id} not found` }, { status: 404 });
  }

  return NextResponse.json({ success: true, updated: id });
}

// DELETE — Remove a station and its readings
export async function DELETE(request: NextRequest) {
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  const db = await getDbClient();
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Station id is required" }, { status: 400 });
  }

  await db.query("DELETE FROM readings WHERE station_id = ?", [id]);
  const result = await db.query("DELETE FROM stations WHERE id = ?", [id]);

  if (result.changes === 0) {
    return NextResponse.json({ error: `Station ${id} not found` }, { status: 404 });
  }

  return NextResponse.json({ success: true, deleted: id });
}
