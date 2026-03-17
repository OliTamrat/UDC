import { NextRequest, NextResponse } from "next/server";
import { getDbClient, DbClient } from "@/lib/db";
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

// Validation ranges for new EAV parameters
const MEASUREMENT_VALID_RANGES: Record<string, { min: number; max: number }> = {
  temperature:      { min: -5,  max: 45 },
  dissolved_oxygen: { min: 0,   max: 20 },
  ph:               { min: 0,   max: 14 },
  turbidity:        { min: 0,   max: 4000 },
  turbidity_field:  { min: 0,   max: 4000 },
  conductivity:     { min: 0,   max: 10000 },
  ecoli:            { min: 0,   max: 100000 },
  nitrate_n:        { min: 0,   max: 100 },
  nitrate_nitrite:  { min: 0,   max: 100 },
  nitrogen_total:   { min: 0,   max: 100 },
  kjeldahl_nitrogen:{ min: 0,   max: 100 },
  phosphorus_total: { min: 0,   max: 50 },
  orthophosphate:   { min: 0,   max: 50 },
  total_coliform:   { min: 0,   max: 1000000 },
  lead_total:       { min: 0,   max: 10000 },
  hardness:         { min: 0,   max: 5000 },
  ssc:              { min: 0,   max: 100000 },
  tds:              { min: 0,   max: 50000 },
  temperature_air:  { min: -40, max: 60 },
  ssd:              { min: 0,   max: 1000000 },
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

function validateMeasurement(paramId: string, value: number): boolean {
  const range = MEASUREMENT_VALID_RANGES[paramId];
  if (!range) return true; // no range defined = accept
  return !isNaN(value) && value >= range.min && value <= range.max;
}

// ---------------------------------------------------------------------------
// Helper: insert into EAV measurements table
// ---------------------------------------------------------------------------
// Map from legacy readings columns to EAV parameter IDs
const LEGACY_TO_EAV: Record<string, string> = {
  temperature: "temperature",
  dissolved_oxygen: "dissolved_oxygen",
  ph: "ph",
  turbidity: "turbidity",
  conductivity: "conductivity",
  ecoli_count: "ecoli",
  nitrate_n: "nitrate_n",
  phosphorus: "phosphorus_total",
};

async function insertMeasurements(
  db: DbClient,
  stationId: string,
  timestamp: string,
  values: Record<string, number | null | undefined>,
  source: string,
  qualifier?: string,
): Promise<number> {
  let count = 0;
  for (const [field, paramId] of Object.entries(LEGACY_TO_EAV)) {
    const val = values[field];
    if (val == null) continue;
    await db.query(
      `INSERT INTO measurements (station_id, parameter_id, timestamp, value, qualifier, source)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [stationId, paramId, timestamp, val, qualifier ?? null, source]
    );
    count++;
  }
  return count;
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

// USGS pcode → EAV parameter ID (for direct measurements insertion)
const USGS_PCODE_TO_PARAM: Record<string, string> = {
  "00010": "temperature",
  "00300": "dissolved_oxygen",
  "00400": "ph",
  "63680": "turbidity",
  "00095": "conductivity",
};

// Active USGS sites with water-quality sensors in the DC/Anacostia watershed
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

async function ingestUSGS(): Promise<{ count: number; measurementCount: number; errors: string[]; validationWarnings: string[] }> {
  const db = await getDbClient();
  const errors: string[] = [];
  const validationWarnings: string[] = [];
  let totalCount = 0;
  let totalMeasurements = 0;

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
      // Also track per-timestamp per-pcode for EAV
      const eavByTime: Record<string, Array<{ paramId: string; value: number }>> = {};

      for (const series of timeSeries) {
        const paramCode = series.variable?.variableCode?.[0]?.value;
        const dbField = paramCode ? USGS_PARAMS[paramCode] : undefined;
        const eavParamId = paramCode ? USGS_PCODE_TO_PARAM[paramCode] : undefined;
        if (!dbField) continue;

        for (const val of series.values?.[0]?.value ?? []) {
          if (!val.value || val.value === "-999999") continue;
          const ts = val.dateTime;
          const numVal = parseFloat(val.value);

          if (!readingsByTime[ts]) readingsByTime[ts] = {};
          readingsByTime[ts][dbField] = numVal;

          if (eavParamId) {
            if (!eavByTime[ts]) eavByTime[ts] = [];
            eavByTime[ts].push({ paramId: eavParamId, value: numVal });
          }
        }
      }

      // Insert grouped readings (legacy + EAV)
      let count = 0;
      for (const [timestamp, values] of Object.entries(readingsByTime)) {
        const { valid, warnings } = validateReading(values as ReadingValues);
        if (warnings.length > 0) {
          validationWarnings.push(...warnings.map((w) => `USGS ${site.usgs} @ ${timestamp}: ${w}`));
        }

        // Legacy readings table
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

        // EAV measurements table
        const eavEntries = eavByTime[timestamp] || [];
        for (const entry of eavEntries) {
          if (validateMeasurement(entry.paramId, entry.value)) {
            await db.query(
              `INSERT INTO measurements (station_id, parameter_id, timestamp, value, source)
               VALUES (?, ?, ?, ?, 'usgs')`,
              [site.stationId, entry.paramId, timestamp, entry.value]
            );
            totalMeasurements++;
          }
        }
      }

      totalCount += count;
      logger.info(`USGS ingest: ${count} readings from site ${site.usgs}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`USGS ${site.usgs}: ${msg}`);
      logger.error(`USGS ingest failed for site ${site.usgs}`, { error: msg });
    }
  }

  return { count: totalCount, measurementCount: totalMeasurements, errors, validationWarnings };
}

