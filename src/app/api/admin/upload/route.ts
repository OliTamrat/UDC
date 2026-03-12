import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

function checkAuth(request: NextRequest): NextResponse | null {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "ADMIN_API_KEY not configured. Admin access is disabled." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (adminKey && authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

// Valid ranges for data validation
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

// Known column aliases that map to our schema fields
const COLUMN_ALIASES: Record<string, string> = {
  // station_id aliases
  station_id: "station_id",
  stationid: "station_id",
  station: "station_id",
  site_id: "station_id",
  siteid: "station_id",
  site: "station_id",
  monitoring_location: "station_id",

  // timestamp aliases
  timestamp: "timestamp",
  date: "timestamp",
  datetime: "timestamp",
  date_time: "timestamp",
  sample_date: "timestamp",
  collection_date: "timestamp",
  activity_start_date: "timestamp",

  // temperature aliases
  temperature: "temperature",
  temp: "temperature",
  water_temp: "temperature",
  water_temperature: "temperature",
  "temperature_c": "temperature",
  "temp_c": "temperature",

  // dissolved oxygen
  dissolved_oxygen: "dissolved_oxygen",
  do: "dissolved_oxygen",
  do_mgl: "dissolved_oxygen",
  "dissolved_oxygen_mgl": "dissolved_oxygen",

  // pH
  ph: "ph",
  "ph_units": "ph",

  // turbidity
  turbidity: "turbidity",
  turb: "turbidity",
  "turbidity_ntu": "turbidity",

  // conductivity
  conductivity: "conductivity",
  cond: "conductivity",
  specific_conductance: "conductivity",
  "conductivity_uscm": "conductivity",
  spc: "conductivity",

  // E. coli
  ecoli_count: "ecoli_count",
  ecoli: "ecoli_count",
  e_coli: "ecoli_count",
  "ecoli_cfu": "ecoli_count",
  "e_coli_cfu_100ml": "ecoli_count",
  escherichia_coli: "ecoli_count",

  // nitrate
  nitrate_n: "nitrate_n",
  nitrate: "nitrate_n",
  "nitrate_mgl": "nitrate_n",
  no3_n: "nitrate_n",

  // phosphorus
  phosphorus: "phosphorus",
  total_phosphorus: "phosphorus",
  "phosphorus_mgl": "phosphorus",
  tp: "phosphorus",
};

function normalizeColumnName(name: string): string {
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/[()°µ\/]/g, "")
    .replace(/[\s\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return COLUMN_ALIASES[normalized] || normalized;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] || "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

export async function POST(request: NextRequest) {
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  const contentType = request.headers.get("content-type") || "";

  let rawHeaders: string[] = [];
  let rawRows: Record<string, string>[] = [];
  let dataType: "stations" | "readings" = "readings";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    dataType = (formData.get("type") as "stations" | "readings") || "readings";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".json")) {
      const json = JSON.parse(text);
      const data = Array.isArray(json) ? json : json.data || json.readings || json.stations || [json];
      rawHeaders = data.length > 0 ? Object.keys(data[0]) : [];
      rawRows = data.map((row: Record<string, unknown>) => {
        const r: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) {
          r[k] = v == null ? "" : String(v);
        }
        return r;
      });
    } else {
      // CSV
      const parsed = parseCSV(text);
      rawHeaders = parsed.headers;
      rawRows = parsed.rows;
    }
  } else {
    // JSON body
    const body = await request.json();
    dataType = body.type || "readings";
    const data = Array.isArray(body.data) ? body.data : [body.data];
    rawHeaders = data.length > 0 ? Object.keys(data[0]) : [];
    rawRows = data;
  }

  if (rawRows.length === 0) {
    return NextResponse.json({ error: "No data rows found" }, { status: 400 });
  }

  // Map columns
  const columnMapping: Record<string, string> = {};
  const unmapped: string[] = [];
  for (const header of rawHeaders) {
    const mapped = normalizeColumnName(header);
    if (mapped !== normalizeColumnName(header) || COLUMN_ALIASES[mapped]) {
      columnMapping[header] = COLUMN_ALIASES[mapped] || mapped;
    } else {
      // Check if it's a known schema field
      const schemaFields = dataType === "stations"
        ? ["id", "name", "latitude", "longitude", "type", "status", "parameters"]
        : ["station_id", "timestamp", "temperature", "dissolved_oxygen", "ph", "turbidity", "conductivity", "ecoli_count", "nitrate_n", "phosphorus", "source"];

      if (schemaFields.includes(mapped)) {
        columnMapping[header] = mapped;
      } else {
        unmapped.push(header);
      }
    }
  }

  const db = await getDbClient();
  let inserted = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (unmapped.length > 0) {
    warnings.push(`Unmapped columns (ignored): ${unmapped.join(", ")}`);
  }

  if (dataType === "stations") {
    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i];
      const row: Record<string, string> = {};
      for (const [origCol, value] of Object.entries(raw)) {
        const mappedCol = columnMapping[origCol];
        if (mappedCol) row[mappedCol] = value;
      }

      if (!row.id || !row.name || !row.latitude || !row.longitude || !row.type) {
        errors.push(`Row ${i + 1}: Missing required fields (id, name, latitude, longitude, type)`);
        continue;
      }

      try {
        await db.query(
          `INSERT INTO stations (id, name, latitude, longitude, type, status, parameters)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            row.id,
            row.name,
            parseFloat(row.latitude),
            parseFloat(row.longitude),
            row.type,
            row.status || "active",
            row.parameters || '["temperature","dissolved_oxygen","ph","turbidity"]',
          ]
        );
        inserted++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Row ${i + 1} (${row.id}): ${msg}`);
      }
    }
  } else {
    // Readings
    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i];
      const row: Record<string, string> = {};
      for (const [origCol, value] of Object.entries(raw)) {
        const mappedCol = columnMapping[origCol];
        if (mappedCol) row[mappedCol] = value;
      }

      if (!row.station_id || !row.timestamp) {
        errors.push(`Row ${i + 1}: Missing station_id or timestamp`);
        continue;
      }

      // Validate numeric ranges
      const values: Record<string, number | null> = {};
      for (const field of Object.keys(VALID_RANGES)) {
        const val = row[field] ? parseFloat(row[field]) : null;
        if (val !== null && !isNaN(val)) {
          const range = VALID_RANGES[field];
          if (val < range.min || val > range.max) {
            warnings.push(`Row ${i + 1}: ${range.label} = ${val} out of range [${range.min}, ${range.max}] — set to null`);
            values[field] = null;
          } else {
            values[field] = val;
          }
        } else {
          values[field] = null;
        }
      }

      try {
        await db.query(
          `INSERT INTO readings (station_id, timestamp, temperature, dissolved_oxygen, ph, turbidity, conductivity, ecoli_count, nitrate_n, phosphorus, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.station_id,
            row.timestamp,
            values.temperature,
            values.dissolved_oxygen,
            values.ph,
            values.turbidity,
            values.conductivity,
            values.ecoli_count,
            values.nitrate_n,
            values.phosphorus,
            row.source || "upload",
          ]
        );
        inserted++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Row ${i + 1} (${row.station_id}): ${msg}`);
      }
    }
  }

  // Log the upload
  const nowFn = process.env.DATABASE_URL ? "NOW()" : "datetime('now')";
  await db.query(
    `INSERT INTO ingestion_log (source, status, records_count, error_message, completed_at)
     VALUES (?, ?, ?, ?, ${nowFn})`,
    [
      `upload-${dataType}`,
      errors.length === 0 ? "success" : "error",
      inserted,
      errors.length > 0 ? errors.slice(0, 10).join("; ") : null,
    ]
  ).catch(() => {});

  return NextResponse.json({
    type: dataType,
    inserted,
    total_rows: rawRows.length,
    column_mapping: columnMapping,
    unmapped_columns: unmapped,
    warnings,
    errors,
  }, { status: errors.length > 0 && inserted === 0 ? 400 : errors.length > 0 ? 207 : 201 });
}
