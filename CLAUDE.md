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

### Phase 3: Backend & Data (Future)
- [ ] **No real-time data integration** — all data is hardcoded static mock data
- [ ] **No backend API** for live sensor data ingestion
- [ ] **No database** for historical data storage
- [ ] **No data refresh strategy** — data cannot be updated without redeployment
- [ ] **No data export** — mentioned in education page but not implemented

### Phase 4: Nice-to-Have
- [ ] Contributing guidelines
- [ ] Architecture diagrams
- [ ] Docker/Kubernetes configs
- [ ] User authentication/authorization
- [ ] Admin panel for data management

## Key Files
- `src/app/page.tsx` — Main dashboard
- `src/app/layout.tsx` — Root layout with ThemeProvider
- `src/app/station/[id]/page.tsx` — Station detail pages
- `src/components/map/DCMap.tsx` — Interactive Leaflet map (dynamic import, SSR disabled)
- `src/components/layout/Header.tsx` — Top bar (search, theme, notifications - some non-functional)
- `src/components/layout/Sidebar.tsx` — Navigation sidebar
- `src/data/dc-waterways.ts` — 801 lines: stations, waterways, research, EJ data
- `src/data/dc-boundaries.ts` — Ward polygons, watershed, flood zones
- `src/context/ThemeContext.tsx` — Dark/light/system theme provider

## Tech Notes
- Leaflet map uses `dynamic()` with `ssr: false` (required for client-only rendering)
- Tailwind v4 uses `@theme` directive with CSS variables for UDC brand colors (#FDB927 gold, #CE1141 red, #002B5C navy)
- Theme persisted in localStorage key: `udc-theme`
- Next.js standalone output configured in `next.config.ts`
- All external resources use HTTPS (CartoDB tiles, Leaflet CDN, Google Fonts)