// ---------------------------------------------------------------------------
// EPA Water Quality Portal (WQX) integration — legacy readings
// ---------------------------------------------------------------------------

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

const EPA_HUC = "02070010"; // Anacostia River watershed

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

async function ingestEPA(): Promise<{ count: number; measurementCount: number; errors: string[]; validationWarnings: string[] }> {
  const db = await getDbClient();
  const errors: string[] = [];
  const validationWarnings: string[] = [];
  let totalCount = 0;
  let totalMeasurements = 0;

  const characteristics = Object.keys(EPA_CHARACTERISTICS).map(encodeURIComponent).join(";");
  const url = `https://www.waterqualitydata.us/data/Result/search?huc=${EPA_HUC}&characteristicName=${characteristics}&startDateLo=01-01-2020&mimeType=application/json&sorted=no&zip=no`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      errors.push(`EPA WQP: HTTP ${response.status}`);
      return { count: 0, measurementCount: 0, errors, validationWarnings };
    }

    const results: EPAResult[] = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      logger.info("EPA WQP: no results returned for Anacostia watershed");
      return { count: 0, measurementCount: 0, errors, validationWarnings };
    }

    const grouped: Record<string, Record<string, ReadingValues & { stationId: string }>> = {};

    for (const result of results) {
      const monLocId = result.MonitoringLocationIdentifier || "";
      const stationId = EPA_STATION_MAP[monLocId];
      if (!stationId) continue;

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

    for (const [compositeKey, stationMap] of Object.entries(grouped)) {
      const timestamp = compositeKey.split("::")[1];
      for (const [, reading] of Object.entries(stationMap)) {
        const { valid, warnings } = validateReading(reading);
        if (warnings.length > 0) {
          validationWarnings.push(...warnings.map((w) => `EPA ${reading.stationId} @ ${timestamp}: ${w}`));
        }

        // Legacy readings table
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

        // EAV measurements table
        const mc = await insertMeasurements(db, reading.stationId, timestamp, valid as Record<string, number | null>, "epa");
        totalMeasurements += mc;
      }
    }

    logger.info(`EPA WQP ingest: ${totalCount} readings from Anacostia watershed`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`EPA WQP: ${msg}`);
    logger.error("EPA WQP ingest failed", { error: msg });
  }

  return { count: totalCount, measurementCount: totalMeasurements, errors, validationWarnings };
}

// ---------------------------------------------------------------------------
// WQP (Water Quality Portal) integration — broader parameters via EAV
// ---------------------------------------------------------------------------

