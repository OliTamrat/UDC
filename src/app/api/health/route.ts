import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Names the database actually in use.
 *
 * This used to report a hardcoded "neon-postgresql" whenever DATABASE_URL was
 * set. Production has run on Azure Database for PostgreSQL since the migration,
 * so /api/health told operators the wrong provider on every call — exactly the
 * sort of thing that sends someone to debug a database the platform does not
 * use. Derive it from the connection string rather than asserting it.
 */
function describeDbProvider(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "sqlite";
  if (url.includes(".postgres.database.azure.com")) return "azure-postgresql";
  if (url.includes(".neon.tech")) return "neon-postgresql";
  return "postgresql";
}

/**
 * Names where the app is running. Same failure as the provider above: this only
 * ever checked for Vercel, so the Azure Container App reported "local".
 */
function describeEnvironment(): string {
  if (process.env.VERCEL) return "vercel";
  if (process.env.CONTAINER_APP_NAME) return "azure-container-apps";
  return "local";
}

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
        provider: describeDbProvider(),
      },
      environment: describeEnvironment(),
    },
    { status: isHealthy ? 200 : 503 }
  );
}
