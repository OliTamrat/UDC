<p align="center">
  <img src="https://www.udc.edu/causes/wp-content/uploads/sites/26/2020/01/CAUSES-logo.png" alt="UDC CAUSES" width="200"/>
</p>

<h1 align="center">UDC Water Resources Data Dashboard</h1>

<p align="center">
  <strong>University of the District of Columbia — CAUSES / WRRI</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4"/>
  <img src="https://img.shields.io/badge/Leaflet-Maps-199900?logo=leaflet&logoColor=white" alt="Leaflet"/>
  <img src="https://img.shields.io/badge/Recharts-Visualizations-8884d8" alt="Recharts"/>
  <img src="https://img.shields.io/badge/License-Academic-blue" alt="License"/>
</p>

<p align="center">
  <strong>University of the District of Columbia — CAUSES / WRRI</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4"/>
  <img src="https://img.shields.io/badge/Leaflet-Maps-199900?logo=leaflet&logoColor=white" alt="Leaflet"/>
  <img src="https://img.shields.io/badge/License-Academic-blue" alt="License"/>
</p>

<p align="center">
  Interactive water quality monitoring platform for the Anacostia River watershed and DC waterways.<br/>
  Built to support research at UDC's Water Resources Research Institute (WRRI) and CAUSES.
</p>

---

> **Screenshots:** Add dashboard screenshots to a `docs/screenshots/` folder and uncomment the section below.
>
> <!-- <p align="center"><img src="docs/screenshots/dashboard-dark.png" alt="Dashboard" width="800"/></p> -->

<!-- Uncomment when you add screenshots:
<p align="center">
  <img src="docs/screenshots/dashboard-dark.png" alt="Dashboard Screenshot" width="800"/>
</p>
-->

---

## Overview

The UDC Water Resources Data Dashboard brings together water quality data from DOEE, EPA, USGS, Anacostia Riverkeeper, DC Water, and UDC's Environmental Quality Testing Lab into a single, accessible interface.

- **Empower DC communities** with transparent, real-time water quality information
- **Support UDC research** with integrated data visualization and analysis tools
- **Advance environmental justice** by highlighting disparities across DC's wards
- **Track green infrastructure** performance at UDC's urban food hubs and green roofs

---

## Features

### Interactive Watershed Map
- Real-time visualization of the **Anacostia River**, **Potomac River**, and tributaries (Watts Branch, Pope Branch, Hickey Run, Rock Creek, Nash Run, Fort Dupont Creek, Oxon Run) with accurate geographic paths
- **12 monitoring stations** displayed on the map with live water quality readings (river stations, stream stations, stormwater BMPs, and green infrastructure sites)
- **DC ward boundaries** with population, council member, flood risk, and impervious surface data
- **Anacostia watershed boundary** overlay showing the full 176 sq mi drainage area
- **FEMA flood zone** overlays for high-risk areas along the Anacostia
- **Impervious surface** mapping for urban runoff hotspots
- Toggleable layer controls, theme-aware CartoDB tiles (dark/light), and interactive popups

### Water Quality Monitoring
- Live tracking of **dissolved oxygen**, **pH**, **temperature**, **turbidity**, **E. coli**, and **nutrient levels** across all stations
- EPA standards comparison with visual thresholds
- Historical trend charts (monthly averages, 2025) for all parameters
- Multi-parameter overlay chart for cross-analysis
- Per-station detailed historical data with seasonal patterns

### Time Slider & Seasonal Analysis
- Animated timeline showing seasonal water quality variation throughout the year
- Color-coded quality indicators (good/moderate/poor) by month
- E. coli severity tracking tied to seasonal patterns
- Playback controls for temporal data exploration

### Station Detail Pages
- Individual station pages with full data profiles
- Historical charts specific to each station's monitoring parameters
- Station location, type, status, and measurement history

### Stormwater & Green Infrastructure
- Monitoring UDC's **green roofs** (Van Ness campus), **rain gardens** (Ward 7 & 8 Food Hubs), and **tree cell BMPs**
- Stormwater BMP performance tracking (Benning Road, South Capitol)
- Runoff volume, retention rates, TSS, and nutrient removal data

### Environmental Justice Analysis
- **Ward-level analysis** of CSO (Combined Sewer Overflow) events
- Green space access percentages by ward
- Impervious surface coverage mapping
- Flood risk assessment (Low/Medium/High) with color-coded indicators
- Disproportionate impact visualization for Wards 7 & 8

### AI Research Assistant
- Claude-powered chat interface for querying water quality data in natural language
- Domain-aware system prompt with EPA thresholds, seasonal patterns, and station metadata
- Tool-augmented — AI can query live station data and historical readings
- Streaming responses with suggested questions and conversation history
- Graceful degradation when API key is not configured