// WQP characteristic names → EAV parameter IDs
const WQP_CHARACTERISTICS: Record<string, string> = {
  "Temperature, water":                        "temperature",
  "Dissolved oxygen (DO)":                     "dissolved_oxygen",
  "pH":                                        "ph",
  "Turbidity":                                 "turbidity",
  "Specific conductance":                      "conductivity",
  "Escherichia coli":                          "ecoli",
  "Nitrate":                                   "nitrate_n",
  "Phosphorus":                                "phosphorus_total",
  "Nitrate + Nitrite":                         "nitrate_nitrite",
  "Nitrogen":                                  "nitrogen_total",
  "Kjeldahl nitrogen":                         "kjeldahl_nitrogen",
  "Orthophosphate":                            "orthophosphate",
  "Coliform, total":                           "total_coliform",
  "Lead":                                      "lead_total",
  "Hardness, Ca, Mg":                          "hardness",
  "Suspended Sediment Concentration (SSC)":    "ssc",
  "Total dissolved solids":                    "tds",
  "Temperature, air":                          "temperature_air",
  "Suspended sediment discharge":              "ssd",
};

async function ingestWQP(): Promise<{ count: number; measurementCount: number; errors: string[]; validationWarnings: string[] }> {
  const db = await getDbClient();
  const errors: string[] = [];
  const validationWarnings: string[] = [];
  let totalMeasurements = 0;

  // Use DC state FIPS code for broader coverage (DC DOEE + USGS + EPA sites)
  const characteristics = Object.keys(WQP_CHARACTERISTICS).map(encodeURIComponent).join(";");
  const url = `https://www.waterqualitydata.us/data/Result/search?statecode=US:11&characteristicName=${characteristics}&startDateLo=01-01-2020&mimeType=application/json&sorted=no&zip=no`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(120000), // 2 min timeout for large WQP datasets
    });

    if (!response.ok) {
      errors.push(`WQP: HTTP ${response.status}`);
      return { count: 0, measurementCount: 0, errors, validationWarnings };
    }

    const results: EPAResult[] = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      logger.info("WQP: no results returned for DC");
      return { count: 0, measurementCount: 0, errors, validationWarnings };
    }

    // Group by station + timestamp + characteristic
    for (const result of results) {
      const monLocId = result.MonitoringLocationIdentifier || "";
      const stationId = EPA_STATION_MAP[monLocId];
      if (!stationId) continue; // Skip stations we don't track

      const charName = result.CharacteristicName || "";
      const paramId = WQP_CHARACTERISTICS[charName];
      if (!paramId) continue;

      const date = result.ActivityStartDate || "";
      const time = result.ActivityStartTime?.Time || "12:00:00";
      const timestamp = `${date}T${time}`;
      if (!date) continue;

      const value = parseFloat(result.ResultMeasureValue || "");
      if (isNaN(value)) continue;

      // Validate
      if (!validateMeasurement(paramId, value)) {
        validationWarnings.push(`WQP ${stationId} @ ${timestamp}: ${charName} = ${value} out of range — rejected`);
        continue;
      }

      // Insert directly into EAV measurements table
      await db.query(
        `INSERT INTO measurements (station_id, parameter_id, timestamp, value, source)
         VALUES (?, ?, ?, ?, 'wqp')`,
        [stationId, paramId, timestamp, value]
      );
      totalMeasurements++;
    }

    logger.info(`WQP ingest: ${totalMeasurements} measurements from DC stations`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`WQP: ${msg}`);
    logger.error("WQP ingest failed", { error: msg });
  }

  return { count: 0, measurementCount: totalMeasurements, errors, validationWarnings };
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
    let result: { count: number; measurementCount: number; errors: string[]; validationWarnings: string[] };

    if (source === "usgs") {
      result = await ingestUSGS();
    } else if (source === "epa") {
      result = await ingestEPA();
    } else if (source === "wqp") {
      result = await ingestWQP();
    } else {
      return NextResponse.json({ error: `Unknown source: ${source}. Supported: usgs, epa, wqp` }, { status: 400 });
    }

    const status = result.errors.length === 0 ? "success" : "error";
    const nowFn = process.env.DATABASE_URL ? "NOW()" : "datetime('now')";
    await db.query(
      `INSERT INTO ingestion_log (source, status, records_count, error_message, completed_at)
       VALUES (?, ?, ?, ?, ${nowFn})`,
      [source, status, result.count + result.measurementCount, result.errors.join("; ") || null]
    );

    return NextResponse.json({
      source,
      status,
      records_ingested: result.count,
      measurements_ingested: result.measurementCount,
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
