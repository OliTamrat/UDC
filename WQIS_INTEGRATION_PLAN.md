# WQIS Integration Plan — Execution Blueprint

## Overview

Replace the generic Claude-powered Research Assistant with the **WQIS (Water Quality Intelligent Service)** ADK agent, and add 3 new AI-powered UI components to the dashboard.

**Current state**: Floating chat uses Vercel AI SDK + Claude Haiku via `/api/chat`
**Target state**: Floating chat + 3 new components powered by WQIS ADK agent (Gemini 2.5 Flash)

---

## Architecture Decision: Proxy Pattern

The Next.js backend will **proxy** all requests to the WQIS agent. The frontend never talks to the ADK server directly.

```
Browser  -->  Next.js API Routes  -->  WQIS ADK Agent (external)
              /api/wqis/chat            localhost:8001 (dev)
              /api/wqis/insights        https://wqis.example.com (prod)
              /api/wqis/report
              /api/wqis/analyze
```

**Why proxy?**
- No CORS issues (same-origin requests from browser)
- Keeps ADK agent URL private (not exposed to client)
- Rate limiting and auth stay in Next.js
- Easy to swap between local dev and deployed agent via one env var

**Env var**: `WQIS_AGENT_URL` (defaults to `http://localhost:8001`)

---

## Phase 0: Environment & Config Setup

### 0.1 — New environment variables

```env
# .env.local
WQIS_AGENT_URL=http://localhost:8001     # ADK agent base URL
WQIS_AGENT_APP_ID=wqis_agent            # ADK app name
WQIS_AGENT_USER_ID=dashboard-user       # Default user ID for ADK sessions
```

### 0.2 — WQIS client library

Create `src/lib/wqis-client.ts` — a server-side utility that:
- Manages ADK session lifecycle (create, reuse, send message)
- Handles the ADK REST API contract:
  - `POST /apps/{app}/users/{user}/sessions` — create session
  - `POST /run` or `POST /run_sse` — send message and get response (streaming)
- Parses ADK event format into clean response objects
- Handles connection errors gracefully with fallback messaging
- Exports typed helpers: `sendWqisMessage()`, `callWqisTool()`, `streamWqisChat()`

---

## Phase 1: Upgrade Floating Chat (Component 1)

> Same UI shell, smarter WQIS-powered brain

### What changes

| Layer | Current | New |
|-------|---------|-----|
| Frontend component | `ResearchAssistant.tsx` | Same file, updated hooks |
| Transport | `DefaultChatTransport` → `/api/chat` | Custom transport → `/api/wqis/chat` |
| Backend route | `/api/chat/route.ts` (Vercel AI SDK + Claude) | `/api/wqis/chat/route.ts` (proxy to ADK) |
| System prompt | Hardcoded in route.ts | Defined in ADK agent (already configured) |
| Tools | 3 tools (getStationData, getStationHistory, listAllStations) | 6 WQIS tools (server-side, managed by ADK) |
| Model | Claude Haiku 4.5 | Gemini 2.5 Flash (via ADK) |

### Files to create/modify

1. **`src/app/api/wqis/chat/route.ts`** (NEW)
   - POST handler that proxies chat messages to ADK agent
   - Manages session ID (stored per-user or per-browser via cookie/header)
   - Streams ADK SSE responses back to the client
   - Keeps existing rate limiting from current `/api/chat`
   - Falls back to error message if WQIS agent is unreachable

2. **`src/components/ai/ResearchAssistant.tsx`** (MODIFY)
   - Change transport URL from `/api/chat` to `/api/wqis/chat`
   - Update suggested questions to be more WQIS-specific (EPA thresholds, report generation, trend analysis)
   - Update tool execution UI: show WQIS tool names (`check_epa_thresholds`, `analyze_parameter_trends`, etc.) instead of generic "Querying station data..."
   - Update header text: "WQIS Assistant" / "Powered by Water Quality Intelligent Service"
   - Add a "Generate Report" quick-action button in the chat header
   - Keep: theme support, markdown rendering, auto-scroll, keyboard shortcuts

3. **`src/lib/wqis-client.ts`** (NEW)
   - Shared WQIS client used by all 4 API routes

### Fallback strategy
- If `WQIS_AGENT_URL` is not set → show "WQIS not configured" message (same pattern as current ANTHROPIC_API_KEY check)
- If ADK agent is unreachable → show connection error, offer retry
- Keep the OLD `/api/chat` route untouched as a backup (can be toggled)

---

## Phase 2: AI Insights Panel (Component 2)

> Auto-displays EPA alert summary on the Water Quality section

### Location in dashboard
`src/app/page.tsx` — inserted above or within the `#water-quality` section (lines 151-165)

### New component: `src/components/ai/WqisInsightsPanel.tsx`

**Behavior:**
- On mount (page load), calls `/api/wqis/insights`
- Backend invokes WQIS tool: `check_epa_thresholds` (no user prompt needed — auto-triggered)
- Renders a card/banner showing:
  - Overall health status badge (GOOD / WARNING / POOR / CRITICAL)
  - List of active alerts (station + parameter + value + threshold)
  - "Last checked" timestamp
  - Refresh button to re-query
- Loading skeleton while fetching
- Error state if agent unavailable

### New API route: `src/app/api/wqis/insights/route.ts`

- GET handler (no body needed)
- Sends a predefined prompt to WQIS: "Check EPA thresholds for all stations and provide a summary of current alerts"
- Parses the ADK response and returns structured JSON:
  ```json
  {
    "overallStatus": "WARNING",
    "alerts": [
      { "station": "ANAC_02", "stationName": "Bladensburg", "parameter": "dissolved_oxygen", "value": 4.9, "threshold": 5.0, "severity": "WARNING" }
    ],
    "summary": "...",
    "checkedAt": "2026-03-13T..."
  }
  ```
