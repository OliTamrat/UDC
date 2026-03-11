import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  let dbStatus = "unknown";
  let stationCount = 0;

  try {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) as count FROM stations").get() as { count: number } | undefined;
    stationCount = row?.count ?? 0;
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
      },
      environment: process.env.VERCEL ? "vercel" : "local",
    },
    { status: isHealthy ? 200 : 503 }
  );
}
