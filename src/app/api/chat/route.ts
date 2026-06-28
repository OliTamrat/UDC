import {
  streamText,
  convertToModelMessages,
  UIMessage,
  tool,
  stepCountIs,
  jsonSchema,
} from "ai";
import { google } from "@ai-sdk/google";
import { checkRateLimit } from "@/lib/rate-limit";
import { institution, watershed, usgsSites } from "@/config/site.config";

export const maxDuration = 60;

// Gemini 2.5 Flash — 62% cheaper than Claude Haiku 4.5
// $0.30/MTok input, $2.50/MTok output vs $1.00/$5.00
const CHAT_MODEL = process.env.CHAT_MODEL || "gemini-2.5-flash";

const activeStationCount = usgsSites.filter((s) => s.active).length;

const SYSTEM_PROMPT = `You are the ${institution.acronym} Water Resources Research Assistant, an AI-powered tool built into the ${institution.name}'s Water Resources Data Dashboard. You help researchers, students, and community members understand water quality data across the ${watershed.fullName} in ${watershed.region}.

CRITICAL FORMATTING RULES — follow these exactly:
- NEVER use markdown formatting in your responses. No asterisks (*), no hash symbols (#), no backticks, no bullet point symbols.
- Write in clear, flowing paragraphs with plain text.
- Use line breaks between paragraphs for readability.
- When listing items, use simple numbered lists (1, 2, 3) or write them in sentence form.
- When referencing values, write them naturally: "The dissolved oxygen level is 6.2 mg/L" not "**DO**: 6.2 mg/L".
- Present data comparisons as clear sentences: "Station ANA-001 recorded 7.1 mg/L, which is above the EPA minimum of 5.0 mg/L."
- Write like a knowledgeable research analyst preparing a briefing — professional, clear, accessible, no formatting symbols.

Your Knowledge Domain

Monitoring Network:
12 stations across the ${watershed.name} watershed: 4 river stations (ANA-001 to ANA-004), 3 tributary stations (WB-001 Watts Branch, PB-001 Pope Branch, HR-001 Hickey Run), 3 green infrastructure sites (GI-001 ${institution.acronym} Van Ness Green Roof, GI-002 East Capitol Urban Farm, GI-003 PR Harris Food Hub), and 2 stormwater outfalls (SW-001 Benning Road, SW-002 South Capitol). ${activeStationCount} USGS sites currently reporting live data; data also sourced from USGS NWIS, EPA Water Quality Portal, DC DOEE, and ${institution.acronym} field measurements.

Monitored Parameters (25 total across 5 categories):

Physical (10): Temperature (degrees C), Dissolved Oxygen (min 5.0 mg/L), pH (6.5 to 9.0), Turbidity (NTU), Conductivity (microsiemens/cm, typical 150 to 500, above 1000 indicates pollution), Hardness (mg/L CaCO3), Suspended Sediment Concentration (mg/L), Total Dissolved Solids (max 500 mg/L), Air Temperature (degrees C), Suspended Sediment Discharge (tons/day).

Nutrients (6): Nitrate-N (max 10 mg/L), Total Phosphorus (max 0.1 mg/L), Nitrate+Nitrite (max 10 mg/L), Total Nitrogen (mg/L), Kjeldahl Nitrogen (mg/L), Orthophosphate (mg/L).

Biological (2): E. coli (max 410 CFU/100mL, geometric mean 126), Total Coliform (CFU/100mL).

Metals (1): Lead, total (max 15 micrograms/L, EPA action level).

Emerging Contaminants / Organic (5): Methylene chloride (max 5 micrograms/L), Vinyl chloride (max 2 micrograms/L), Tributyl phosphate (micrograms/L), Triphenyl phosphate (micrograms/L), TCEP / Tris(2-chloroethyl) phosphate (micrograms/L) — flame retardants and plasticizers detected in ${watershed.name} sediment.

EPA Water Quality Standards Summary (DC recreational waters):
Dissolved Oxygen (DO): minimum 5.0 mg/L (below this level causes aquatic stress).
pH: 6.5 to 9.0.
E. coli: max 410 CFU/100mL (geometric mean 126 CFU/100mL).
Temperature: species-dependent, warm-water fishery below 32 degrees C.
Turbidity: below 50 NTU for healthy conditions.
Conductivity: typical freshwater 150 to 500 microsiemens/cm; above 1000 indicates pollution.
Nitrate-N: below 10 mg/L (drinking water standard).
Total Phosphorus: below 0.1 mg/L to prevent eutrophication.
Lead: below 15 micrograms/L (EPA action level for drinking water).
Total Dissolved Solids: below 500 mg/L.

Seasonal Patterns (${watershed.name} watershed):
Winter (Dec to Feb): Low temps (3 to 6 degrees C), high DO (10 to 12 mg/L), low E. coli (below 200 CFU).
Spring (Mar to May): Rising temps (8 to 15 degrees C), moderate DO (8 to 10 mg/L), increasing E. coli from runoff.
Summer (Jun to Aug): High temps (24 to 28 degrees C), LOW DO (5 to 7 mg/L, often near EPA minimum), HIGHEST E. coli (above 1000 CFU after storms), algal blooms.
Fall (Sep to Nov): Declining temps (10 to 18 degrees C), recovering DO (7 to 9 mg/L).

Key Environmental Issues:
Combined Sewer Overflows (CSOs) discharge raw sewage during heavy rain, primarily affecting Wards 7 and 8. PFAS emerging contaminants detected in sediment. Environmental justice: Wards 7 and 8 have highest flood risk, highest impervious surface coverage, lowest green space access. DC Water completed its 23-mile Clean Rivers tunnel system in September 2023 to reduce CSO volume by 96%. DOEE has deployed 35,000 mussels since 2019 for biological filtration.

${institution.acronym} Research (${institution.departmentAcronym}/${institution.instituteAcronym}):
Director: ${institution.principalInvestigator}. Focus areas: green roof stormwater retention, urban food hub BMPs, PFAS assessment, Potomac source water protection, tree cell filtration, rainwater reuse safety. ${institution.lab} (${institution.labAcronym}) conducts certified water analyses.

How to Respond:
1. Be scientifically accurate. Cite EPA thresholds when discussing water quality. Use proper units (mg/L, CFU/100mL, microsiemens/cm, NTU).
2. Interpret data in context. Do not just state numbers — explain what they mean for aquatic health, public safety, and communities.
3. Flag anomalies. If a user asks about high E. coli or low DO, explain likely causes (CSOs, seasonal warming, nutrient loading).
4. Suggest next steps. Point users to the dashboard station detail pages, export tools, or research portal when relevant.
5. Be accessible. Explain technical concepts clearly for students and community members, not just experts.
6. Stay grounded. If you do not have specific data, say so. Recommend checking the station detail page or exporting data for analysis.
7. Use the tools available to query real station data when users ask about specific readings or trends. Use getMeasurements for detailed parameter queries (nutrients, metals, emerging contaminants, violations).
8. Highlight emerging contaminants. When users ask about pollution or PFAS, mention the 5 emerging organic contaminants being tracked.
9. When analyzing trends or generating reports, present findings as clear narrative paragraphs with specific numbers, EPA comparisons, and plain-language implications. Structure longer responses with numbered sections but never use markdown symbols.`;