- Caches response for 5 minutes (avoid hammering the agent on every page load)

### Integration
- Add `<WqisInsightsPanel />` to `page.tsx` above the water quality charts
- Respect theme (dark/light)

---

## Phase 3: Generate Report Button (Component 3)

> Calls `generate_water_quality_report` and renders a formatted modal

### Location in dashboard
`src/app/page.tsx` — in or near the `#analytics` section (lines 167-176)

### New component: `src/components/ai/WqisReportModal.tsx`

**Behavior:**
- "Generate Report" button (gradient UDC style) placed near the analytics header
- On click: opens a modal, shows loading spinner, calls `/api/wqis/report`
- Renders the formatted report in the modal:
  - Title, date, overall status
  - Active alerts table
  - Recommendations list
  - Station-by-station breakdown
- "Download as PDF" button (using browser print or html2canvas)
- "Copy to clipboard" button
- Close button

### New API route: `src/app/api/wqis/report/route.ts`

- POST handler
- Optional body: `{ period?: "7d" | "30d" | "90d" }` (defaults to 7 days)
- Sends prompt to WQIS: "Generate a weekly water quality report" (or monthly based on period)
- Returns the full report text from ADK response

---

## Phase 4: Station AI Analysis (Component 4)

> Clicking a station row triggers AI analysis for that specific station

### Location
`src/components/dashboard/StationTable.tsx` — add an "AI Analyze" action to each row

### New component: `src/components/ai/WqisStationAnalysis.tsx`

**Behavior:**
- Renders as a slide-out panel or modal when triggered
- Shows station name + ID at top
- Calls `/api/wqis/analyze` with the station ID
- Displays:
  - Latest readings summary (from `get_latest_readings`)
  - Trend analysis (from `analyze_parameter_trends`)
  - EPA compliance status for that station
  - AI-generated narrative about the station's health
- Loading state with skeleton
- Can be triggered from:
  - StationTable: "Analyze" button/icon on each row
  - Station detail page (`/station/[id]`): "AI Analysis" button

### New API route: `src/app/api/wqis/analyze/route.ts`

- POST handler
- Body: `{ stationId: string }`
- Sends to WQIS: "Get latest readings and analyze parameter trends for station {stationId}"
- Returns structured analysis

### Integration points
- `StationTable.tsx`: Add analyze icon button per row
- `src/app/station/[id]/page.tsx`: Add "AI Analysis" section/button

---

## File Summary

### New files (8)

| File | Purpose |
|------|---------|
| `src/lib/wqis-client.ts` | Server-side ADK client library |
| `src/app/api/wqis/chat/route.ts` | Chat proxy (streaming) |
| `src/app/api/wqis/insights/route.ts` | EPA insights (cached GET) |
| `src/app/api/wqis/report/route.ts` | Report generation |
| `src/app/api/wqis/analyze/route.ts` | Station analysis |
| `src/components/ai/WqisInsightsPanel.tsx` | Insights card for dashboard |
| `src/components/ai/WqisReportModal.tsx` | Report modal |
| `src/components/ai/WqisStationAnalysis.tsx` | Station analysis panel |

### Modified files (5)

| File | Change |
|------|--------|
| `src/components/ai/ResearchAssistant.tsx` | Point to new WQIS chat endpoint, update UI text + suggested questions + tool display |
| `src/app/page.tsx` | Add WqisInsightsPanel + Generate Report button |
| `src/components/dashboard/StationTable.tsx` | Add "Analyze" action per row |
| `src/app/station/[id]/page.tsx` | Add AI Analysis section |
| `.env.example` | Document new WQIS env vars |

### Untouched (preserved as fallback)

| File | Reason |
|------|--------|
| `src/app/api/chat/route.ts` | Keep as fallback if WQIS is down |
| `src/components/ai/ResearchAssistantWrapper.tsx` | No changes needed |

---

## Execution Order

```
Phase 0  [Config]     .env setup + wqis-client.ts           ~30 min
Phase 1  [Chat]       /api/wqis/chat + ResearchAssistant    ~1-2 hrs
Phase 2  [Insights]   /api/wqis/insights + InsightsPanel    ~1 hr
Phase 3  [Report]     /api/wqis/report + ReportModal        ~1 hr
Phase 4  [Station]    /api/wqis/analyze + StationAnalysis   ~1 hr
```

Each phase is independently deployable and testable.

---

## Deployment Options (for the WQIS ADK agent itself)

### Option A — Cloud Run (Recommended for production)

```
WQIS Agent (Python/ADK) → Docker → Cloud Run → public URL
Dashboard (Next.js)     → Vercel → WQIS_AGENT_URL=https://wqis-agent-xyz.run.app
```

- Auto-scaling, HTTPS, IAM auth
- Set `WQIS_AGENT_URL` in Vercel env vars

### Option B — Railway / Render

- Simpler deployment, just push the agent repo
- Set `WQIS_AGENT_URL` accordingly

### Option C — Local dev with ngrok

```bash
ngrok http 8001
# Use the ngrok URL as WQIS_AGENT_URL
```

- For development/testing only

---

## Open Questions for You

1. **ADK API format**: Does your WQIS agent use the standard ADK REST API (`/run`, `/run_sse`) or a custom endpoint? I need to know the exact request/response format to build the proxy.

2. **Authentication**: Does the ADK agent require any API key or auth header? Or is it open access?

3. **Session management**: Should chat sessions persist across browser refreshes, or is a new session per visit fine?

4. **Streaming**: Does the ADK agent support SSE streaming for chat, or only synchronous responses?

5. **Agent repo location**: Can you share or push the WQIS agent code to this repo (or a sibling directory) so I can read the exact tool schemas and response formats?
