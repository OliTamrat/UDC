# UDC Water Resources Data Dashboard

**University of the District of Columbia — CAUSES / WRRI**

Production-ready interactive dashboard for water quality monitoring, data integration, analysis, and visualization across the Anacostia River watershed and DC waterways.

## Features

- **Interactive DC Map** — Real-time visualization of the Anacostia River, tributaries (Watts Branch, Pope Branch, Hickey Run, Rock Creek, etc.), and 12+ monitoring stations using Leaflet with dark-themed CartoDB tiles
- **Water Quality Monitoring** — Live tracking of dissolved oxygen, pH, temperature, turbidity, E. coli, and nutrient levels with EPA standards comparison
- **Stormwater & Green Infrastructure** — Monitoring UDC's green roofs, rain gardens, and tree cell BMPs across DC
- **Environmental Justice Analysis** — Ward-level CSO event tracking, green space access, and impervious surface data
- **Research Portal** — WRRI/CAUSES research project catalog with filtering, PI information, and funding sources
- **Education & Outreach** — Learning modules for DC public, UDC students, and faculty; community events; open data downloads
- **Multi-Stakeholder Design** — Tailored views for DC general public, UDC faculty/staff, and students

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Mapping**: Leaflet / React-Leaflet
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── research/page.tsx     # Research portal
│   ├── education/page.tsx    # Education & outreach
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles (UDC theme)
├── components/
│   ├── map/DCMap.tsx         # Interactive Leaflet map
│   ├── dashboard/            # Metric cards, station table, env justice
│   ├── charts/               # Water quality trend charts
│   └── layout/               # Sidebar, header
└── data/
    └── dc-waterways.ts       # DC waterways, stations, research data
```

## Data Sources

- DC DOEE — River monitoring, water quality assessments
- EPA Region 3 — Federal standards, STORET/WQX
- USGS — Stream gauges, groundwater
- Anacostia Riverkeeper — Community monitoring
- DC Water — CSO data, Clean Rivers Project
- UDC EQTL — Lab analysis, PFAS testing

## Funded By

DC Government | DOEE | USDA NIFA | EPA
