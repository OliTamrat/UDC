import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Data validation — reject physically impossible readings
// ---------------------------------------------------------------------------
interface ReadingValues {
  temperature?: number | null;
  dissolved_oxygen?: number | null;
  ph?: number | null;
  turbidity?: number | null;
  conductivity?: number | null;
  ecoli_count?: number | null;
  nitrate_n?: number | null;
  phosphorus?: number | null;
}

const VALID_RANGES: Record<string, { min: number; max: number; label: string }> = {
  temperature:      { min: -5,  max: 45,     label: "Temperature (°C)" },
  dissolved_oxygen: { min: 0,   max: 20,     label: "Dissolved Oxygen (mg/L)" },
  ph:               { min: 0,   max: 14,     label: "pH" },
  turbidity:        { min: 0,   max: 4000,   label: "Turbidity (NTU)" },
  conductivity:     { min: 0,   max: 10000,  label: "Conductivity (µS/cm)" },
  ecoli_count:      { min: 0,   max: 100000, label: "E. coli (CFU/100mL)" },
  nitrate_n:        { min: 0,   max: 100,    label: "Nitrate-N (mg/L)" },
  phosphorus:       { min: 0,   max: 50,     label: "Phosphorus (mg/L)" },
};

function validateReading(values: ReadingValues): { valid: ReadingValues; warnings: string[] } {
  const valid: ReadingValues = { ...values };
  const warnings: string[] = [];

  for (const [field, range] of Object.entries(VALID_RANGES)) {
    const val = valid[field as keyof ReadingValues];
    if (val == null) continue;
    if (typeof val !== "number" || isNaN(val) || val < range.min || val > range.max) {
      warnings.push(`${range.label}: ${val} out of range [${range.min}, ${range.max}] — rejected`);
      (valid as Record<string, unknown>)[field] = null;
    }
  }

  return { valid, warnings };
}

// ---------------------------------------------------------------------------
// USGS NWIS integration
// ---------------------------------------------------------------------------
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
  { usgs: "01651000", stationId: "ANA-001" }, // NW Branch Anacostia nr Hyattsville, MD
  { usgs: "01649500", stationId: "ANA-002" }, // NE Branch Anacostia at Riverdale, MD (active WQ)
  { usgs: "01651827", stationId: "ANA-003" }, // Anacostia River nr Buzzard Point at Washington, DC
  { usgs: "01651750", stationId: "ANA-004" }, // Anacostia River at Washington, DC (near Anacostia Park)
  { usgs: "01646500", stationId: "PB-001" },  // Potomac River at Little Falls (closest WQ gauge)
  { usgs: "01651800", stationId: "WB-001" },  // Watts Branch at Minnesota Ave Bridge
  { usgs: "01651770", stationId: "HR-001" },  // Hickey Run at National Arboretum
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

