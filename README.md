# UDC Water Resources Data Dashboard

**University of the District of Columbia — CAUSES / WRRI**

An interactive, production-ready dashboard for water quality monitoring, data integration, analysis, and visualization across the Anacostia River watershed and DC waterways. Built to support research at UDC's Water Resources Research Institute (WRRI) and the College of Agriculture, Urban Sustainability & Environmental Sciences (CAUSES).

---

## What We're Building

The UDC Water Resources Data Dashboard is a centralized platform that brings together water quality data from multiple sources — DOEE, EPA, USGS, Anacostia Riverkeeper, DC Water, and UDC's own Environmental Quality Testing Lab — into a single, accessible interface. The goal is to:

1. **Empower DC communities** with transparent, real-time water quality information for the Anacostia River and its tributaries
2. **Support UDC research** by providing integrated data visualization and analysis tools for WRRI/CAUSES faculty, students, and partners
3. **Advance environmental justice** by highlighting disparities in water quality, flood risk, and green space access across DC's wards — particularly in Wards 7 and 8
4. **Track green infrastructure performance** at UDC's urban food hubs, green roofs, and rain gardens to demonstrate stormwater management effectiveness

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

### Research Portal
- Catalog of **6 active WRRI/CAUSES research projects** with PI information, funding sources, timelines, and tags
- Searchable and filterable by keyword and research area
- Data integration source directory (DOEE, EPA, USGS, Anacostia Riverkeeper, DC Water, UDC EQTL)

### Education & Community Outreach
- **6 learning modules** ranging from beginner to advanced: Understanding the Anacostia, Water Quality 101, Green Infrastructure Solutions, Environmental Justice & Water, Stormwater Data Analysis, Emerging Contaminants
- Audience-specific content paths for DC community, UDC students, and faculty/researchers
- Community events calendar (cleanups, workshops, symposiums, tours)
- **Open Data Portal** with downloadable research datasets (CSV, JSON, GeoJSON)

### Theme Support
- **Dark / Light / System** theme switching with full support across all pages, components, and map tiles
- Persistent theme preference via localStorage
- System theme detection that responds to OS-level changes

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Mapping | Leaflet |
| Charts | Recharts |
| Icons | Lucide React |
| Database | SQLite (better-sqlite3) |
| Testing | Vitest |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│  ┌──────────┐ ┌────────────┐ ┌───────────┐ ┌─────────┐ │
│  │ Dashboard │ │ Station    │ │ Research  │ │Education│ │
│  │ (Map,    │ │ Detail     │ │ Portal    │ │& Outreach│ │
│  │ Charts,  │ │ /station/  │ │ /research │ │/education│ │
│  │ Tables)  │ │ [id]       │ │           │ │         │ │
│  └────┬─────┘ └─────┬──────┘ └───────────┘ └─────────┘ │
│       │              │                                    │
│       ▼              ▼                                    │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Next.js API Routes                    │    │
│  │  GET /api/stations    GET /api/stations/:id/history│   │
│  │  GET /api/export      POST /api/ingest             │   │
│  │  GET /api/health                                   │    │
│  └────────────────────────┬─────────────────────────┘    │
└───────────────────────────┼──────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │    SQLite Database     │
                │  stations | readings   │
                │  ingestion_log         │
                └───────────┬───────────┘
                            │
              ┌─────────────▼──────────────┐
              │   External Data Sources     │
              │  USGS NWIS | EPA WQX       │
              │  DC DOEE   | DC GIS        │
              └────────────────────────────┘
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                # Main dashboard (map, charts, metrics, EJ analysis)
│   ├── research/page.tsx       # Research portal with project catalog
│   ├── education/page.tsx      # Education, community events, open data
│   ├── station/[id]/page.tsx   # Individual station detail pages
│   ├── layout.tsx              # Root layout with theme provider
│   └── globals.css             # Theme system (dark/light), animations, Leaflet overrides
├── components/
│   ├── map/
│   │   ├── DCMap.tsx           # Interactive Leaflet map with all GIS layers
│   │   ├── MapLayerControls.tsx # Toggleable layer control panel
│   │   └── TimeSlider.tsx      # Animated monthly water quality timeline
│   ├── dashboard/
│   │   ├── MetricCards.tsx     # Summary metrics (8 key indicators)
│   │   ├── StationTable.tsx   # Monitoring station data table
│   │   └── EnvironmentalJustice.tsx # Ward-level EJ bar charts
│   ├── charts/
│   │   └── WaterQualityCharts.tsx # DO, temperature, E. coli, stormwater, multi-param charts
│   └── layout/
│       ├── Header.tsx          # Top bar with search, theme switcher, live indicator
│       └── Sidebar.tsx         # Navigation sidebar with section grouping
├── context/
│   └── ThemeContext.tsx        # Dark/light/system theme provider
└── data/
    ├── dc-waterways.ts        # Waterway coordinates, station data, research projects, historical data
    └── dc-boundaries.ts       # Ward boundary polygons, watershed, flood zones, impervious surfaces
public/
└── dc-wards.geojson           # Full-resolution DC ward boundaries from DC GIS
```

---

## Data Sources

| Source | Data Provided |
|--------|--------------|
| **DC DOEE** | River monitoring, water quality assessments, CSO tracking, environmental permits |
| **EPA Region 3** | Federal standards (STORET/WQX), NPDES permits, Clean Water Act compliance |
| **USGS** | Stream gauges (NWIS), groundwater monitoring, flood alerts |
| **Anacostia Riverkeeper** | Community monitoring, Swim Guide data, citizen science |
| **DC Water** | CSO tunnel project data, treatment plant data, sewer infrastructure |
| **UDC EQTL** | Lab analysis, field sampling, PFAS testing |

---

## UDC Research Programs

This dashboard supports and integrates data from:

- **WRRI** — Water Resources Research Institute
- **CAUSES** — College of Agriculture, Urban Sustainability & Environmental Sciences
- **CURII** — Center for Urban Resilience, Innovation and Infrastructure
- **EQTL** — Environmental Quality Testing Laboratory

### Active Research Projects
1. Green Roof Stormwater Retention Analysis (Dr. Tolessa Deksissa)
2. Urban Food Hub Stormwater BMP Monitoring (Dr. Dwane Jones)
3. Anacostia Watershed PFAS Assessment (Dr. Sarah Mitchell)
4. Potomac Source Water Protection Partnership (Dr. Tolessa Deksissa)
5. Tree Cell Stormwater Filtration Effectiveness (Dr. James Richardson)
6. Rainwater Reuse Safety Assessment (Dr. Maria Chen)

---

## Deployment

### Production Build

```bash
npm run build
npm start       # Starts on port 3000
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t udc-dashboard .
docker run -p 3000:3000 udc-dashboard
```

### Vercel

Push to GitHub and import the repository at [vercel.com/new](https://vercel.com/new). No additional configuration needed.

### Health Check

The `/api/health` endpoint returns JSON with `status`, `timestamp`, `version`, and `uptime` — use this for load balancer or uptime monitoring probes.

### Testing

```bash
npm test          # Run all tests once
npm run test:watch # Watch mode
```

---

## Funded By

DC Government | DC DOEE | USDA NIFA | EPA Region 3

---

## License

This project is developed by the University of the District of Columbia for research and educational purposes.
