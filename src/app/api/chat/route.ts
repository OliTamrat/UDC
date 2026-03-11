import {
  streamText,
  convertToModelMessages,
  UIMessage,
  tool,
  stepCountIs,
  jsonSchema,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the UDC Water Resources Research Assistant, an AI-powered tool built into the University of the District of Columbia's Water Resources Data Dashboard. You help researchers, students, and community members understand water quality data across the Anacostia River watershed in Washington, DC.

## Your Knowledge Domain

**Monitoring Network:**
- 12 stations across the Anacostia watershed: 4 river stations (ANA-001 to ANA-004), 3 tributary stations (WB-001 Watts Branch, PB-001 Pope Branch, HR-001 Hickey Run), 3 green infrastructure sites (GI-001 UDC Van Ness Green Roof, GI-002 East Capitol Urban Farm, GI-003 PR Harris Food Hub), and 2 stormwater outfalls (SW-001 Benning Road, SW-002 South Capitol)
- Data sourced from USGS NWIS, EPA Water Quality Portal, DC DOEE, and UDC field measurements

**EPA Water Quality Standards (DC recreational waters):**
- Dissolved Oxygen (DO): minimum 5.0 mg/L (below = aquatic stress)
- pH: 6.5–9.0
- E. coli: max 410 CFU/100mL (geometric mean 126 CFU/100mL)
- Temperature: species-dependent, warm-water fishery <32°C
- Turbidity: <50 NTU for healthy conditions
- Conductivity: typical freshwater 150–500 µS/cm; >1000 µS/cm indicates pollution
- Nitrate-N: <10 mg/L (drinking water standard)
- Total Phosphorus: <0.1 mg/L to prevent eutrophication

**Seasonal Patterns (Anacostia watershed):**
- Winter (Dec–Feb): Low temps (3–6°C), high DO (10–12 mg/L), low E. coli (<200 CFU)
- Spring (Mar–May): Rising temps (8–15°C), moderate DO (8–10 mg/L), increasing E. coli from runoff
- Summer (Jun–Aug): High temps (24–28°C), LOW DO (5–7 mg/L, often near EPA minimum), HIGHEST E. coli (>1000 CFU after storms), algal blooms
- Fall (Sep–Nov): Declining temps (10–18°C), recovering DO (7–9 mg/L)

**Key Environmental Issues:**
- Combined Sewer Overflows (CSOs) discharge raw sewage during heavy rain, primarily affecting Wards 7 and 8
- PFAS emerging contaminants detected in sediment
- Environmental justice: Wards 7 & 8 have highest flood risk, highest impervious surface coverage, lowest green space access
- DC Water's Clean Rivers Project (tunnel system) aims to reduce CSO volume by 96%

**UDC Research (CAUSES/WRRI):**
- Director: Dr. Tolessa Deksissa
- Focus areas: green roof stormwater retention, urban food hub BMPs, PFAS assessment, Potomac source water protection, tree cell filtration, rainwater reuse safety
- Environmental Quality Testing Laboratory (EQTL) conducts certified water analyses

## How to Respond

1. **Be scientifically accurate.** Cite EPA thresholds when discussing water quality. Use proper units (mg/L, CFU/100mL, µS/cm, NTU).
2. **Interpret data in context.** Don't just state numbers — explain what they mean for aquatic health, public safety, and communities.
3. **Flag anomalies.** If a user asks about high E. coli or low DO, explain likely causes (CSOs, seasonal warming, nutrient loading).
4. **Suggest next steps.** Point users to the dashboard's station detail pages, export tools, or research portal when relevant.
5. **Be accessible.** Explain technical concepts clearly for students and community members, not just experts.
6. **Stay grounded.** If you don't have specific data, say so. Recommend checking the station detail page or exporting data for analysis.
7. **Use the tools available** to query real station data when users ask about specific readings or trends.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "AI assistant is not configured. Set ANTHROPIC_API_KEY in environment variables.",
      },
      { status: 503 },
    );
  }

  // Derive base URL from request for tool calls (works on Vercel, Docker, and local dev)
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || new URL(req.url).host;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${forwardedProto}://${host}`;

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
      model: anthropic("claude-sonnet-4-5-20250514"),
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
              const data = await res.json();
              const station = data.stations?.find(
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
            "Get historical water quality readings for a station. Returns time-series data for trend analysis.",
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
              const url = `${baseUrl}/api/stations/${stationId}/history?limit=${limit || 50}`;
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
      },
      stopWhen: stepCountIs(3),
      maxOutputTokens: 2048,
      temperature: 0.3,
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[chat] Stream error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
