# UDC Water Resources Data Dashboard - Project Memory

## Rules for Claude Code

### Security — NEVER Expose Credentials
- **NEVER** commit, log, or output credentials, API keys, database connection strings, passwords, or tokens
- **NEVER** hardcode secrets in source files — always use environment variables
- When referencing `DATABASE_URL`, `INGEST_API_KEY`, or similar, use placeholder values like `postgresql://user:password@host/db`
- If a user shares a credential in conversation, do NOT echo it back in code, commits, or file contents
- `.env.local` is gitignored — secrets belong there, never in tracked files

### Git Commit & Push Rules — IP Protection
- **NEVER** use Claude/Anthropic as the git author or committer — always commit as the repository owner:
  - `git config user.name "Oli T. Oli"`
  - `git config user.email "120649391+OliTamrat@users.noreply.github.com"`
  - Set `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, `GIT_COMMITTER_EMAIL` env vars before every commit
- **NEVER** include Claude Code session attribution URLs in commit messages, PR descriptions, or code comments
- **NEVER** include any `https://claude.ai/code/...` links anywhere in the codebase or git history
- **NEVER** add `Co-authored-by` trailers or any other metadata that attributes work to Claude or Anthropic
- Never amend someone else's commit — always create new commits
- Write clear, descriptive commit messages summarizing the "why"

## Project Overview
Interactive water quality monitoring dashboard for UDC's Water Resources Research Institute (WRRI) and CAUSES.
Built with Next.js 16.1.6 (App Router), TypeScript, Tailwind CSS 4, Leaflet, Recharts, React 19.

## Current State (as of March 2026 audit)
- **17 TSX/TS component files**, 2 data files, 4 app pages, 12 monitoring stations
- **Entirely static/client-side** — no backend, no database, no real APIs
- **Geospatial data** derived from official DC GIS government sources (verified)
- **Theme system** working (dark/light/system) with localStorage persistence

## Production Readiness Audit — Issues to Address

### Phase 1: Critical (Error Handling & Testing) — DONE
- [x] **Error Boundary** — `src/components/ErrorBoundary.tsx` wraps app in layout.tsx
- [x] **Testing** — Vitest configured, 17 tests across 4 suites (data, error boundary, health, validation)
- [x] **CI/CD** — `.github/workflows/ci.yml` (test + build on push/PR)
- [x] **Health check** — `GET /api/health` returns status, timestamp, version, uptime
- [x] **Functional search** — Header search filters stations, research, pages; tooltips on placeholder buttons

### Phase 2: Important (Logging, Monitoring, Validation) — DONE
- [x] **Logger utility** — `src/lib/logger.ts` with buffered client-side logging (info/warn/error)
- [x] **Input validation** — `src/lib/validation.ts` with XSS sanitization, applied to Header search
- [x] **Deployment docs** — README updated with Docker, Vercel, health check, and testing instructions
- [x] **Security headers** — CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy in next.config.ts

### Phase 3: Backend & Data — DONE (Local SQLite, Azure-ready)
- [x] **Database** — SQLite via better-sqlite3 (`data/udc-water.db`), schema in `src/lib/db.ts`
- [x] **Seed script** — `npm run db:seed` populates DB from static data (12 stations, 144 readings)
- [x] **API routes** — `GET /api/stations`, `GET /api/stations/:id/history`, `GET /api/export`
- [x] **Data export** — CSV and JSON export via `/api/export?format=csv&station=ANA-001`
- [x] **USGS ingestion** — `POST /api/ingest?source=usgs` fetches real USGS NWIS instantaneous values
- [x] **Ingestion logging** — `ingestion_log` table tracks all ingest runs with status and error messages
- [x] **Neon PostgreSQL** — `@neondatabase/serverless` + `ws`; `DATABASE_URL` env var switches from SQLite
- [ ] **Cron scheduling** — Set up Azure Functions Timer or Vercel Cron for automated ingestion
- [x] **Frontend migration** — StationTable, MetricCards, station detail page fetch from API with static fallback

### Phase 5: AI Research Assistant — DONE
- [x] **AI Chat API** — `POST /api/chat` with Claude via Vercel AI SDK v6
- [x] **Domain system prompt** — EPA thresholds, seasonal patterns, station metadata, WRRI research context
- [x] **Tool-augmented** — AI can query `/api/stations`, `/api/stations/:id/history` for live data
- [x] **Chat UI** — Floating panel (`ResearchAssistant.tsx`) with streaming, suggested questions, clear history
- [x] **Graceful degradation** — Shows config message when `ANTHROPIC_API_KEY` not set
- [ ] **RAG expansion** — Vector search over research papers and USGS reports (future)
- [ ] **Chart generation** — AI-generated plots from query results (future)

