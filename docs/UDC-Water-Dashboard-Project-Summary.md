# UDC Water Resources Data Dashboard
## Project Sitemap & Complete Feature Summary

**Prepared for:** Dr. Tolessa & Stakeholders
**Date:** March 17, 2026
**Live URL:** https://udc-one.vercel.app
**Repository:** github.com/OliTamrat/UDC

---

## Executive Summary

The UDC Water Resources Data Dashboard is a production-grade, interactive web application built for UDC's Water Resources Research Institute (WRRI) and CAUSES. It integrates real-time water quality monitoring, scientific storytelling, AI-powered research assistance, and faculty data management into a single platform. The system monitors 12 stations across the Anacostia watershed, tracks 25 water quality parameters against EPA standards, and provides educational resources for students, researchers, and the DC community.

**Codebase:** ~15,900 lines of TypeScript/React across 64 source files
**Test Coverage:** 7 test suites (data integrity, API routes, error handling, validation, health checks)
**CI/CD:** Automated testing and builds on every push via GitHub Actions

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS 4 |
| Mapping | Leaflet + React-Leaflet |
| Charts | Recharts |
| Database (Dev) | SQLite via better-sqlite3 |
| Database (Prod) | Neon PostgreSQL (serverless) |
| AI | Anthropic Claude via Vercel AI SDK v6 |
| Deployment | Vercel (primary), Docker (containerized) |
| CI/CD | GitHub Actions |
| Validation | Zod schema validation |
| Icons | Lucide React (350+ icons) |

---

## Site Map

```
udc-one.vercel.app
|
|-- /                          Main Dashboard (command center)
|-- /station/[id]              Station Detail Pages (12 stations)
|-- /stories                   Water Stories (4 interactive narratives)
|-- /research                  Research Projects Portal (17 projects)
|-- /education                 Education Hub (8 modules, events, datasets)
|-- /methodology               Data Dictionary & Methods
|-- /admin                     Faculty Admin Panel (protected)
|
|-- /api/stations              Stations API
|-- /api/stations/[id]/history Station History API
|-- /api/measurements          EAV Measurements API
|-- /api/parameters            Parameter Definitions API
|-- /api/export                Data Export API (CSV/JSON)
|-- /api/ingest               Data Ingestion API (USGS/EPA/WQP)
|-- /api/ingestion-log         Ingestion History API
|-- /api/chat                  AI Research Assistant API
|-- /api/health                Health Check API
|-- /api/admin/stations        Station CRUD API
|-- /api/admin/readings        Readings CRUD API
|-- /api/admin/upload          File Upload API
|-- /api/admin/ai-map-columns  AI Column Mapping API
```

---

## Complete Feature List

---

### 1. MAIN DASHBOARD (`/`)