### Faculty Admin Panel
- Drag-and-drop CSV/JSON upload with automatic column mapping and validation
- AI-assisted column mapping (Claude Haiku) with heuristic fallback
- Full CRUD for stations and readings with pagination
- USGS/EPA ingestion trigger and ingestion log viewer
- API-key protected access control

### Research Portal
- Catalog of **6 active WRRI/CAUSES research projects** with PI information, funding sources, timelines, and tags
- Searchable and filterable by keyword and research area
- Data integration source directory (DOEE, EPA, USGS, Anacostia Riverkeeper, DC Water, UDC EQTL)

### Education & Community Outreach
- **6 learning modules** ranging from beginner to advanced: Understanding the Anacostia, Water Quality 101, Green Infrastructure Solutions, Environmental Justice & Water, Stormwater Data Analysis, Emerging Contaminants
- Audience-specific content paths for DC community, UDC students, and faculty/researchers
- Community events calendar (cleanups, workshops, symposiums, tours)
- **Open Data Portal** with downloadable research datasets (CSV, JSON, GeoJSON)

### Data Export & Integration
- CSV and JSON export via `/api/export` with station and date filtering
- USGS NWIS real-time data ingestion with logging
- RESTful API for all station and reading data

### Theme Support
- **Dark / Light / System** theme switching with full support across all pages, components, and map tiles
- Persistent theme preference via localStorage
- System theme detection that responds to OS-level changes

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Mapping | Leaflet |
| Charts | Recharts |
| Icons | Lucide React |
| Database (dev) | SQLite (better-sqlite3) |
| Database (prod) | Neon PostgreSQL |
| AI | Anthropic Claude via Vercel AI SDK v6 |
| Testing | Vitest |
| CI/CD | GitHub Actions |
| Deployment | Docker / Vercel |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Frontend (React 19)                       │
│                                                                 │
│  ┌──────────┐ ┌────────────┐ ┌───────────┐ ┌─────────────────┐ │
│  │ Dashboard │ │ Station    │ │ Research  │ │ Education       │ │
│  │ (Map,    │ │ Detail     │ │ Portal    │ │ & Outreach      │ │
│  │ Charts,  │ │ /station/  │ │ /research │ │ /education      │ │
│  │ Tables)  │ │ [id]       │ │           │ │                 │ │
│  └────┬─────┘ └─────┬──────┘ └───────────┘ └─────────────────┘ │
│       │              │                                           │
│  ┌────┴──────────────┴──────────────────────────────────────┐   │
│  │  AI Research Assistant     │    Faculty Admin Panel       │   │
│  │  (Claude Chat + Tools)     │    (Upload, CRUD, Logs)     │   │
│  └────────────────────────────┴─────────────────────────────┘   │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Next.js API Routes                      │   │
│  │  GET  /api/stations         GET  /api/stations/:id/history│   │
│  │  GET  /api/export           POST /api/ingest              │   │
│  │  POST /api/chat             GET  /api/health              │   │
│  │  POST /api/admin/upload     CRUD /api/admin/stations      │   │
│  │  CRUD /api/admin/readings   POST /api/admin/ai-map-columns│   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │  SQLite / Neon PgSQL  │
                │  stations | readings  │
                │  ingestion_log        │
                └───────────┬───────────┘
                            │
              ┌─────────────▼──────────────┐
              │   External Data Sources     │
              │  USGS NWIS | EPA WQX       │
              │  DC DOEE   | DC GIS        │
              └────────────────────────────┘
```

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/OliTamrat/UDC.git
cd UDC

# Install dependencies
npm install

# Seed the database (SQLite — no config needed)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

Create a `.env.local` file to enable optional features:

```env
# AI Research Assistant (optional — dashboard works without it)
ANTHROPIC_API_KEY=your-key-here

# Admin Panel Access (optional — open access in dev if unset)
ADMIN_API_KEY=your-admin-key