### Phase 4: Nice-to-Have — DONE (Docker, Docs)
- [x] Contributing guidelines — `CONTRIBUTING.md`
- [x] Architecture diagrams — ASCII diagram in README
- [x] Docker/Kubernetes configs — `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- [ ] User authentication/authorization (currently API-key based)

### Phase 6: Faculty Admin Panel — DONE
- [x] **Admin page** — `/admin` with auth gate (ADMIN_API_KEY env var)
- [x] **CSV/JSON upload** — Drag-and-drop with auto column mapping + validation
- [x] **AI-assisted column mapping** — Claude Haiku maps non-standard column names to schema (falls back to heuristics)
- [x] **Station CRUD** — Add, edit, delete stations from `/api/admin/stations`
- [x] **Readings CRUD** — View, add, delete readings from `/api/admin/readings` with pagination
- [x] **Ingestion trigger** — Run USGS/EPA ingestion from admin UI
- [x] **Ingestion log viewer** — Full history of all data imports
- [x] **Sidebar link** — "Data Admin" nav item under ADMIN section

### Phase 7: Expanded Parameters & Scientific Storytelling — IN PROGRESS
#### Sprint 1: Data Foundation — DONE
- [x] **EAV schema** — `parameters` + `measurements` tables (Entity-Attribute-Value) for flexible parameter storage
- [x] **25 parameter definitions** — 20 core (physical, nutrients, metals, biological) + 5 emerging contaminants
- [x] **Parameter metadata** — EPA thresholds, USGS pcodes, WQP characteristic names, plain-English descriptions
- [x] **WQP ingestion** — `POST /api/ingest?source=wqp` for Water Quality Portal lab-analyzed data (DC FIPS US:11)
- [x] **Dual-write ingestion** — USGS/EPA ingest writes to both legacy `readings` and new `measurements` tables
- [x] **Measurements API** — `GET /api/measurements` with filters (params, stations, categories, sources, dates, violations)
- [x] **Parameters API** — `GET /api/parameters` with optional category filter
- [x] **Seed updated** — Seeds 25 parameters + 738 EAV measurements alongside legacy 144 readings

#### Sprint 2: Filter System & Parameter UI — DONE
- [x] **Parameter filter** — Multi-select dropdown with category groupings, select-all per category, inline pills
- [x] **Parameter Explorer** — Slide-out panel replacing compact dropdown; educational drill-down with "What it measures", "Why it matters in DC", EPA threshold visualizations, search, and category tabs
- [x] **Configurable StationTable** — Columns driven by selected parameters with threshold dots
- [x] **Updated station detail** — "All Measured Parameters" section with EAV data grouped by category
- [x] **Traffic light indicators** — Green/Yellow/Red `ThresholdIndicator` component with 20% warning buffer

#### Sprint 3: Scientific Storytelling — DONE
- [x] Story page `/stories` with scrollytelling framework (ScrollySection, StoryCard, FadeIn)
- [x] "When It Rains in DC" — interactive rainfall vs turbidity chart with rain animation
- [x] "What's in the Water" — 6 featured parameter explainer cards with fun facts and DC context
- [x] "A Year in the Anacostia" — seasonal heatmap with month-by-month narratives
- [x] "Upstream to Downstream" — animated watershed propagation with 3 pollution scenarios (storm/CSO/construction)

#### Sprint 4: Animated Scenarios — TODO
- [ ] Timeline playback component (play/pause/scrub)
- [ ] Map animation layer with color-changing station markers
- [ ] Synchronized multi-chart view
- [ ] Pollution spike detection and scenario library

#### Sprint 5: Polish & Integration — TODO
- [ ] AI assistant context update for new parameters
- [ ] Admin panel updates for new parameter format
- [ ] Tests for new API routes and components
- [ ] Performance optimization and accessibility

## Database Setup
- **Local dev**: SQLite via better-sqlite3 (default, no config needed)
- **Production**: Neon PostgreSQL — set `DATABASE_URL` env var on Vercel
- **Seed Neon**: `DATABASE_URL=postgresql://... npx tsx scripts/seed.ts`
- **Seed local**: `npx tsx scripts/seed.ts` (or `npm run db:seed`)
- **Schema**: Dual schemas in `src/lib/db.ts` (SQLite + PostgreSQL), auto-selected
- **EAV tables**: `parameters` (25 definitions) + `measurements` (flexible per-reading-per-param storage)
- **Future**: Optionally migrate to Azure PostgreSQL (same `DATABASE_URL` swap)