#### 1.1 Hero Section
- UDC-branded header with WRRI/CAUSES attribution
- Gradient background with institutional colors (#FDB927 gold, #CE1141 red, #002B5C navy)
- Four quick-stat badges: "12 Monitoring Stations", "Anacostia Watershed (HUC 02070010)", "USGS Real-Time Data", "EPA Standards Compliance"
- Fully bilingual (English/Spanish)

#### 1.2 Data Source Notice Banner
- Prominent notice explaining data provenance (USGS NWIS sensors, EPA Water Quality Portal)
- Links to official government sources
- Builds trust with academic and regulatory audiences

#### 1.3 Metric Cards (8 KPI Cards)
- **Active Stations** — count of online stations with status indicator, click-through to station list
- **Avg Dissolved Oxygen** — watershed-wide DO average (mg/L) with EPA threshold comparison and trend arrow
- **Avg Temperature** — water temperature average (°C) with seasonal context
- **Avg pH** — acidity/alkalinity average with neutral reference
- **Avg Turbidity** — water clarity average (NTU) with EPA aesthetic threshold
- **E. coli Alerts** — count of stations exceeding 400 CFU/100mL with clickable alert list
- **Green Infrastructure** — count of GI stations (green roofs, rain gardens) with performance summary
- **Data Freshness** — last reading timestamp with staleness warning
- Each card is clickable and opens a detailed modal with station-by-station breakdowns, trend explanations, and links to relevant EPA standards
- Cards fetch live data from `/api/stations` with static fallback
- Responsive grid: 4 columns on desktop, 2 on tablet, 1 on mobile

#### 1.4 Interactive Map (Leaflet)
- Full-width interactive map of the Anacostia watershed and DC waterways
- **12 color-coded station markers** — green (normal), amber (elevated), red (alert) based on E. coli levels
- **Click any marker** to see popup with: station name, ID, type, all latest readings (DO, temp, pH, turbidity, E. coli), status badge, and "View Details" link
- **5 toggleable GIS overlay layers:**
  - DC Ward Boundaries (8 wards with labels)
  - Anacostia Watershed boundary polygon
  - Flood zones (FEMA-derived)
  - Impervious surface zones
  - Stream/waterway network (Anacostia main stem, tributaries, minor streams)
- **Layer control panel** — checkbox toggles with layer descriptions
- **Map tiles** — CartoDB dark/light tiles matching theme
- **Responsive** — adjusts height from 300px (mobile) to 550px (desktop)
- **SSR-safe** — Leaflet loaded via dynamic import with loading spinner

#### 1.5 Time Slider
- Monthly time scrubber (Jan–Dec) below the map
- Drag to see historical water quality snapshots by month
- Map markers update color based on selected month's data
- Play/pause auto-advance through months
- Shows month label and data timestamp

#### 1.6 Water Quality Analysis (4 Charts)
- **Dissolved Oxygen Trends** — Area chart showing monthly DO averages (mg/L) with EPA minimum threshold line (5 mg/L dashed red). Gradient fill, theme-aware tooltips
- **Water Temperature** — Area chart showing seasonal temperature curve (°C) with cyan gradient
- **E. coli Levels** — Bar chart with monthly averages (CFU/100mL). Red bars with EPA STV reference line (410 CFU/100mL dashed amber). Data corrected to rainfall/CSO-driven pattern (spring peak, summer dip, fall secondary peak)
- **Stormwater Runoff Volume** — Bar chart showing monthly totals (million gallons) in purple, aligned to DC precipitation patterns
- All charts: responsive containers, dark/light theme support, interactive tooltips with formatted values

#### 1.7 Multi-Parameter Overview
- Combined line chart overlaying Dissolved Oxygen, Temperature, and Turbidity on a single normalized timeline
- Shows parameter correlations (e.g., high turbidity after rain coincides with depressed DO)
- Legend with color-coded parameter labels
- Interactive tooltips showing all three values simultaneously

#### 1.8 Environmental Justice Section
- Ward-level environmental burden analysis for all 8 DC wards
- Data points per ward: flood risk level, green space access %, impervious surface %, CSO event count
- Visual indicators highlighting Wards 7 and 8 as disproportionately burdened
- Connects water quality data to community impact

#### 1.9 Station Table
- Sortable, filterable table of all 12 monitoring stations
- Columns: Station name, ID, type, status, latest DO, temp, pH, turbidity, E. coli
- **Parameter-driven columns** — when parameters are selected via the Explorer, table columns update to show those specific parameters
- **Traffic light indicators** (ThresholdIndicator component) — green/yellow/red dots next to each reading showing EPA compliance:
  - Green: within safe range
  - Yellow: within 20% of threshold (warning buffer)
  - Red: exceeds EPA limit
- Click any row to navigate to station detail page
- "Explore Parameters" button opens the Parameter Explorer slide-out

#### 1.10 Parameter Explorer (Slide-out Panel)
- Full-height slide-out panel triggered by "Explore Parameters" button
- **25 water quality parameters** organized into 5 categories:
  - Physical (temperature, DO, pH, turbidity, conductivity, TDS)
  - Nutrients (nitrogen, phosphorus, ammonia, nitrate, chlorophyll-a)
  - Metals (lead, copper, zinc, mercury, arsenic)
  - Biological (E. coli, total coliform, enterococcus, BOD)
  - Emerging Contaminants (PFAS, microplastics, pharmaceuticals, pesticides, cyanotoxins)
- **Educational drill-down** for each parameter:
  - "What it measures" — plain-English description
  - "Why it matters in DC" — local Anacostia context
  - EPA threshold visualization with color bar
  - USGS parameter code and WQP characteristic name
  - Unit of measurement
- Search bar to filter parameters by name
- Category tabs for quick navigation
- Select/deselect parameters to customize the Station Table columns
- Select-all per category
- Inline pills showing currently selected parameters
- Smooth slide animation with backdrop

#### 1.11 Footer
- UDC/CAUSES/WRRI branding and attribution
- Data source citations (USGS, EPA, DC DOEE)
- Links to methodology, research, education pages
- Copyright and institutional disclaimer

#### 1.12 Global Navigation (Sidebar)
- Collapsible left sidebar (240px expanded, icon-only collapsed)
- Organized into sections:
  - **OVERVIEW:** Dashboard, Interactive Map
  - **MONITORING:** Water Quality, Stormwater, Analytics
  - **RESEARCH:** Research, Methodology
  - **COMMUNITY:** Water Stories, Education, Community, Open Data
  - **ADMIN:** Data Admin
- Active page highlighting
- Collapse/expand toggle
- Responsive: hidden on mobile with hamburger menu

#### 1.13 Header Bar
- **Functional search** — searches across stations (by name, ID), research projects, and page names
- Search results dropdown with categorized results and click-through navigation
- **Theme toggle** — dark/light/system mode with sun/moon icon
- **Language selector** — English/Spanish toggle
- UDC logo and "Water Resources / CAUSES & WRRI Dashboard" branding
- Notification bell (placeholder for future alerts)
- Settings gear icon opens SettingsModal

#### 1.14 Theme System
- Three modes: Dark, Light, System (follows OS preference)
- Persisted in localStorage (`udc-theme` key)
- UDC brand color palette:
  - Gold: #FDB927
  - Red: #CE1141
  - Navy: #002B5C
- CSS custom properties for all theme tokens
- Glass-panel effect (backdrop-blur, semi-transparent backgrounds)
- Custom scrollbar styling per theme
- Smooth 300ms transition between themes

#### 1.15 Internationalization (i18n)
- Full English and Spanish translations
- 100+ translation keys covering all UI text
- Language persisted in localStorage (`udc-locale` key)
- LanguageContext provider wrapping entire app
- Covers: hero section, navigation, section headers, chart labels, tooltips, notices

#### 1.16 AI Research Assistant (Floating Widget)
- Floating "AI Assistant" button in bottom-right corner
- Expands into chat panel with:
  - Message history with user/assistant distinction
  - Streaming responses (tokens appear in real-time)
  - 6 suggested starter questions:
    - "What is the current water quality status?"
    - "Which stations have E. coli alerts?"
    - "Explain dissolved oxygen trends"
    - "How does rainfall affect the Anacostia?"
    - "What are EPA water quality standards?"
    - "Compare upstream vs downstream stations"
  - Clear history button
  - Graceful degradation when `ANTHROPIC_API_KEY` not set (shows configuration message)
- **Tool-augmented AI** — Claude can query live station data and history via API tools during conversation
- **Domain-aware system prompt** including:
  - EPA threshold values for all parameters
  - Seasonal pattern knowledge
  - Station metadata and locations
  - WRRI research context
  - DC-specific environmental justice context
- Rate-limited to prevent abuse
- Powered by Claude via Vercel AI SDK v6

---

### 2. STATION DETAIL PAGES (`/station/[id]`)

- Dynamic route serving 12 individual station pages
- **Station header** with name, ID, type badge (river, tributary, stormwater, green-infrastructure), status indicator (active/maintenance/offline)
- **Location info** with coordinates and station description
- **Latest readings panel** showing current values for all measured parameters with EPA threshold comparison
- **Historical trend charts** — monthly time-series for each parameter:
  - Dissolved Oxygen (mg/L) with EPA minimum line
  - Water Temperature (°C) seasonal curve
  - pH with neutral reference
  - Turbidity (NTU) with aesthetic threshold
  - E. coli (CFU/100mL) with EPA limit
- **"All Measured Parameters" section** — EAV data grouped by category (physical, nutrients, metals, biological, emerging) showing every measurement recorded for that station with timestamp, value, source, and threshold status
- **Station-specific descriptions** explaining the station's location context, urban influence level, and water quality characteristics
- Data fetched from `/api/stations/[id]/history` with static fallback
- Back navigation to dashboard
- Responsive layout

---

### 3. WATER STORIES PAGE (`/stories`)

Four interactive, scroll-driven scientific narratives designed to make water quality data accessible to non-technical audiences:

#### 3.1 "When It Rains in DC" (RainStory)
- Interactive rainfall vs. turbidity correlation visualization
- **Animated rain** — CSS-animated falling raindrops with variable intensity
- **Rising river cross-section** — animated SVG showing water level rising with storm intensity
- **Turbidity color change** — water color shifts from clear blue to murky brown as turbidity increases
- **Bar chart** — 8 months of data (Aug 2025–Mar 2026) showing rainfall (inches) vs turbidity (NTU) for each event
- Click any bar to see detailed reading: rainfall amount, turbidity value, water level, and severity classification (Normal/Elevated/Dangerous)
- **Interactive narrative** explaining CSO (Combined Sewer Overflow) system and how rainfall triggers sewage discharge into the Anacostia
- Insight callout about DC Water's $2.7B Clean Rivers Project

#### 3.2 "What's in the Water" (WhatsInTheWater)
- 6 featured parameter explainer cards, each with:
  - Parameter name and icon
  - "What it is" description in plain English
  - "Fun fact" engaging data point
  - DC-specific context ("Why it matters here")
  - EPA threshold with visual indicator
- Featured parameters: Dissolved Oxygen, E. coli, Turbidity, pH, Nitrogen, Lead
- Card flip/expand animation on click
- Designed for K-12 and community education

#### 3.3 "A Year in the Anacostia" (YearInAnacostia)
- **Seasonal heatmap** — 12-month grid showing parameter intensity by color
- Parameters tracked: Temperature, DO, E. coli, Turbidity
- **Month-by-month narratives** — click any month to read:
  - What's happening ecologically
  - Key parameter changes and why
  - Human activities affecting water quality
  - Historical events and seasonal patterns
- Color scale from blue (low/cold) through green (moderate) to red (high/warm)
- Smooth scroll-triggered fade-in animations

#### 3.4 "Upstream to Downstream" (UpstreamDownstream)
- **Animated watershed propagation** showing how pollution moves through the river system
- **Top-down river SVG** with meandering Anacostia main channel, NW Branch tributary, NE Branch tributary
- **7 monitoring stations** placed at accurate river positions with:
  - Color-coded markers (green/amber/orange/red) based on current turbidity
  - Pulsing animation rings on affected stations
  - Live NTU value displayed on each marker
  - Small "i" info icon indicating clickability
- **3 pollution scenarios:**
  - Major Storm (4 inches of rain in 6 hours) — pollution starts upstream
  - Sewer Overflow (CSO event at Capitol Hill) — pollution starts mid-river
  - Construction Runoff (exposed soil near tributary) — pollution starts at tributary
- **Animation controls:** Play/Pause button, Reset button, timeline scrubber (0–48 hours)
- **Pollution front animation** — colored overlay propagates along river path showing contamination spread
- **Rain animation** — HTML-based falling raindrops during storm scenario with splash ripple circles on water surface
- **Clickable NTU markers** — tap any station to open educational modal showing:
  - Station name, ID, and type
  - Current vs. baseline turbidity comparison
  - Status classification (Normal/Elevated/High/Dangerous) with multiplier
  - Plain-English explanation of what the reading means at that specific location
  - NTU reference scale (Crystal clear → Murky)
  - Mobile-optimized bottom-sheet modal with drag handle and close button
- **Legend** — color-coded status indicators (Normal/Elevated/High/Dangerous)
- **Geographic labels** — Maryland, Washington DC, Potomac River
- **Key insight callout** — explains the 176 sq-mile watershed and cross-state cooperation needs
- Scrollytelling framework (ScrollySection, StoryCard, FadeIn) with intersection observer animations

---

### 4. RESEARCH PROJECTS PORTAL (`/research`)

- Display of **17 UDC/WRRI research projects** with rich metadata
- Each project card shows:
  - Title and principal investigator
  - Funding source and amount
  - Date range
  - Department/college affiliation
  - Research tags (green-infrastructure, stormwater, water-quality, urban-agriculture, community)
  - Project description
  - Publication links (where available)
- **Search bar** — full-text search across project titles and descriptions
- **Tag filters** — color-coded filter chips for research categories
- **Funding display** — dollar amounts with formatting
- Click-through to external publications
- Responsive card grid layout

---

### 5. EDUCATION HUB (`/education`)

#### 5.1 Educational Modules (8 Modules)
Each module includes:
- Title, icon, difficulty level (Beginner/Intermediate/Advanced)
- Duration estimate (30–90 minutes)
- Description and topic list (4 topics per module)
- **Learning outcomes** (4 specific, measurable outcomes per module)
- **Key fact** with engaging statistic
- Click to expand full module content

**Module list:**
1. Understanding the Anacostia (Beginner, 30 min)
2. Water Quality 101 (Beginner, 45 min)
3. Green Infrastructure Solutions (Intermediate, 60 min)
4. Environmental Justice & Water (Intermediate, 50 min)
5. Data Analysis Methods (Advanced, 90 min)
6. Aquatic Ecology (Intermediate, 45 min)
7. Field Monitoring Techniques (Intermediate, 60 min)
8. Climate Change & Water (Advanced, 75 min)

#### 5.2 Audience Tabs
- **UDC Students** — course materials, STEM learning modules, hands-on exercises
- **Educators** — lesson plans, classroom activities, downloadable curriculum resources
- **DC Community** — citizen science guides, water safety information, community engagement resources
- **Researchers** — open datasets, API access documentation, publication resources

#### 5.3 Quick Reference Cards
- Water quality parameter quick-reference with thresholds and health implications
- Interactive exercises with reveal-answer functionality

#### 5.4 Community Events (4 Events)
- Anacostia River Cleanup Day (April 12, 2026)
- Water Quality Workshop at UDC Van Ness (April 25, 2026)
- WRRI Research Symposium (May 8, 2026)
- Green Infrastructure Tour (May 15, 2026)
- Each event: title, date, location, type badge, description

#### 5.5 Open Datasets (4 Downloadable Datasets)
- Anacostia Water Quality 2020–2026 (CSV/JSON, 45,000+ records)
- Stormwater BMP Performance (CSV, 12,000+ records)
- DC Ward Environmental Data (GeoJSON/CSV, 2,400+ records)
- UDC Green Roof Monitoring (CSV, 18,000+ records)
- Direct download links via `/api/export` endpoints
- File format, size, and record count displayed

#### 5.6 API Documentation
- Embedded API reference for programmatic data access
- Endpoint examples: `/api/stations`, `/api/measurements`, `/api/export`
- No authentication required for read access

#### 5.7 Level Filter
- Filter modules by difficulty: All, Beginner, Intermediate, Advanced

---

### 6. METHODOLOGY PAGE (`/methodology`)

#### 6.1 Data Dictionary
- Complete reference table for every collected parameter:
  - Parameter name and database field name
  - Unit of measurement
  - Collection method and instrument (e.g., "YSI 6600 multiprobe")
  - Valid range
  - EPA standard with citation

#### 6.2 Collection Methods
- Sampling protocol descriptions
- Frequency schedules (continuous, monthly, storm-event)
- Station types and their specific protocols:
  - River/tributary stations: continuous + monthly grab samples
  - Stormwater BMPs: event-triggered automated samplers
  - Green infrastructure: inflow/outflow paired sampling

#### 6.3 QA/QC Procedures
- Data validation rules with physical range checks
- Duplicate sample protocols
- Equipment calibration schedules
- Chain of custody documentation
- Outlier detection methodology

#### 6.4 Validation Ranges Table
- Interactive table showing valid min/max for every parameter
- Values outside range are flagged during ingestion

#### 6.5 Ingestion History Log
- Live table of recent data ingestion runs (pulled from `/api/ingestion-log`)
- Shows: timestamp, source (USGS/EPA/WQP/manual), status (success/error), record count, error messages
- Auto-refreshes to show latest imports

#### 6.6 Data Pipeline Architecture
- Explanation of data flow from sensors to dashboard
- Source descriptions: USGS NWIS instantaneous values, EPA Water Quality Portal, manual CSV uploads
- Database schema overview (legacy readings + EAV measurements)

---

### 7. FACULTY ADMIN PANEL (`/admin`)

Protected by `ADMIN_API_KEY` environment variable (Bearer token authentication).

#### 7.1 Authentication Gate
- Password input screen when `ADMIN_API_KEY` is configured
- API key validated against server-side environment variable
- Open access in development mode (no key = unrestricted)

#### 7.2 CSV/JSON Data Upload
- **Drag-and-drop zone** for CSV and JSON files
- File type auto-detection
- **AI-assisted column mapping** — Claude Haiku analyzes uploaded column headers and automatically maps them to the database schema (temperature, dissolved_oxygen, ph, turbidity, ecoli_count, station_id, timestamp)
- **Heuristic fallback** — if AI unavailable, pattern matching maps columns (e.g., "Temp" → temperature, "DO" → dissolved_oxygen)
- **Column mapping preview** — shows detected mappings with confidence indicators before import
- **Validation** — checks for required fields, valid ranges, data types
- **Import summary** — shows records imported, skipped, and errors

#### 7.3 Station Management (CRUD)
- **View all stations** in sortable table
- **Add station** — form with fields: name, ID, latitude, longitude, type (river/tributary/stormwater/green-infrastructure), status, parameters list
- **Edit station** — inline editing of any station field
- **Delete station** — with confirmation dialog
- Changes persist to database immediately

#### 7.4 Readings Management (CRUD)
- **Paginated readings table** — browse all readings with station filter
- **Add reading** — manual data entry form with validation
- **Delete reading** — individual record deletion
- Pagination controls (page size, page navigation)

#### 7.5 Ingestion Trigger
- **One-click USGS ingestion** — triggers `POST /api/ingest?source=usgs` to fetch latest USGS NWIS instantaneous values
- **One-click EPA/WQP ingestion** — triggers Water Quality Portal data import
- Real-time status feedback (loading, success, error with message)

#### 7.6 Ingestion Log Viewer
- Full history table of all data import runs
- Columns: timestamp, source, status, records imported, duration, error messages
- Color-coded status badges (green=success, red=error, amber=partial)

#### 7.7 Sidebar Navigation Link
- "Data Admin" link in sidebar under ADMIN section
- Only visible when admin access is available

---

### 8. DATA INFRASTRUCTURE

#### 8.1 Database Architecture
- **Dual-schema design:**
  - Legacy `readings` table — flat structure (station_id, timestamp, temperature, dissolved_oxygen, ph, turbidity, ecoli_count, source)
  - EAV `measurements` table — flexible Entity-Attribute-Value structure (station_id, parameter_id, timestamp, value, qualifier, source) supporting unlimited parameters
  - `parameters` table — 25 parameter definitions with EPA thresholds, USGS pcodes, WQP characteristic names, units, categories, descriptions, display order
  - `stations` table — 12 monitoring stations with coordinates, type, status, parameter lists
  - `ingestion_log` table — tracks all data import runs with status and error messages
- **Dual-write** — ingestion writes to both legacy and EAV tables simultaneously for backwards compatibility
- **Auto-driver selection** — `DATABASE_URL` env var present = Neon PostgreSQL; absent = local SQLite
- **Schema parity** — identical schemas for SQLite and PostgreSQL with syntax-appropriate DDL

#### 8.2 Monitoring Stations (12 Total)
| ID | Name | Type | Location |
|----|------|------|----------|
| ANA-001 | Anacostia at Bladensburg | River | Bladensburg Waterfront |
| ANA-002 | Anacostia at Kenilworth | River | Kenilworth Aquatic Gardens |
| ANA-003 | Anacostia at Navy Yard | River | Navy Yard/Capitol Riverfront |
| ANA-004 | Anacostia at Anacostia Park | River | Anacostia Park |
| WB-001 | Watts Branch | Tributary | Watts Branch stream |
| PB-001 | Pope Branch at Fort Stanton | Tributary | Fort Stanton Park |
| HR-001 | Hickey Run | Tributary | National Arboretum area |
| GI-001 | UDC Van Ness Green Roof | Green Infrastructure | UDC Van Ness Campus |
| GI-002 | UDC Food Hub Rain Garden (W7) | Green Infrastructure | Ward 7 |
| GI-003 | UDC Food Hub Rain Garden (W8) | Green Infrastructure | Ward 8 |
| SW-001 | Stormwater BMP Benning Rd | Stormwater | Benning Road |
| SW-002 | Stormwater Outfall S. Capitol | Stormwater | South Capitol area |

#### 8.3 Water Quality Parameters (25 Total)
**Physical (6):** Temperature, Dissolved Oxygen, pH, Turbidity, Specific Conductance, Total Dissolved Solids
**Nutrients (5):** Total Nitrogen, Total Phosphorus, Ammonia, Nitrate, Chlorophyll-a
**Metals (5):** Lead, Copper, Zinc, Mercury, Arsenic
**Biological (4):** E. coli, Total Coliform, Enterococcus, BOD
**Emerging Contaminants (5):** PFAS, Microplastics, Pharmaceuticals, Pesticides, Cyanotoxins

Each parameter includes: EPA min/max thresholds, USGS parameter code, WQP characteristic name, unit, category, plain-English description, display order.

#### 8.4 Data Ingestion Pipeline
- **USGS NWIS** — `POST /api/ingest?source=usgs` fetches real-time instantaneous values from USGS National Water Information System for Anacostia stations
- **EPA Water Quality Portal** — `POST /api/ingest?source=wqp` imports lab-analyzed data for DC (FIPS US:11) including nutrients, metals, and biological parameters
- **Manual Upload** — CSV/JSON upload via admin panel with AI column mapping
- **Dual-write** — all ingestion writes to both legacy `readings` and new EAV `measurements` tables
- **Ingestion logging** — every import run recorded with timestamp, source, status, record count, and error messages
- **API key protection** — ingestion endpoints require `INGEST_API_KEY` for non-admin access

#### 8.5 Data Export
- `GET /api/export?format=csv` — full dataset export as CSV
- `GET /api/export?format=json` — full dataset export as JSON
- `GET /api/export?format=csv&station=ANA-001` — station-filtered export
- Date range filtering supported
- Scientific citations included in export headers

#### 8.6 Seed Script
- `npm run db:seed` (or `npx tsx scripts/seed.ts`)
- Populates: 12 stations, 25 parameters, 144 legacy readings, 738 EAV measurements
- Per-station seasonal profiles with scientifically accurate patterns
- Supports both SQLite and Neon PostgreSQL via `DATABASE_URL`

---

### 9. API LAYER (14 Endpoints)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/stations` | GET | None | All stations with latest readings |
| `/api/stations/[id]/history` | GET | None | Monthly time-series for a station |
| `/api/measurements` | GET | None | Flexible EAV query with filters (parameters, stations, categories, sources, date range, violations only) |
| `/api/parameters` | GET | None | 25 parameter definitions with optional category filter |
| `/api/export` | GET | None | CSV/JSON data export with station/date filters |
| `/api/ingest` | POST | API Key | USGS/EPA/WQP data ingestion with dual-write |
| `/api/ingestion-log` | GET | None | Ingestion run history with status |
| `/api/chat` | POST | None | AI research assistant (Claude) with streaming, tool use, rate limiting |
| `/api/health` | GET | None | System health (DB status, station count, uptime, version, provider) |
| `/api/admin/stations` | GET/POST/PUT/DELETE | Admin Key | Station CRUD |
| `/api/admin/readings` | GET/POST/DELETE | Admin Key | Readings CRUD with pagination |
| `/api/admin/upload` | POST | Admin Key | CSV/JSON upload with column mapping |
| `/api/admin/ai-map-columns` | POST | Admin Key | AI-powered column mapping (Claude Haiku) |

---

### 10. PRODUCTION INFRASTRUCTURE

#### 10.1 Error Handling
- **React Error Boundary** — wraps entire app in `layout.tsx`, catches render errors with user-friendly fallback UI showing error message and retry button
- **API error handling** — all endpoints return structured error responses with appropriate HTTP status codes
- **Graceful degradation** — dashboard works without AI key, without database (falls back to static data), without network

#### 10.2 Security
- **Content Security Policy (CSP)** — restricts script sources, image sources, font sources, connect sources
- **X-Content-Type-Options: nosniff** — prevents MIME type sniffing
- **X-Frame-Options: DENY** — prevents clickjacking
- **Referrer-Policy: strict-origin-when-cross-origin** — controls referrer information
- **Input validation** — XSS sanitization on all user inputs (search, admin forms) via `src/lib/validation.ts`
- **Dangerous pattern detection** — blocks `<script>`, `javascript:`, `on*=` event handlers, HTML entity encoding
- **API key authentication** — admin endpoints and ingestion require Bearer token
- **Rate limiting** — prevents API abuse on chat and ingestion endpoints
- **HTTPS only** — all external resources (CartoDB tiles, Leaflet CDN, Google Fonts) loaded via HTTPS
- Secrets managed via environment variables (`.env.local` gitignored)

#### 10.3 Testing (7 Test Suites)
- **Data integrity tests** — validates station data structure, coordinate ranges, parameter completeness
- **API stations tests** — verifies `/api/stations` response format and data
- **API history tests** — verifies `/api/stations/[id]/history` responses
- **API export tests** — verifies CSV/JSON export formatting
- **Error boundary tests** — verifies error catching and fallback rendering
- **Health check tests** — verifies `/api/health` response structure
- **Validation tests** — verifies XSS sanitization, input cleaning, dangerous pattern blocking
- Framework: Vitest + React Testing Library + jsdom

#### 10.4 CI/CD Pipeline
- **GitHub Actions** workflow (`.github/workflows/ci.yml`)
- Triggers: push to any branch, pull request to main
- Steps: checkout, Node.js setup, dependency install, run tests, build verification
- Prevents broken code from reaching production

#### 10.5 Deployment
- **Vercel (primary)** — automatic deploys from main branch, preview deploys for PRs
  - `vercel.json` configuration
  - Neon PostgreSQL for production database
  - Environment variables: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `ADMIN_API_KEY`
- **Docker (containerized)** — 3-stage build for self-hosted deployment
  - `Dockerfile` — Node 20 Alpine, standalone Next.js output
  - `docker-compose.yml` — local development environment
  - `.dockerignore` — excludes node_modules, .next, .git

#### 10.6 Logging
- Client-side logging utility (`src/lib/logger.ts`)
- Buffered logging (50-entry max) with info/warn/error levels
- Context metadata support (component name, action, timestamp)
- Console output in development, structured output in production

#### 10.7 Health Check
- `GET /api/health` returns:
  - Status: "healthy" / "degraded"
  - Timestamp
  - Version
  - Uptime (seconds)
  - Database provider (SQLite/PostgreSQL)
  - Station count
  - Database connectivity status

#### 10.8 Accessibility
- Skip-to-content link for keyboard navigation
- ARIA labels on interactive elements
- Semantic HTML structure (sections, headings, nav)
- Focus management in modals and slide-out panels
- Color contrast ratios meeting WCAG 2.1 AA
- Responsive from 320px mobile to 4K desktop

---

### 11. UI/UX DESIGN SYSTEM

#### 11.1 Glass Panel Effect
- Semi-transparent backgrounds with backdrop-blur
- Subtle border with theme-appropriate opacity
- Used across all cards, panels, and containers

#### 11.2 Custom Animations
- `rain-fall` — CSS keyframe for vertical raindrop animation
- `fade-in` — scroll-triggered content reveal
- Station marker pulse rings (SVG animate)
- Pollution front propagation (SVG stroke-dashoffset transition)
- River water shimmer (animated dashes)
- Theme transition (300ms color/background crossfade)
- Loading spinner (rotating border animation)
- Gradient text effect on hero heading

#### 11.3 Responsive Design
- Mobile-first breakpoints: sm (640px), md (768px), lg (1024px)
- Sidebar: hidden on mobile (hamburger toggle), collapsed icons on tablet, full on desktop
- Map: 300px mobile, 400px tablet, 550px desktop
- Charts: full-width responsive containers
- Tables: horizontal scroll on mobile
- Modals: bottom-sheet on mobile, centered on desktop
- Custom scrollbar styling per theme

#### 11.4 Dark/Light Theme Tokens
- 15+ CSS custom properties for colors, borders, backgrounds
- Consistent application across all 23 components
- Smooth transitions between modes

---

### 12. GEOSPATIAL DATA

All geospatial data derived from official DC government GIS sources:

- **Station coordinates** — lat/lng for all 12 monitoring stations
- **Anacostia River centerline** — polyline coordinates for main stem
- **DC stream network** — tributary polylines (Watts Branch, Pope Branch, Hickey Run, etc.)
- **Ward boundaries** — polygon coordinates for all 8 DC wards with population data
- **Watershed boundary** — Anacostia watershed (HUC 02070010) polygon
- **Flood zones** — FEMA-derived flood risk area polygons
- **Impervious surface zones** — high imperviousness area polygons

---

### 13. DATA ACCURACY & SCIENTIFIC RIGOR

#### 13.1 Corrected Seasonal Patterns (March 2026 Audit)
- **E. coli** — corrected from temperature-driven bell curve to rainfall/CSO-driven pattern based on Anacostia Watershed Society and USGS monitoring data:
  - Spring peak (April) from snowmelt + spring rainfall + CSO events
  - Summer dip (July) during dry periods with less runoff
  - Fall secondary peak (September) from tropical storm season
  - Winter lows (December–February) from cold suppressing bacterial growth
- **Dissolved Oxygen** — adjusted down ~5-8% to reflect declining DO trends documented in the 2025 State of the Anacostia River report
- **Stormwater Runoff** — realigned to match DC precipitation patterns (July wettest, January/February driest)
- **Temperature** — verified correct against USGS continuous monitoring data
- **pH** — verified correct (6.8–7.3 range typical for Anacostia)

#### 13.2 EPA Threshold References
- Dissolved Oxygen: 5.0 mg/L minimum (Clean Water Act Section 304(a))
- E. coli: 126 CFU/100mL geometric mean, 235 CFU/100mL single-sample max, 410 CFU/100mL STV
- Turbidity: 25 NTU aesthetic threshold
- pH: 6.5–9.0 acceptable range
- All thresholds displayed in charts, parameter explorer, and traffic light indicators

---

## Project Statistics

| Metric | Count |
|--------|-------|
| Source files (TypeScript/TSX) | 64 |
| Lines of code | ~15,900 |
| App pages | 7 |
| API endpoints | 14 |
| UI components | 23 |
| Monitoring stations | 12 |
| Water quality parameters | 25 |
| Research projects | 17 |
| Educational modules | 8 |
| Community events | 4 |
| Open datasets | 4 |
| Interactive stories | 4 |
| GIS overlay layers | 5 |
| Test suites | 7 |
| Translation keys | 100+ |
| Supported languages | 2 (English, Spanish) |
| npm dependencies | 22 production + 8 dev |
| Git commits | 95+ |
| Docker stages | 3 (deps, builder, runner) |
| CI/CD workflows | 1 (GitHub Actions) |

---

## Remaining Roadmap

### Sprint 4: Animated Scenarios (Planned)
- Timeline playback component (play/pause/scrub)
- Map animation layer with color-changing station markers
- Synchronized multi-chart view
- Pollution spike detection and scenario library

### Sprint 5: Polish & Integration (Planned)
- AI assistant context update for new parameters
- Admin panel updates for new parameter format
- Tests for new API routes and components
- Performance optimization and accessibility audit

### Future Enhancements
- Cron scheduling for automated USGS/EPA ingestion (Azure Functions Timer or Vercel Cron)
- RAG expansion — vector search over research papers and USGS reports
- AI-generated charts from natural language queries
- User authentication/authorization (currently API-key based)
- Mobile native app (React Native or PWA)

---

*This document reflects the current state of the UDC Water Resources Data Dashboard as of March 17, 2026.*
