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

---

## Overview

The UDC Water Resources Data Dashboard brings together water quality data from DOEE, EPA, USGS, Anacostia Riverkeeper, DC Water, and UDC's Environmental Quality Testing Lab into a single, accessible interface.

- **Empower DC communities** with transparent, real-time water quality information
- **Support UDC research** with integrated data visualization and analysis tools
- **Advance environmental justice** by highlighting disparities across DC's wards
- **Track green infrastructure** performance at UDC's urban food hubs and green roofs

---

## Features

| Feature | Description |
|---------|-------------|
| **Interactive Watershed Map** | 12 monitoring stations on Leaflet with ward boundaries, FEMA flood zones, watershed overlays, and theme-aware tiles |
| **Water Quality Monitoring** | Live tracking of dissolved oxygen, pH, temperature, turbidity, E. coli, and nutrients with EPA threshold comparison |
| **Time Slider** | Animated seasonal analysis with color-coded quality indicators and playback controls |
| **Station Detail Pages** | Per-station historical charts, data profiles, and measurement history |
| **Green Infrastructure** | Green roof, rain garden, and BMP performance tracking with runoff and retention data |
| **Environmental Justice** | Ward-level CSO analysis, green space access, flood risk, and impervious surface mapping |
| **Research Portal** | 6 active WRRI/CAUSES research projects with PI info, funding, and timelines |
| **Education & Outreach** | 6 learning modules, community events calendar, and open data portal |
| **AI Research Assistant** | Claude-powered chat with live data queries, EPA context, and suggested questions |
| **Admin Panel** | Faculty data management with CSV/JSON upload, AI column mapping, and CRUD operations |
| **Dark/Light Theme** | System-aware theme switching with localStorage persistence |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Mapping | Leaflet |
| Charts | Recharts |
| Database | SQLite (dev) / Neon PostgreSQL (prod) |
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
│  Dashboard    Station Detail    Research    Education    Admin   │
│  /            /station/[id]     /research   /education   /admin │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                       Next.js API Routes                        │
│                                                                 │
│  GET  /api/stations              GET  /api/export               │
│  GET  /api/stations/:id/history  POST /api/ingest               │
│  POST /api/chat                  GET  /api/health               │
│  POST /api/admin/upload          CRUD /api/admin/stations       │
│  CRUD /api/admin/readings        POST /api/admin/ai-map-columns │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    Database (SQLite / Neon)                      │
│               stations │ readings │ ingestion_log               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    External Data Sources                         │
│           USGS NWIS │ EPA WQX │ DC DOEE │ DC GIS               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/OliTamrat/UDC.git
cd UDC

# Install dependencies
npm install

# Seed the database (SQLite, no config needed)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

Create a `.env.local` file for optional features:

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

Push to GitHub and import at [vercel.com/new](https://vercel.com/new). Set environment variables in the Vercel dashboard.

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

## Funded By

<p align="center">
  DC Government &nbsp;|&nbsp; DC DOEE &nbsp;|&nbsp; USDA NIFA &nbsp;|&nbsp; EPA Region 3
</p>

---

## License

This project is developed by the University of the District of Columbia for research and educational purposes.
