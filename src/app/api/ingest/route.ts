import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

// USGS NWIS parameter codes for water quality
const USGS_PARAMS = {
  "00010": "temperature",    // Water temperature (°C)
  "00300": "dissolved_oxygen", // Dissolved oxygen (mg/L)
  "00400": "ph",              // pH
  "63680": "turbidity",       // Turbidity (NTU)
  "00095": "conductivity",    // Specific conductance (µS/cm)
} as const;

// USGS site IDs near the Anacostia watershed
// These are real USGS monitoring sites
const USGS_SITES = [
  { usgs: "01651000", stationId: "ANA-001" }, // Anacostia River at Hyattsville
  { usgs: "01651750", stationId: "ANA-003" }, // Anacostia River at DC
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
  const db = getDb();
  const errors: string[] = [];
  let totalCount = 0;

  const insertReading = db.prepare(`
    INSERT OR IGNORE INTO readings (station_id, timestamp, temperature, dissolved_oxygen, ph, turbidity, conductivity, source)
    VALUES (@station_id, @timestamp, @temperature, @dissolved_oxygen, @ph, @turbidity, @conductivity, 'usgs')
  `);

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
      if (!timeSeries) continue;

      // Group values by timestamp
      const readingsByTime: Record<string, Record<string, number>> = {};

      for (const series of timeSeries) {
        const paramCode = series.variable?.variableCode?.[0]?.value;
        const dbField = paramCode ? USGS_PARAMS[paramCode as keyof typeof USGS_PARAMS] : undefined;
        if (!dbField) continue;

        for (const val of series.values?.[0]?.value ?? []) {
          if (!val.value || val.value === "-999999") continue;
          const ts = val.dateTime;
          if (!readingsByTime[ts]) readingsByTime[ts] = {};
          readingsByTime[ts][dbField] = parseFloat(val.value);
        }
      }

      // Insert grouped readings
      const insertMany = db.transaction(() => {
        let count = 0;
        for (const [timestamp, values] of Object.entries(readingsByTime)) {
          insertReading.run({
            station_id: site.stationId,
            timestamp,
            temperature: values.temperature ?? null,
            dissolved_oxygen: values.dissolved_oxygen ?? null,
            ph: values.ph ?? null,
            turbidity: values.turbidity ?? null,
            conductivity: values.conductivity ?? null,
          });
          count++;
        }
        return count;
      });

      const count = insertMany();
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

export async function POST(request: NextRequest) {
  // Simple API key check for ingestion endpoint
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.INGEST_API_KEY;
  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get("source") || "usgs";

  const logEntry = db.prepare(`
    INSERT INTO ingestion_log (source, status, records_count, error_message, completed_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  try {
    let result: { count: number; errors: string[] };

    if (source === "usgs") {
      result = await ingestUSGS();
    } else {
      return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 });
    }

    const status = result.errors.length === 0 ? "success" : "error";
    logEntry.run(source, status, result.count, result.errors.join("; ") || null);

    return NextResponse.json({
      source,
      status,
      records_ingested: result.count,
      errors: result.errors,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEntry.run(source, "error", 0, msg);
    logger.error("Ingestion failed", { source, error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
