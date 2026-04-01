# WQIS White-Label Deployment Guide

Deploy your own Water Quality Intelligence System for any watershed in the United States.

## Quick Start (5 Steps)

### 1. Fork & Clone
```bash
git clone https://github.com/OliTamrat/UDC.git my-watershed-wqis
cd my-watershed-wqis
npm install
```

### 2. Edit Configuration
Open `src/config/site.config.ts` and update:

```typescript
// Your institution
export const institution = {
  name: "Your University Name",
  shortName: "YUN",
  department: "Your Department",
  institute: "Your Research Institute",
  contact: { email: "water@your-uni.edu", phone: "(555) 123-4567", ... },
  ...
};

// Your watershed
export const watershed = {
  name: "Your River Name",
  fullName: "Your River Watershed",
  hucCode: "YOUR_HUC_CODE",     // Find at https://water.usgs.gov/wsc/map_index.html
  mapCenter: [LAT, LNG],         // Center of your watershed
  mapZoom: 12,
  ...
};

// Your USGS stations
export const usgsSites = [
  { usgs: "SITE_NUMBER", stationId: "STA-001", active: true, description: "..." },
  // Find your sites at https://waterdata.usgs.gov/nwis
];

// Your branding
export const branding = {
  primaryColor: "#YOUR_COLOR",
  logoText: "YUN",               // Max 4 characters
  ...
};
```

### 3. Set Environment Variables
Create `.env.local`:
```
DATABASE_URL=postgresql://user:pass@your-neon-host/dbname?sslmode=require
ANTHROPIC_API_KEY=sk-ant-...     # For AI Research Assistant
ADMIN_API_KEY=your-admin-key     # For admin panel access
INGEST_API_KEY=your-ingest-key   # For manual ingestion triggers
```

### 4. Update Geographic Data (Optional)
If your watershed is NOT in the DC area, update:
- `src/data/dc-waterways.ts` — Station coordinates, waterway paths
- `src/data/dc-boundaries.ts` — Ward/district polygons
- `public/dc-wards.geojson` — GeoJSON boundaries

### 5. Deploy
```bash
# Create Neon database
# Set DATABASE_URL on Vercel

# Deploy to Vercel
vercel link
vercel env add DATABASE_URL production
vercel env add ANTHROPIC_API_KEY production
vercel env add ADMIN_API_KEY production

# Push to trigger deployment (MUST use git push, not vercel --prod)
git push origin main
```

## Configuration Reference

### `src/config/site.config.ts`

| Section | What it controls |
|---------|-----------------|
| `institution` | Organization name, department, contact info, PI name |
| `watershed` | River name, HUC code, map center/zoom, description |
| `branding` | Logo text, colors, theme color |
| `deployment` | Site URL, CORS origins |
| `usgsSites` | USGS station mappings for data ingestion |
| `epaStationMap` | EPA/WQP monitoring location mappings |
| `usgsParams` | USGS parameter code → database column mapping |
| `allStationIds` | Station IDs for sitemap generation |

### Finding Your USGS Sites

1. Go to https://waterdata.usgs.gov/nwis/inventory
2. Search by state, county, or HUC code
3. Filter for "Water Quality" site type
4. Note the site numbers (8 digits)
5. Add to `usgsSites` in config

### Finding Your HUC Code

1. Go to https://water.usgs.gov/wsc/map_index.html
2. Click your watershed on the map
3. Note the 8-digit HUC code
4. Set as `watershed.hucCode` in config

## Pricing Model

| Plan | Setup | Monthly | Includes |
|------|-------|---------|----------|
| **Starter** | $5,000 | $500/mo | 1 watershed, up to 20 stations |
| **Professional** | $10,000 | $1,000/mo | 3 watersheds, AI agent, priority support |
| **Enterprise** | Custom | Custom | Unlimited watersheds, custom features |

## Support

- Email: wrri@udc.edu
- Built by Olink Technologies Inc & DAPS Analytics
- Powered by UDC CAUSES / WRRI
