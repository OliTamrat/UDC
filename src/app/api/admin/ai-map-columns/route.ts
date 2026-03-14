import { NextRequest, NextResponse } from "next/server";

function checkAuth(request: NextRequest): NextResponse | null {
  const adminKey = process.env.ADMIN_API_KEY?.trim();

  if (!adminKey && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "ADMIN_API_KEY not configured. Admin access is disabled." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (adminKey && token !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

/**
 * POST /api/admin/ai-map-columns
 * Uses Claude to intelligently map uploaded column names to our schema.
 * Falls back to basic heuristics if ANTHROPIC_API_KEY is not set.
 */
export async function POST(request: NextRequest) {
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  const { columns, sampleRows, dataType } = await request.json();

  if (!columns || !Array.isArray(columns)) {
    return NextResponse.json({ error: "columns array required" }, { status: 400 });
  }

  const schemaFields = dataType === "stations"
    ? {
        id: "Unique station identifier (e.g. ANA-001)",
        name: "Human-readable station name",
        latitude: "GPS latitude (decimal degrees)",
        longitude: "GPS longitude (decimal degrees)",
        type: "Station type: river, stream, stormwater, or green-infrastructure",
        status: "Operational status: active, maintenance, or offline",
        parameters: "JSON array of measured parameters",
      }
    : {
        station_id: "Station identifier (e.g. ANA-001)",
        timestamp: "Date/time of measurement (ISO 8601)",
        temperature: "Water temperature in °C",
        dissolved_oxygen: "Dissolved oxygen in mg/L",
        ph: "pH value (0-14 scale)",
        turbidity: "Turbidity in NTU",
        conductivity: "Specific conductance in µS/cm",
        ecoli_count: "E. coli count in CFU/100mL",
        nitrate_n: "Nitrate-nitrogen in mg/L",
        phosphorus: "Total phosphorus in mg/L",
        source: "Data source identifier (e.g. usgs, epa, manual)",
      };

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    // Use Claude for intelligent mapping
    try {
      const prompt = `You are a data schema mapping assistant for a water quality monitoring system.

Given these uploaded CSV/JSON column names:
${JSON.stringify(columns)}

${sampleRows ? `Sample data rows:\n${JSON.stringify(sampleRows.slice(0, 3), null, 2)}` : ""}

Map each column to the closest matching field in our database schema:
${JSON.stringify(schemaFields, null, 2)}

Rules:
- Only map columns that clearly correspond to a schema field
- Leave unmapped columns as null
- Consider unit variations (e.g., "DO_mg_L" → "dissolved_oxygen")
- Consider abbreviations (e.g., "temp" → "temperature", "EC" → "ecoli_count")
- If a column contains dates/times, map it to "timestamp"
- If sample data helps clarify (e.g., values 0-14 are likely pH), use that

Respond with ONLY a JSON object mapping each input column name to either a schema field name or null:
{"column_name": "schema_field_or_null", ...}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || "";
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const mapping = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            mapping,
            method: "ai",
            model: "claude-haiku-4-5",
          });
        }
      }
    } catch {
      // Fall through to heuristic mapping
    }
  }

  // Fallback: basic heuristic mapping
  const ALIASES: Record<string, string> = {
    station_id: "station_id", stationid: "station_id", station: "station_id",
    site_id: "station_id", site: "station_id", monitoring_location: "station_id",
    timestamp: "timestamp", date: "timestamp", datetime: "timestamp",
    date_time: "timestamp", sample_date: "timestamp",
    temperature: "temperature", temp: "temperature", water_temp: "temperature",
    dissolved_oxygen: "dissolved_oxygen", do: "dissolved_oxygen",
    ph: "ph", turbidity: "turbidity", turb: "turbidity",
    conductivity: "conductivity", cond: "conductivity", specific_conductance: "conductivity",
    ecoli_count: "ecoli_count", ecoli: "ecoli_count", e_coli: "ecoli_count",
    nitrate_n: "nitrate_n", nitrate: "nitrate_n", no3_n: "nitrate_n",
    phosphorus: "phosphorus", total_phosphorus: "phosphorus", tp: "phosphorus",
    source: "source",
    id: "id", name: "name", latitude: "latitude", lat: "latitude",
    longitude: "longitude", lng: "longitude", lon: "longitude",
    type: "type", status: "status", parameters: "parameters",
  };

  const mapping: Record<string, string | null> = {};
  const validFields = new Set(Object.keys(schemaFields));

  for (const col of columns) {
    const normalized = col.toLowerCase().trim().replace(/[\s\-()°µ/]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    const mapped = ALIASES[normalized];
    mapping[col] = mapped && validFields.has(mapped) ? mapped : null;
  }

  return NextResponse.json({
    mapping,
    method: "heuristic",
  });
}