export async function POST(req: Request) {
  // --- CSRF / Origin protection ---
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return Response.json(
          { error: "Cross-origin requests are not allowed" },
          { status: 403 },
        );
      }
    } catch {
      return Response.json(
        { error: "Invalid origin header" },
        { status: 403 },
      );
    }
  }

  // --- Rate limiting ---
  // Burst limit: 5 requests/minute per IP (prevents spam while allowing natural conversation)
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const burstResult = checkRateLimit(`chat:burst:${clientIp}`, {
    limit: 5,
    windowMs: 60_000,
  });

  if (!burstResult.allowed) {
    return Response.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((burstResult.resetAt - Date.now()) / 1000),
          ),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "AI assistant is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY in environment variables.",
      },
      { status: 503 },
    );
  }

  // Derive base URL from request for tool calls (works on Vercel, Docker, and local dev)
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  const hostHeader = req.headers.get("host") || new URL(req.url).host;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || `${forwardedProto}://${hostHeader}`;

  let body: { messages: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages } = body;

  // Guard against empty messages (used by the API key check)
  if (!messages || messages.length === 0) {
    return Response.json({ status: "ok" });
  }

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(messages);
  } catch (err) {
    console.error("[chat] Message conversion error:", err);
    return Response.json(
      { error: "Failed to process messages" },
      { status: 400 },
    );
  }

  try {
    const result = streamText({
      model: google(CHAT_MODEL),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools: {
        getStationData: tool({
          description:
            "Get current readings and metadata for a specific monitoring station by ID (e.g. ANA-001, WB-001, GI-001)",
          inputSchema: jsonSchema<{ stationId: string }>({
            type: "object",
            properties: {
              stationId: {
                type: "string",
                description:
                  "The station ID, e.g. ANA-001, WB-001, HR-001, GI-001",
              },
            },
            required: ["stationId"],
          }),
          execute: async ({ stationId }) => {
            try {
              const res = await fetch(`${baseUrl}/api/stations`);
              if (!res.ok) return { error: "Failed to fetch stations" };
              const stations = await res.json();
              const list = Array.isArray(stations) ? stations : stations.stations || [];
              const station = list.find(
                (s: Record<string, unknown>) =>
                  (s.id as string).toUpperCase() === stationId.toUpperCase(),
              );
              if (!station)
                return { error: `Station ${stationId} not found` };
              return station;
            } catch {
              return { error: "Could not reach stations API" };
            }
          },
        }),
        getStationHistory: tool({
          description:
            "Get the most recent water quality readings for a station. Returns newest readings first for trend analysis. Always use this to get current/recent data.",
          inputSchema: jsonSchema<{ stationId: string; limit?: number }>({
            type: "object",
            properties: {
              stationId: {
                type: "string",
                description: "The station ID",
              },
              limit: {
                type: "number",
                description:
                  "Max number of readings to return (default 50)",
              },
            },
            required: ["stationId"],
          }),
          execute: async ({ stationId, limit }) => {
            try {
              const url = `${baseUrl}/api/stations/${stationId}/history?limit=${limit || 50}&sort=desc`;
              const res = await fetch(url);
              if (!res.ok) return { error: "Failed to fetch history" };
              return await res.json();
            } catch {
              return { error: "Could not reach history API" };
            }
          },
        }),
        listAllStations: tool({
          description:
            "List all 12 monitoring stations with their current status, type, and latest readings.",
          inputSchema: jsonSchema<Record<string, never>>({
            type: "object",
            properties: {},
          }),
          execute: async () => {
            try {
              const res = await fetch(`${baseUrl}/api/stations`);
              if (!res.ok) return { error: "Failed to fetch stations" };
              return await res.json();
            } catch {
              return { error: "Could not reach stations API" };
            }
          },
        }),
        getMeasurements: tool({
          description:
            "Query the measurements database for any of the 25 monitored parameters. Supports filtering by parameter IDs, station IDs, category, source, date range, and EPA threshold violations. Use this for detailed parameter data, emerging contaminants, nutrients, metals, and cross-station comparisons.",
          inputSchema: jsonSchema<{
            params?: string;
            stations?: string;
            category?: string;
            violations?: boolean;
            from?: string;
            to?: string;
            limit?: number;
          }>({
            type: "object",
            properties: {
              params: {
                type: "string",
                description:
                  "Comma-separated parameter IDs: temperature, dissolved_oxygen, ph, turbidity, conductivity, ecoli, nitrate_n, phosphorus_total, nitrate_nitrite, nitrogen_total, kjeldahl_nitrogen, orthophosphate, total_coliform, lead_total, hardness, ssc, tds, temperature_air, turbidity_field, ssd, methylene_chloride, vinyl_chloride, tributyl_phosphate, triphenyl_phosphate, tcep",
              },
              stations: {
                type: "string",
                description:
                  "Comma-separated station IDs (e.g. ANA-001,WB-001)",
              },
              category: {
                type: "string",
                description:
                  "Filter by category: physical, nutrients, metals, biological, organic",
              },
              violations: {
                type: "boolean",
                description:
                  "If true, only return readings that exceed EPA thresholds",
              },
              from: {
                type: "string",
                description: "Start date (ISO 8601, e.g. 2026-01-01)",
              },
              to: {
                type: "string",
                description: "End date (ISO 8601, e.g. 2026-03-18)",
              },
              limit: {
                type: "number",
                description: "Max results (default 100, max 500)",
              },
            },
          }),
          execute: async ({
            params,
            stations,
            category,
            violations,
            from,
            to,
            limit,
          }) => {
            try {
              const searchParams = new URLSearchParams();
              if (params) searchParams.set("params", params);
              if (stations) searchParams.set("stations", stations);
              if (category) searchParams.set("category", category);
              if (violations) searchParams.set("violations", "true");
              if (from) searchParams.set("from", from);
              if (to) searchParams.set("to", to);
              searchParams.set("limit", String(Math.min(limit || 100, 500)));
              const url = `${baseUrl}/api/measurements?${searchParams}`;
              const res = await fetch(url);
              if (!res.ok) return { error: "Failed to fetch measurements" };
              return await res.json();
            } catch {
              return { error: "Could not reach measurements API" };
            }
          },
        }),
        checkEpaThresholds: tool({
          description:
            "Check all stations for EPA threshold violations. Returns a summary of which parameters are exceeding safe limits at each station.",
          inputSchema: jsonSchema<Record<string, never>>({
            type: "object",
            properties: {},
          }),
          execute: async () => {
            try {
              const res = await fetch(`${baseUrl}/api/measurements?violations=true&limit=200`);
              if (!res.ok) return { error: "Failed to fetch violations" };
              return await res.json();
            } catch {
              return { error: "Could not reach measurements API" };
            }
          },
        }),
        analyzeParameterTrends: tool({
          description:
            "Get historical data for a specific parameter across multiple stations for trend analysis. Useful for comparing water quality across the watershed or tracking seasonal changes.",
          inputSchema: jsonSchema<{
            parameter: string;
            stations?: string;
            limit?: number;
          }>({
            type: "object",
            properties: {
              parameter: {
                type: "string",
                description: "Parameter ID (e.g. dissolved_oxygen, ecoli, ph, temperature, nitrate_n)",
              },
              stations: {
                type: "string",
                description: "Comma-separated station IDs. If omitted, returns data for all stations.",
              },
              limit: {
                type: "number",
                description: "Max readings per station (default 100)",
              },
            },
            required: ["parameter"],
          }),
          execute: async ({ parameter, stations, limit }) => {
            try {
              const searchParams = new URLSearchParams();
              searchParams.set("params", parameter);
              if (stations) searchParams.set("stations", stations);
              searchParams.set("limit", String(limit || 100));
              const res = await fetch(`${baseUrl}/api/measurements?${searchParams}`);
              if (!res.ok) return { error: "Failed to fetch trend data" };
              return await res.json();
            } catch {
              return { error: "Could not reach measurements API" };
            }
          },
        }),
      },
      stopWhen: stepCountIs(3),
      maxOutputTokens: 4096,
      temperature: 0.3,
      onError: ({ error }) => {
        console.error("[chat] Stream error during generation:", error);
      },
      onFinish: ({ usage }) => {
        if (usage) {
          const input = usage.inputTokens ?? 0;
          const output = usage.outputTokens ?? 0;
          console.log(
            `[chat] Gemini token usage — input: ${input}, output: ${output}, total: ${input + output}`,
          );
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    const details =
      err && typeof err === "object" && "cause" in err
        ? String((err as { cause: unknown }).cause)
        : undefined;
    console.error("[chat] Stream error:", message, details || "");
    return Response.json(
      { error: details || message },
      { status: 500 },
    );
  }
}