## Key Files
- `src/app/page.tsx` — Main dashboard
- `src/app/layout.tsx` — Root layout with ThemeProvider + ErrorBoundary
- `src/app/station/[id]/page.tsx` — Station detail pages
- `src/app/api/stations/route.ts` — Stations list API
- `src/app/api/stations/[id]/history/route.ts` — Station history API
- `src/app/api/export/route.ts` — CSV/JSON data export
- `src/app/api/ingest/route.ts` — USGS/EPA/WQP data ingestion
- `src/app/api/measurements/route.ts` — EAV measurements query API with filters
- `src/app/api/parameters/route.ts` — Parameter definitions API
- `src/app/api/chat/route.ts` — AI research assistant (Claude via Vercel AI SDK)
- `src/app/api/health/route.ts` — Health check endpoint
- `src/app/stories/page.tsx` — Scientific storytelling page (4 interactive stories)
- `src/app/admin/page.tsx` — Faculty admin panel (upload, CRUD, logs)
- `src/app/api/admin/upload/route.ts` — CSV/JSON upload with auto column mapping
- `src/app/api/admin/stations/route.ts` — Station CRUD API
- `src/app/api/admin/readings/route.ts` — Readings CRUD API
- `src/app/api/admin/ai-map-columns/route.ts` — AI-powered column mapping
- `src/lib/db.ts` — Database abstraction (SQLite + Neon PostgreSQL)
- `src/lib/logger.ts` — Client-side logging utility
- `src/lib/validation.ts` — Input sanitization
- `src/components/ai/ResearchAssistant.tsx` — AI chat panel (floating widget)
- `src/components/map/DCMap.tsx` — Interactive Leaflet map (dynamic import, SSR disabled)
- `src/components/layout/Header.tsx` — Top bar with functional search
- `src/components/dashboard/ParameterExplorer.tsx` — Slide-out parameter explorer with educational drill-down
- `src/components/dashboard/ParameterFilter.tsx` — Legacy multi-select parameter filter (replaced by Explorer)
- `src/components/dashboard/ThresholdIndicator.tsx` — Traffic light EPA threshold component
- `src/components/stories/ScrollySection.tsx` — Scrollytelling framework (ScrollySection, StoryCard, FadeIn)
- `src/components/stories/RainStory.tsx` — "When It Rains in DC" interactive story
- `src/components/stories/WhatsInTheWater.tsx` — Parameter explainer story cards
- `src/components/stories/YearInAnacostia.tsx` — Seasonal heatmap story
- `src/components/stories/UpstreamDownstream.tsx` — Watershed propagation animation
- `src/components/ErrorBoundary.tsx` — React error boundary
- `src/data/dc-waterways.ts` — 801 lines: stations, waterways, research, EJ data
- `src/data/dc-boundaries.ts` — Ward polygons, watershed, flood zones
- `src/data/parameters.ts` — 25 water quality parameter definitions (EAV metadata)
- `scripts/seed.ts` — Database seed script (legacy readings + EAV measurements)

## Tech Notes
- Leaflet map uses `dynamic()` with `ssr: false` (required for client-only rendering)
- Tailwind v4 uses `@theme` directive with CSS variables for UDC brand colors (#FDB927 gold, #CE1141 red, #002B5C navy)
- Theme persisted in localStorage key: `udc-theme`
- Next.js standalone output configured in `next.config.ts`
- AI assistant requires `ANTHROPIC_API_KEY` env var (optional — dashboard works without it)
- Admin panel uses `ADMIN_API_KEY` env var for access control (no key = open access in dev)
- AI column mapping in admin uses Claude Haiku (fast/cheap) with heuristic fallback
- AI SDK v6: uses `tool()`, `stepCountIs()`, `DefaultChatTransport`, `sendMessage` (not v4/v5 API)
- All external resources use HTTPS (CartoDB tiles, Leaflet CDN, Google Fonts)
