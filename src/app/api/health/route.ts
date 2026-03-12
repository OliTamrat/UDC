import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "unknown";
  let stationCount = 0;

  try {
    const db = await getDbClient();
    const { rows } = await db.query("SELECT COUNT(*) as count FROM stations");
    stationCount = Number(rows[0]?.count ?? 0);
    dbStatus = stationCount > 0 ? "connected" : "empty";
  } catch (err) {
    dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        stations: stationCount,
        provider: process.env.DATABASE_URL ? "neon-postgresql" : "sqlite",
      },
      environment: process.env.VERCEL ? "vercel" : "local",
    },
    { status: isHealthy ? 200 : 503 }
  );
}