async function ingestUSGS(): Promise<{ count: number; errors: string[]; validationWarnings: string[] }> {
  const db = await getDbClient();
  const errors: string[] = [];
  const validationWarnings: string[] = [];
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

      // Insert grouped readings with validation
      let count = 0;
      for (const [timestamp, values] of Object.entries(readingsByTime)) {
        const { valid, warnings } = validateReading(values as ReadingValues);
        if (warnings.length > 0) {
          validationWarnings.push(...warnings.map((w) => `USGS ${site.usgs} @ ${timestamp}: ${w}`));
        }

        await db.query(
          `INSERT INTO readings (station_id, timestamp, temperature, dissolved_oxygen, ph, turbidity, conductivity, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'usgs')`,
          [
            site.stationId,
            timestamp,
            valid.temperature ?? null,
            valid.dissolved_oxygen ?? null,
            valid.ph ?? null,
            valid.turbidity ?? null,
            valid.conductivity ?? null,
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

  return { count: totalCount, errors, validationWarnings };
}

// ---------------------------------------------------------------------------
// EPA Water Quality Portal (WQX) integration
// ---------------------------------------------------------------------------

// EPA characteristic names mapped to our DB fields
const EPA_CHARACTERISTICS: Record<string, string> = {
  "Temperature, water":            "temperature",
  "Dissolved oxygen (DO)":         "dissolved_oxygen",
  "pH":                            "ph",
  "Turbidity":                     "turbidity",
  "Specific conductance":          "conductivity",
  "Escherichia coli":              "ecoli_count",
  "Nitrate":                       "nitrate_n",
  "Phosphorus":                    "phosphorus",
};

// Anacostia watershed HUC-8 code and specific EPA monitoring locations
const EPA_HUC = "02070010"; // Anacostia River watershed

// Map EPA monitoring locations to our station IDs
const EPA_STATION_MAP: Record<string, string> = {
  "USGS-01651000": "ANA-001",
  "USGS-01649500": "ANA-002",
  "USGS-01651827": "ANA-003",
  "USGS-01651750": "ANA-004",
  "USGS-01646500": "PB-001",
  "USGS-01651800": "WB-001",
  "USGS-01651770": "HR-001",
};

interface EPAResult {
  OrganizationIdentifier?: string;
  MonitoringLocationIdentifier?: string;
  ActivityStartDate?: string;
  ActivityStartTime?: { Time?: string };
  CharacteristicName?: string;
  ResultMeasureValue?: string;
  ResultMeasure?: { MeasureUnitCode?: string };
}

async function ingestEPA(): Promise<{ count: number; errors: string[]; validationWarnings: string[] }> {
  const db = await getDbClient();
  const errors: string[] = [];
  const validationWarnings: string[] = [];
  let totalCount = 0;

  // Fetch last 5 years of data from the Anacostia watershed
  const characteristics = Object.keys(EPA_CHARACTERISTICS).map(encodeURIComponent).join(";");
  const url = `https://www.waterqualitydata.us/data/Result/search?huc=${EPA_HUC}&characteristicName=${characteristics}&startDateLo=01-01-2020&mimeType=application/json&sorted=no&zip=no`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(60000), // 60s timeout for large datasets
    });

    if (!response.ok) {
      errors.push(`EPA WQP: HTTP ${response.status}`);
      return { count: 0, errors, validationWarnings };
    }

    const results: EPAResult[] = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      logger.info("EPA WQP: no results returned for Anacostia watershed");
      return { count: 0, errors, validationWarnings };
    }

    // Group results by station + timestamp
    const grouped: Record<string, Record<string, ReadingValues & { stationId: string }>> = {};

    for (const result of results) {
      const monLocId = result.MonitoringLocationIdentifier || "";
      const stationId = EPA_STATION_MAP[monLocId];
      if (!stationId) continue; // Skip stations we don't track

      const charName = result.CharacteristicName || "";
      const dbField = EPA_CHARACTERISTICS[charName];
      if (!dbField) continue;

      const date = result.ActivityStartDate || "";
      const time = result.ActivityStartTime?.Time || "12:00:00";
      const timestamp = `${date}T${time}`;
      if (!date) continue;

      const value = parseFloat(result.ResultMeasureValue || "");
      if (isNaN(value)) continue;

      const key = `${stationId}::${timestamp}`;
      if (!grouped[key]) {
        grouped[key] = {} as Record<string, ReadingValues & { stationId: string }>;
      }
      if (!grouped[key][stationId]) {
        grouped[key][stationId] = { stationId } as ReadingValues & { stationId: string };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (grouped[key][stationId] as any)[dbField] = value;
    }

    // Insert validated readings
    for (const [compositeKey, stationMap] of Object.entries(grouped)) {
      const timestamp = compositeKey.split("::")[1];
      for (const [, reading] of Object.entries(stationMap)) {
        const { valid, warnings } = validateReading(reading);
        if (warnings.length > 0) {
          validationWarnings.push(...warnings.map((w) => `EPA ${reading.stationId} @ ${timestamp}: ${w}`));
        }

        await db.query(
          `INSERT INTO readings (station_id, timestamp, temperature, dissolved_oxygen, ph, turbidity, conductivity, ecoli_count, nitrate_n, phosphorus, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'epa')`,
          [
            reading.stationId,
            timestamp,
            valid.temperature ?? null,
            valid.dissolved_oxygen ?? null,
            valid.ph ?? null,
            valid.turbidity ?? null,
            valid.conductivity ?? null,
            valid.ecoli_count ?? null,
            valid.nitrate_n ?? null,
            valid.phosphorus ?? null,
          ]
        );
        totalCount++;
      }
    }

    logger.info(`EPA WQP ingest: ${totalCount} readings from Anacostia watershed`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`EPA WQP: ${msg}`);
    logger.error("EPA WQP ingest failed", { error: msg });
  }

  return { count: totalCount, errors, validationWarnings };
}

// ---------------------------------------------------------------------------
// API handlers
// ---------------------------------------------------------------------------

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
    let result: { count: number; errors: string[]; validationWarnings: string[] };

    if (source === "usgs") {
      result = await ingestUSGS();
    } else if (source === "epa") {
      result = await ingestEPA();
    } else {
      return NextResponse.json({ error: `Unknown source: ${source}. Supported: usgs, epa` }, { status: 400 });
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
      validation_warnings: result.validationWarnings,
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
