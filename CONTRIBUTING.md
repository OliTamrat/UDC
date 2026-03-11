# Contributing to UDC Water Resources Dashboard

Welcome! This project is developed at UDC's CAUSES / WRRI for water quality research and environmental justice in DC.

## Getting Started

### Prerequisites
- **Node.js 20+** (LTS recommended)
- **npm** (comes with Node.js)
- **Git**

### Setup

```bash
git clone https://github.com/OliTamrat/UDC.git
cd UDC
npm install
npm run db:seed   # Populate the local SQLite database
npm run dev       # Start dev server at http://localhost:3000
```

### Useful Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:seed` | Seed SQLite database from static data |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/           # Next.js App Router pages and API routes
│   ├── api/       # Backend: stations, export, ingest, health
│   └── station/   # Dynamic station detail pages
├── components/    # React components (map, dashboard, charts, layout)
├── context/       # Theme provider
├── data/          # Static geospatial and reference data
├── lib/           # Utilities: database, logger, validation
└── __tests__/     # Vitest test suites
scripts/           # Database seed script
data/              # SQLite database (gitignored)
```

## Development Workflow

1. **Create a branch** from `main`: `git checkout -b feature/your-feature`
2. **Make changes** — follow the coding standards below
3. **Run tests**: `npm test`
4. **Verify build**: `npm run build`
5. **Open a PR** against `main` with a clear description

## Coding Standards

- **TypeScript strict mode** — all code must pass `tsc` with no errors
- **Functional React components** with hooks (no class components except ErrorBoundary)
- **Tailwind CSS** for styling — use the UDC theme variables (`udc-gold`, `udc-red`, `udc-navy`)
- **Dark/light theme** — all new components must support both themes using `useTheme()`
- **No `console.log`** in production code — use `src/lib/logger.ts` instead
- **Test new features** — add tests in `src/__tests__/` using Vitest

## API Routes

All API routes are in `src/app/api/`. The database connection is in `src/lib/db.ts`.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/stations` | GET | List all stations with latest readings |
| `/api/stations/:id/history` | GET | Time-series data for a station |
| `/api/export` | GET | CSV/JSON data export |
| `/api/ingest` | POST | Fetch data from USGS NWIS |
| `/api/health` | GET | Health check |

## Data Sources

- **USGS NWIS** — real-time stream gauge data via `waterservices.usgs.gov`
- **DC GIS** — ward boundaries, waterway polygons from DC Open Data
- **Static data** — `src/data/dc-waterways.ts` (reference/seed data)

## Need Help?

- Check `CLAUDE.md` for the project memory and architecture plan
- Open an issue on GitHub for bugs or feature requests
- Contact the WRRI lab for data-related questions
