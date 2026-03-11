import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = await getDbClient();
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  const { rows } = await db.query(
    `SELECT id, source, status, records_count, error_message, started_at, completed_at
     FROM ingestion_log
     ORDER BY started_at DESC
     LIMIT ?`,
    [limit]
  );

  return NextResponse.json({
    count: rows.length,
    logs: rows,
  });
}
