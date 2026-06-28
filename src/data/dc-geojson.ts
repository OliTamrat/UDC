// Official DC GIS GeoJSON data — lazy-loaded per layer toggle
// Source: maps2.dcgis.dc.gov — downloaded and simplified via scripts/simplify-geojson.mjs
// Note: GeoJSON coordinates are [longitude, latitude] (standard GeoJSON / Leaflet L.geoJSON default)

export type GeoJSONData = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: {
      type: string;
      coordinates: unknown;
    };
  }>;
};

const cache: Record<string, GeoJSONData> = {};

async function load(name: string): Promise<GeoJSONData> {
  if (cache[name]) return cache[name];
  const mod = await import(`./geojson/${name}.json`);
  cache[name] = mod.default as GeoJSONData;
  return cache[name];
}

export const loadWards = () => load("dc-wards");
export const loadWatersheds = () => load("dc-watersheds");
export const loadSubwatersheds = () => load("dc-subwatersheds");
export const loadWaterways = () => load("dc-waterways");
export const loadWaterbodies = () => load("dc-waterbodies");
export const loadFloodplains = () => load("dc-floodplains");
export const loadGreenInfrastructure = () => load("dc-green-infrastructure");
export const loadCsoSewershed = () => load("dc-cso-sewershed");
export const loadMs4Sewersheds = () => load("dc-ms4-sewershed");
