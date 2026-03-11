import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { logger } from "@/lib/logger";

// USGS NWIS parameter codes for water quality
const USGS_PARAMS: Record<string, string> = {
  "00010": "temperature",     // Water temperature (°C)
  "00300": "dissolved_oxygen", // Dissolved oxygen (mg/L)
  "00400": "ph",               // pH
  "63680": "turbidity",        // Turbidity (NTU)
  "00095": "conductivity",     // Specific conductance (µS/cm)
};

// Active USGS sites with water-quality sensors in the DC/Anacostia watershed
// See: https://www.usgs.gov/centers/md-de-dc-water/anacostia-water-quality-monitoring-project
const USGS_SITES = [
  { usgs: "01649500", stationId: "ANA-002" }, // NE Branch Anacostia at Riverdale, MD (active WQ)
  { usgs: "01651000", stationId: "ANA-001" }, // NW Branch Anacostia nr Hyattsville, MD
  { usgs: "01646500", stationId: "PB-001" },  // Potomac River at Little Falls (active WQ)
];

interface USGSTimeSeriesValue {
  value: string;
  dateTime: string;
}

interface USGSTimeSeries {
  variable: { variableCode: Array<{ value: string }> };
  values: Array<{ value: USGSTimeSeriesValue[] }>;
}

interface USGSResponse {
  value?: {
    timeSeries?: USGSTimeSeries[];
  };
}

async function ingestUSGS(): Promise<{ count: number; errors: string[] }> {
  const db = await getDbClient();
  const errors: string[] = [];
  let totalCount = 0;

  for (const site of USGS_SITES) {
    const paramCodes = Object.keys(USGS_PARAMS).join(",");
    const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${site.usgs}&parameterCd=${paramCodes}&period=P1D`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        errors.push(`USGS ${site.usgs}: HTTP ${response.status}`);
        continue;
      }

      const data: USGSResponse = await response.json();
      const timeSeries = data?.value?.timeSeries;
      if (!timeSeries || timeSeries.length === 0) {
        logger.info(`USGS ${site.usgs}: no time series returned (site may lack WQ sensors)`);
        continue;
      }

      // Group values by timestamp
      const readingsByTime: Record<string, Record<string, number>> = {};

      for (const series of timeSeries) {
        const paramCode = series.variable?.variableCode?.[0]?.value;
        const dbField = paramCode ? USGS_PARAMS[paramCode] : undefined;
        if (!dbField) continue;

        for (const val of series.values?.[0]?.value ?? []) {
          if (!val.value || val.value === "-999999") continue;
          const ts = val.dateTime;
          if (!readingsByTime[ts]) readingsByTime[ts] = {};
          readingsByTime[ts][dbField] = parseFloat(val.value);
        }
      }

      // Insert grouped readings
      let count = 0;
      for (const [timestamp, values] of Object.entries(readingsByTime)) {
        await db.query(
          `INSERT INTO readings (station_id, timestamp, temperature, dissolved_oxygen, ph, turbidity, conductivity, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'usgs')`,
          [
            site.stationId,
            timestamp,
            values.temperature ?? null,
            values.dissolved_oxygen ?? null,
            values.ph ?? null,
            values.turbidity ?? null,
            values.conductivity ?? null,
          ]
        );
        count++;
      }

      totalCount += count;
      logger.info(`USGS ingest: ${count} readings from site ${site.usgs}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`USGS ${site.usgs}: ${msg}`);
      logger.error(`USGS ingest failed for site ${site.usgs}`, { error: msg });
    }
  }

  return { count: totalCount, errors };
}

// GET handler for Vercel Cron — authenticated via CRON_SECRET header
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delegate to the shared ingest logic
  return runIngest(request);
}

// POST handler for manual triggers — authenticated via INGEST_API_KEY
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.INGEST_API_KEY;
  if (!apiKey && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "INGEST_API_KEY not configured" }, { status: 503 });
  }
  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runIngest(request);
}

async function runIngest(request: NextRequest) {
  const db = await getDbClient();
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get("source") || "usgs";

  try {
    let result: { count: number; errors: string[] };

    if (source === "usgs") {
      result = await ingestUSGS();
    } else {
      return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 });
    }

    const status = result.errors.length === 0 ? "success" : "error";
    const nowFn = process.env.DATABASE_URL ? "NOW()" : "datetime('now')";
    await db.query(
      `INSERT INTO ingestion_log (source, status, records_count, error_message, completed_at)
       VALUES (?, ?, ?, ?, ${nowFn})`,
      [source, status, result.count, result.errors.join("; ") || null]
    );

    return NextResponse.json({
      source,
      status,
      records_ingested: result.count,
      errors: result.errors,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const nowFn2 = process.env.DATABASE_URL ? "NOW()" : "datetime('now')";
    await db.query(
      `INSERT INTO ingestion_log (source, status, records_count, error_message, completed_at)
       VALUES (?, ?, ?, ?, ${nowFn2})`,
      [source, "error", 0, msg]
    ).catch(() => {}); // Don't fail if logging fails
    logger.error("Ingestion failed", { source, error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
