# UDC Water Resources Data Dashboard - Project Memory

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

### Phase 4: Nice-to-Have — DONE (Docker, Docs)
- [x] Contributing guidelines — `CONTRIBUTING.md`
- [x] Architecture diagrams — ASCII diagram in README
- [x] Docker/Kubernetes configs — `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- [ ] User authentication/authorization
- [ ] Admin panel for data management

## Database Setup
- **Local dev**: SQLite via better-sqlite3 (default, no config needed)
- **Production**: Neon PostgreSQL — set `DATABASE_URL` env var on Vercel
- **Seed Neon**: `DATABASE_URL=postgresql://... npx tsx scripts/seed.ts`
- **Seed local**: `npx tsx scripts/seed.ts` (or `npm run db:seed`)
- **Schema**: Dual schemas in `src/lib/db.ts` (SQLite + PostgreSQL), auto-selected
- **Future**: Optionally migrate to Azure PostgreSQL (same `DATABASE_URL` swap)

## Key Files
- `src/app/page.tsx` — Main dashboard
- `src/app/layout.tsx` — Root layout with ThemeProvider + ErrorBoundary
- `src/app/station/[id]/page.tsx` — Station detail pages
- `src/app/api/stations/route.ts` — Stations list API
- `src/app/api/stations/[id]/history/route.ts` — Station history API
- `src/app/api/export/route.ts` — CSV/JSON data export
- `src/app/api/ingest/route.ts` — USGS data ingestion
- `src/app/api/health/route.ts` — Health check endpoint
- `src/lib/db.ts` — SQLite database connection and schema
- `src/lib/logger.ts` — Client-side logging utility
- `src/lib/validation.ts` — Input sanitization
- `src/components/map/DCMap.tsx` — Interactive Leaflet map (dynamic import, SSR disabled)
- `src/components/layout/Header.tsx` — Top bar with functional search
- `src/components/ErrorBoundary.tsx` — React error boundary
- `src/data/dc-waterways.ts` — 801 lines: stations, waterways, research, EJ data
- `src/data/dc-boundaries.ts` — Ward polygons, watershed, flood zones
- `scripts/seed.ts` — Database seed script

## Tech Notes
- Leaflet map uses `dynamic()` with `ssr: false` (required for client-only rendering)
- Tailwind v4 uses `@theme` directive with CSS variables for UDC brand colors (#FDB927 gold, #CE1141 red, #002B5C navy)
- Theme persisted in localStorage key: `udc-theme`
- Next.js standalone output configured in `next.config.ts`
- All external resources use HTTPS (CartoDB tiles, Leaflet CDN, Google Fonts)
