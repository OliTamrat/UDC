/**
 * Simplify raw DC GIS GeoJSON files for web delivery.
 * Uses Douglas-Peucker-like coordinate reduction (no external deps).
 *
 * Outputs optimized files to src/data/geojson/ with -optimized suffix.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const geoDir = join(__dirname, '..', 'src', 'data', 'geojson');

// ── Douglas-Peucker simplification ──────────────────────────────
function distToSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.sqrt((p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.sqrt((p[0] - (a[0] + t * dx)) ** 2 + (p[1] - (a[1] + t * dy)) ** 2);
}

function simplifyDP(coords, epsilon) {
  if (coords.length <= 2) return coords;
  let maxDist = 0, maxIdx = 0;
  for (let i = 1; i < coords.length - 1; i++) {
    const d = distToSegment(coords[i], coords[0], coords[coords.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = simplifyDP(coords.slice(0, maxIdx + 1), epsilon);
    const right = simplifyDP(coords.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [coords[0], coords[coords.length - 1]];
}

function simplifyRing(ring, epsilon) {
  const simplified = simplifyDP(ring, epsilon);
  // Ensure ring is closed (polygons)
  if (simplified.length >= 3 &&
    (simplified[0][0] !== simplified[simplified.length - 1][0] ||
      simplified[0][1] !== simplified[simplified.length - 1][1])) {
    simplified.push(simplified[0]);
  }
  return simplified.length >= 4 ? simplified : ring; // Polygons need >= 4 points
}

function simplifyGeometry(geom, epsilon) {
  if (geom.type === 'Point' || geom.type === 'MultiPoint') return geom;

  if (geom.type === 'LineString') {
    return { ...geom, coordinates: simplifyDP(geom.coordinates, epsilon) };
  }
  if (geom.type === 'MultiLineString') {
    return { ...geom, coordinates: geom.coordinates.map(line => simplifyDP(line, epsilon)) };
  }
  if (geom.type === 'Polygon') {
    return { ...geom, coordinates: geom.coordinates.map(ring => simplifyRing(ring, epsilon)) };
  }
  if (geom.type === 'MultiPolygon') {
    return {
      ...geom,
      coordinates: geom.coordinates.map(poly =>
        poly.map(ring => simplifyRing(ring, epsilon))
      )
    };
  }
  return geom;
}

function simplifyGeoJSON(data, epsilon) {
  return {
    type: 'FeatureCollection',
    features: data.features.map(f => ({
      type: 'Feature',
      properties: f.properties,
      geometry: simplifyGeometry(f.geometry, epsilon),
    })),
  };
}

function roundCoords(geom, precision = 6) {
  const round = (coords) => {
    if (typeof coords[0] === 'number') {
      return coords.map(c => Math.round(c * 10 ** precision) / 10 ** precision);
    }
    return coords.map(c => round(c));
  };
  return { ...geom, coordinates: round(geom.coordinates) };
}

function roundGeoJSON(data, precision = 6) {
  return {
    type: 'FeatureCollection',
    features: data.features.map(f => ({
      type: 'Feature',
      properties: f.properties,
      geometry: roundCoords(f.geometry, precision),
    })),
  };
}

function countPoints(data) {
  let total = 0;
  const count = (coords) => {
    if (typeof coords[0] === 'number') { total++; return; }
    coords.forEach(c => count(c));
  };
  data.features.forEach(f => count(f.geometry.coordinates));
  return total;
}

// ── Process each layer ──────────────────────────────────────────

function processLayer(filename, epsilon, keepProps = null, filterFn = null) {
  const raw = JSON.parse(readFileSync(join(geoDir, filename), 'utf8'));
  const outName = filename.replace('-raw.geojson', '.geojson');

  let data = raw;

  // Filter features if needed
  if (filterFn) {
    data = { ...data, features: data.features.filter(filterFn) };
  }

  // Strip unnecessary properties
  if (keepProps) {
    data = {
      ...data,
      features: data.features.map(f => ({
        ...f,
        properties: Object.fromEntries(
          Object.entries(f.properties).filter(([k]) => keepProps.includes(k))
        ),
      })),
    };
  }

  const ptsBefore = countPoints(data);

  // Simplify geometry
  let simplified = simplifyGeoJSON(data, epsilon);

  // Round coordinates to 5 decimal places (~1m precision)
  simplified = roundGeoJSON(simplified, 5);

  const ptsAfter = countPoints(simplified);
  const rawSize = JSON.stringify(data).length;
  const outSize = JSON.stringify(simplified).length;

  writeFileSync(join(geoDir, outName), JSON.stringify(simplified));

  console.log(`${outName}: ${data.features.length} features, ${ptsBefore} → ${ptsAfter} points (${Math.round(ptsAfter / ptsBefore * 100)}%), ${Math.round(rawSize / 1024)}KB → ${Math.round(outSize / 1024)}KB`);
}

console.log('Simplifying DC GIS GeoJSON layers...\n');

// Wards: keep key properties, moderate simplification
processLayer('dc-wards-raw.geojson', 0.00008, ['WARD', 'NAME', 'REP_NAME', 'REP_PHONE', 'REP_EMAIL']);

// Watersheds: keep name, light simplification
processLayer('dc-watersheds-raw.geojson', 0.0001, ['NAME', 'GIS_ID']);

// Sub-watersheds: keep key fields, aggressive simplification (188 features)
processLayer('dc-subwatersheds-raw.geojson', 0.0002, ['WATERSHED', 'SUBSHED', 'ACRES', 'SEWER_SYSTEM']);

// Waterways centerlines: keep named streams, moderate simplification
processLayer('dc-waterways-raw.geojson', 0.00005, ['NAME', 'FEATURECODE', 'DESCRIPTION']);

// Waterbodies: very aggressive simplification (1293 features, 5MB)
processLayer('dc-waterbodies-raw.geojson', 0.0002, ['FEATURECODE', 'DESCRIPTION'],
  // Filter: only keep rivers/lakes, not tiny drainage features
  f => ['2001', '2003', '2004', '2005'].includes(String(f.properties.FEATURECODE))
);

// Floodplains 2023: keep zone info, aggressive simplification (402 features, 7MB)
processLayer('dc-floodplains-raw.geojson', 0.0003, ['FLD_ZONE', 'ZONE_SUBTY', 'STATIC_BFE']);

// Green Infrastructure (DDOT): 881 features, small polygons — light simplification
processLayer('dc-green-infrastructure-raw.geojson', 0.00005, ['GI_TYPE', 'WARD', 'CONDITION', 'SEWER_SYSTEM', 'GI_OWNER', 'VICINITY', 'FACILITY_TYPE']);

// CSO Sewershed: 1 large polygon — moderate simplification
processLayer('dc-cso-sewershed-raw.geojson', 0.0002, ['NAME', 'SEWERSYSTEM']);

// MS4 Sewersheds: 556 features, 3MB — aggressive simplification
processLayer('dc-ms4-sewershed-raw.geojson', 0.0002, ['WATERSHED', 'SUBSHED', 'ACRES', 'SUSCEPTIBILITY']);

console.log('\nDone! Optimized files written to src/data/geojson/');