# Production Database (optional — defaults to local SQLite)
DATABASE_URL=postgresql://user:password@host/db
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main dashboard (map, charts, metrics, EJ analysis)
│   ├── research/page.tsx           # Research portal with project catalog
│   ├── education/page.tsx          # Education, community events, open data
│   ├── station/[id]/page.tsx       # Individual station detail pages
│   ├── admin/page.tsx              # Faculty admin panel (upload, CRUD, logs)
│   ├── layout.tsx                  # Root layout with theme provider + error boundary
│   ├── globals.css                 # Theme system (dark/light), animations, Leaflet overrides
│   └── api/                        # REST API routes (stations, export, ingest, chat, admin)
├── components/
│   ├── map/
│   │   ├── DCMap.tsx               # Interactive Leaflet map with all GIS layers
│   │   ├── MapLayerControls.tsx    # Toggleable layer control panel
│   │   └── TimeSlider.tsx          # Animated monthly water quality timeline
│   ├── dashboard/
│   │   ├── MetricCards.tsx         # Summary metrics (8 key indicators)
│   │   ├── StationTable.tsx        # Monitoring station data table
│   │   └── EnvironmentalJustice.tsx # Ward-level EJ bar charts
│   ├── charts/
│   │   └── WaterQualityCharts.tsx  # DO, temperature, E. coli, stormwater, multi-param charts
│   ├── ai/
│   │   └── ResearchAssistant.tsx   # AI chat panel (floating widget with streaming)
│   └── layout/
│       ├── Header.tsx              # Top bar with search, theme switcher, live indicator
│       └── Sidebar.tsx             # Navigation sidebar with section grouping
├── lib/
│   ├── db.ts                       # Database abstraction (SQLite + Neon PostgreSQL)
│   ├── logger.ts                   # Client-side buffered logging utility
│   └── validation.ts               # Input sanitization with XSS prevention
├── context/
│   └── ThemeContext.tsx            # Dark/light/system theme provider
└── data/
    ├── dc-waterways.ts             # Waterway coordinates, station data, research, historical data
    └── dc-boundaries.ts            # Ward boundary polygons, watershed, flood zones
public/
└── dc-wards.geojson                # Full-resolution DC ward boundaries from DC GIS
```

```env
# AI Research Assistant (optional)
ANTHROPIC_API_KEY=your-key-here

# Admin Panel Access (optional, open in dev if unset)
ADMIN_API_KEY=your-admin-key

# Production Database (optional, defaults to SQLite)
DATABASE_URL=postgresql://user:password@host/db
```

---

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

---

## Deployment

### Docker

```bash
docker build -t udc-dashboard .
docker run -p 3000:3000 udc-dashboard
```

### Vercel

Push to GitHub and import the repository at [vercel.com/new](https://vercel.com/new). Set environment variables in the Vercel dashboard.

### Health Check

`GET /api/health` returns JSON with `status`, `timestamp`, `version`, and `uptime`.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main dashboard
│   ├── station/[id]/page.tsx       # Station detail pages
│   ├── research/page.tsx           # Research portal
│   ├── education/page.tsx          # Education & outreach
│   ├── admin/page.tsx              # Faculty admin panel
│   └── api/                        # REST API routes
├── components/
│   ├── map/                        # DCMap, LayerControls, TimeSlider
│   ├── dashboard/                  # MetricCards, StationTable, EJ Analysis
│   ├── charts/                     # Water quality visualizations
│   ├── ai/                         # Research assistant chat
│   └── layout/                     # Header, Sidebar
├── lib/
│   ├── db.ts                       # Database abstraction (SQLite + PostgreSQL)
│   ├── logger.ts                   # Client-side logging
│   └── validation.ts               # Input sanitization
└── data/                           # Static datasets, GIS boundaries
```

---

## Data Sources

| Source | Data Provided |
|--------|--------------|
| **DC DOEE** | River monitoring, water quality assessments, CSO tracking |
| **EPA Region 3** | Federal standards (STORET/WQX), NPDES permits |
| **USGS** | Stream gauges (NWIS), groundwater monitoring, flood alerts |
| **Anacostia Riverkeeper** | Community monitoring, Swim Guide, citizen science |
| **DC Water** | CSO tunnel project data, treatment plant data |
| **UDC EQTL** | Lab analysis, field sampling, PFAS testing |

---

## Research Programs

This dashboard supports data from:

| Program | Full Name |
|---------|-----------|
| **WRRI** | Water Resources Research Institute |
| **CAUSES** | College of Agriculture, Urban Sustainability & Environmental Sciences |
| **CURII** | Center for Urban Resilience, Innovation and Infrastructure |
| **EQTL** | Environmental Quality Testing Laboratory |

### Active Research Projects

| Project | Principal Investigator |
|---------|----------------------|
| Green Roof Stormwater Retention Analysis | Dr. Tolessa Deksissa |
| Urban Food Hub Stormwater BMP Monitoring | Dr. Dwane Jones |
| Anacostia Watershed PFAS Assessment | Dr. Sarah Mitchell |
| Potomac Source Water Protection Partnership | Dr. Tolessa Deksissa |
| Tree Cell Stormwater Filtration Effectiveness | Dr. James Richardson |
| Rainwater Reuse Safety Assessment | Dr. Maria Chen |

---

<p align="center">

**Funded By**

DC Government &nbsp;|&nbsp; DC DOEE &nbsp;|&nbsp; USDA NIFA &nbsp;|&nbsp; EPA Region 3

</p>

---

## License

This project is developed by the University of the District of Columbia for research and educational purposes.
