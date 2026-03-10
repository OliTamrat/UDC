"use client";

import { useEffect, useState, useCallback } from "react";
import {
  monitoringStations,
  type MonitoringStation,
} from "@/data/dc-waterways";
import waterbodiesGeoJSON from "@/data/dc-waterbodies.json";
import waterwaysGeoJSON from "@/data/dc-waterways.json";
import { useTheme } from "@/context/ThemeContext";
import MapLayerControls, { type MapLayerState } from "./MapLayerControls";
import type { MonthlySnapshot } from "./TimeSlider";

let L: typeof import("leaflet") | null = null;

function getStationColor(station: MonitoringStation, ecoliMultiplier?: number): string {
  if (station.status === "offline") return "#6B7280";
  if (station.status === "maintenance") return "#F59E0B";
  if (station.type === "green-infrastructure") return "#22C55E";
  if (station.type === "stormwater") return "#8B5CF6";
  const reading = station.lastReading;
  if (!reading) return "#3B82F6";
  const ecoli = ecoliMultiplier ? reading.eColiCount * ecoliMultiplier : reading.eColiCount;
  if (ecoli > 1000) return "#EF4444";
  if (ecoli > 400) return "#F59E0B";
  return "#22C55E";
}

// Tile layers — OSM for light mode (most reliable), CartoDB dark for dark mode
const TILE_LAYERS = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  light: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

// Major river names for prominent rendering
const MAJOR_RIVERS = new Set(["Potomac River", "Anacostia", "Rock Creek"]);
const NAMED_TRIBUTARIES = new Set([
  "Watts Branch Creek", "Oxon Run", "Oxon Run Tributary",
  "Chesapeake and Ohio Canal", "Washington Channel",
  "Kingman Lake", "Tidal Basin", "Beaverdam Creek", "Barnaby Run",
]);

// DC center — focused on Anacostia confluence area
const DC_CENTER: [number, number] = [38.9072, -77.0169];
const DC_ZOOM = 12;

export default function DCMap({
  onStationSelect,
  onStationNavigate,
  monthSnapshot,
}: {
  onStationSelect?: (station: MonitoringStation | null) => void;
  selectedStation?: MonitoringStation | null;
  onStationNavigate?: (stationId: string) => void;
  monthSnapshot?: MonthlySnapshot | null;
}) {
  const [mapReady, setMapReady] = useState(false);
  const [layers, setLayers] = useState<MapLayerState>({
    wardBoundaries: false,
    watershedBoundary: false,
    floodZones: false,
    imperviousSurfaces: false,
    monitoringStations: true,
    waterways: true,
  });
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const handleLayerToggle = useCallback((layer: keyof MapLayerState) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then((leaflet) => {
      L = leaflet;
      setMapReady(true);
    });
  }, []);

  useEffect(() => {
    if (!mapReady || !L) return;
    const leaflet = L;

    const container = document.getElementById("dc-map");
    if (!container) return;

    if ((container as HTMLElement & { _leaflet_id?: number })._leaflet_id) {
      (container as HTMLElement & { _leaflet_id?: number })._leaflet_id = undefined;
      container.innerHTML = "";
    }

    const map = leaflet.map("dc-map", {
      center: DC_CENTER,
      zoom: DC_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    // Theme-aware tile layer
    const tileConfig = isDark ? TILE_LAYERS.dark : TILE_LAYERS.light;
    leaflet.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: isDark ? "abcd" : "abc",
      maxZoom: 19,
    }).addTo(map);

    // =============================================
    // WARD BOUNDARIES — Real DC GIS GeoJSON
    // =============================================
    if (layers.wardBoundaries) {
      fetch("/dc-wards.geojson")
        .then(res => res.json())
        .then((wardData: GeoJSON.FeatureCollection) => {
          leaflet.geoJSON(wardData, {
            style: {
              color: "#FDB927",
              weight: 2,
              opacity: isDark ? 0.7 : 0.6,
              fillColor: "#FDB927",
              fillOpacity: isDark ? 0.06 : 0.04,
            },
            onEachFeature: (feature, layer) => {
              const props = feature.properties;
              if (props) {
                const wardName = props.NAME || `Ward ${props.WARD}`;
                layer.bindTooltip(wardName, {
                  permanent: true,
                  direction: "center",
                  className: "ward-label",
                });
                layer.bindPopup(`
                  <div style="font-family:Inter,system-ui,sans-serif;min-width:180px;">
                    <h3 style="font-weight:700;font-size:14px;color:${isDark ? "#F8FAFC" : "#1E293B"};margin:0 0 6px;">${wardName}</h3>
                    <div style="display:grid;gap:4px;font-size:11px;color:${isDark ? "#94A3B8" : "#64748B"};">
                      ${props.REP_NAME ? `<div>Council: <strong style="color:${isDark ? "#E2E8F0" : "#334155"}">${props.REP_NAME}</strong></div>` : ""}
                      ${props.AREASQMI ? `<div>Area: <strong style="color:${isDark ? "#E2E8F0" : "#334155"}">${Number(props.AREASQMI).toFixed(2)} sq mi</strong></div>` : ""}
                    </div>
                  </div>
                `, { maxWidth: 250, className: "station-popup" });
              }
            },
          }).addTo(map);
        })
        .catch(() => { /* ward data failed to load — silent fallback */ });
    }

    // =============================================
    // WATERWAYS — Real DC GIS GeoJSON hydrography
    // =============================================
    if (layers.waterways) {
      // Waterbody polygons — filled river/lake surface areas
      leaflet.geoJSON(waterbodiesGeoJSON as GeoJSON.FeatureCollection, {
        style: {
          color: isDark ? "#38BDF8" : "#0369A1",
          weight: isDark ? 1 : 1.5,
          opacity: isDark ? 0.7 : 0.9,
          fillColor: isDark ? "#0EA5E9" : "#0284C7",
          fillOpacity: isDark ? 0.25 : 0.35,
        },
      }).addTo(map);

      // Hydrography centerlines — rivers, creeks, and streams
      leaflet.geoJSON(waterwaysGeoJSON as GeoJSON.FeatureCollection, {
        style: (feature) => {
          const name = feature?.properties?.name || "";
          const isMajor = MAJOR_RIVERS.has(name);
          const isTributary = NAMED_TRIBUTARIES.has(name);

          if (isMajor) {
            return {
              color: isDark ? "#38BDF8" : "#0369A1",
              weight: isDark ? 3.5 : 4,
              opacity: isDark ? 0.9 : 1,
              lineCap: "round" as const,
              lineJoin: "round" as const,
            };
          }
          if (isTributary) {
            return {
              color: isDark ? "#7DD3FC" : "#0284C7",
              weight: isDark ? 2 : 2.5,
              opacity: isDark ? 0.7 : 0.8,
              lineCap: "round" as const,
              lineJoin: "round" as const,
            };
          }
          // Minor/unnamed streams
          return {
            color: isDark ? "#BAE6FD" : "#0EA5E9",
            weight: 1,
            opacity: isDark ? 0.4 : 0.5,
            lineCap: "round" as const,
            lineJoin: "round" as const,
          };
        },
        onEachFeature: (feature, layer) => {
          const name = feature?.properties?.name;
          if (name) {
            layer.bindTooltip(name, { direction: "top", sticky: true });
          }
        },
      }).addTo(map);
    }

    // =============================================
    // MONITORING STATIONS
    // =============================================
    if (layers.monitoringStations) {
      const popupText = isDark ? "#F8FAFC" : "#1E293B";
      const popupSecondary = isDark ? "#94A3B8" : "#64748B";
      const popupMuted = isDark ? "#64748B" : "#94A3B8";
      const popupDataBg = isDark ? "rgba(10,22,40,0.5)" : "#F1F5F9";
      const popupDataLabel = isDark ? "#64748B" : "#94A3B8";

      monitoringStations.forEach((station) => {
        const ecoliMult = monthSnapshot?.ecoliMultiplier;
        const color = getStationColor(station, ecoliMult);
        const isGI = station.type === "green-infrastructure";
        const isSW = station.type === "stormwater";
        const size = station.type === "river" ? 12 : 10;

        let iconHtml: string;
        if (isGI) {
          iconHtml = `<div style="width:${size + 4}px;height:${size + 4}px;background:linear-gradient(135deg,#22C55E,#16A34A);border:2px solid rgba(255,255,255,0.9);border-radius:4px;box-shadow:0 0 14px rgba(34,197,94,0.5);position:relative;transform:rotate(45deg);">${station.status === "active" ? `<div style="position:absolute;width:${size + 14}px;height:${size + 14}px;border-radius:4px;border:2px solid #22C55E;top:-7px;left:-7px;animation:pulse-ring 2.5s ease-out infinite;opacity:0.5;"></div>` : ""}</div>`;
        } else if (isSW) {
          iconHtml = `<div style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#8B5CF6,#7C3AED);border:2px solid rgba(255,255,255,0.8);border-radius:3px;box-shadow:0 0 12px ${color}80;position:relative;">${station.status === "active" ? `<div style="position:absolute;width:${size + 8}px;height:${size + 8}px;border-radius:3px;border:2px solid ${color};top:-6px;left:-6px;animation:pulse-ring 2s ease-out infinite;opacity:0.6;"></div>` : ""}</div>`;
        } else {
          iconHtml = `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid rgba(255,255,255,0.8);border-radius:50%;box-shadow:0 0 12px ${color}80;position:relative;">${station.status === "active" ? `<div style="position:absolute;width:${size + 8}px;height:${size + 8}px;border-radius:50%;border:2px solid ${color};top:-6px;left:-6px;animation:pulse-ring 2s ease-out infinite;opacity:0.6;"></div>` : ""}</div>`;
        }

        const icon = leaflet.divIcon({
          className: "custom-station-marker",
          html: iconHtml,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = leaflet.marker(station.position, { icon }).addTo(map);
        const reading = station.lastReading;
        const statusColor = station.status === "active" ? "#22C55E" : station.status === "maintenance" ? "#F59E0B" : "#6B7280";
        const viewDetailBtn = onStationNavigate
          ? `<div style="margin-top:8px;text-align:center;"><button onclick="window.__navigateStation('${station.id}')" style="background:#3B82F6;color:white;border:none;padding:5px 14px;border-radius:6px;font-size:11px;font-weight:500;cursor:pointer;font-family:Inter,system-ui,sans-serif;">View Full Details →</button></div>`
          : "";

        let popupHtml = `
          <div style="min-width:260px;font-family:Inter,system-ui,sans-serif;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <h3 style="font-weight:600;font-size:13px;color:${popupText};margin:0;">${station.name}</h3>
              <span style="font-size:11px;font-weight:500;color:${statusColor};text-transform:capitalize;">${station.status}</span>
            </div>
            <div style="font-size:11px;color:${popupSecondary};margin-bottom:8px;">ID: ${station.id} | Type: ${station.type.replace("-", " ")}</div>`;

        if (reading) {
          const ecoliColor = reading.eColiCount > 400 ? "#F87171" : "#4ADE80";
          popupHtml += `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
              <div style="background:${popupDataBg};border-radius:6px;padding:6px;"><div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">Temp</div><div style="font-size:13px;font-weight:600;color:#22D3EE;">${reading.temperature}°C</div></div>
              <div style="background:${popupDataBg};border-radius:6px;padding:6px;"><div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">DO</div><div style="font-size:13px;font-weight:600;color:#60A5FA;">${reading.dissolvedOxygen} mg/L</div></div>
              <div style="background:${popupDataBg};border-radius:6px;padding:6px;"><div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">pH</div><div style="font-size:13px;font-weight:600;color:#4ADE80;">${reading.pH}</div></div>
              <div style="background:${popupDataBg};border-radius:6px;padding:6px;"><div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">Turbidity</div><div style="font-size:13px;font-weight:600;color:#FBBF24;">${reading.turbidity} NTU</div></div>
              <div style="background:${popupDataBg};border-radius:6px;padding:6px;grid-column:span 2;"><div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">E. coli</div><div style="font-size:13px;font-weight:600;color:${ecoliColor};">${reading.eColiCount.toLocaleString()} CFU/100mL</div></div>
            </div>
            <div style="margin-top:6px;font-size:10px;color:${popupMuted};">Last updated: ${new Date(reading.timestamp).toLocaleString()}</div>`;
        }

        popupHtml += viewDetailBtn + `</div>`;
        marker.bindPopup(popupHtml, { maxWidth: 300, className: "station-popup" });
        marker.on("click", () => onStationSelect?.(station));
      });
    }

    // =============================================
    // UDC CAMPUS
    // =============================================
    const udcIcon = leaflet.divIcon({
      className: "udc-campus-marker",
      html: `<div style="background:linear-gradient(135deg,#FDB927,#CE1141);width:22px;height:22px;border-radius:4px;border:2px solid white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:8px;color:white;box-shadow:0 0 16px rgba(253,185,39,0.5),0 2px 8px rgba(0,0,0,0.3);">UDC</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    const udcPopupText = isDark ? "#F8FAFC" : "#1E293B";
    const udcPopupSecondary = isDark ? "#94A3B8" : "#64748B";
    leaflet.marker([38.9435, -77.0230], { icon: udcIcon })
      .bindPopup(`<div style="font-family:Inter,system-ui,sans-serif;"><h3 style="font-weight:700;font-size:14px;color:${udcPopupText};margin:0 0 4px;">University of the District of Columbia</h3><p style="font-size:11px;color:${udcPopupSecondary};margin:0 0 6px;">CAUSES / WRRI Research Hub</p><p style="font-size:11px;color:${isDark ? "#CBD5E1" : "#475569"};margin:0;">4200 Connecticut Ave NW, Washington, DC</p></div>`)
      .addTo(map);

    // =============================================
    // LEGEND
    // =============================================
    const legendBg = isDark ? "rgba(15, 29, 50, 0.9)" : "rgba(255, 255, 255, 0.95)";
    const legendBorder = isDark ? "rgba(30, 58, 95, 0.5)" : "rgba(226, 232, 240, 0.8)";
    const legendText = isDark ? "#F8FAFC" : "#1E293B";
    const legendMuted = isDark ? "#94A3B8" : "#64748B";

    const legend = new leaflet.Control({ position: "bottomright" });
    legend.onAdd = () => {
      const div = document.createElement("div");
      div.style.cssText = `background:${legendBg};backdrop-filter:blur(12px);border:1px solid ${legendBorder};border-radius:10px;padding:12px;font-family:Inter,system-ui,sans-serif;color:${legendText};font-size:11px;min-width:170px;box-shadow:0 4px 12px rgba(0,0,0,${isDark ? "0.3" : "0.1"});`;
      div.innerHTML = `
        <div style="font-weight:600;margin-bottom:8px;font-size:12px;">Map Legend</div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:24px;height:4px;background:${isDark ? "#38BDF8" : "#0369A1"};border-radius:2px;"></div><span>Major Rivers</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:24px;height:2px;background:${isDark ? "#7DD3FC" : "#0284C7"};border-radius:2px;"></div><span style="color:${legendMuted}">Tributaries</span></div>
          <div style="border-top:1px solid ${legendBorder};padding-top:5px;margin-top:3px;"></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;background:#22C55E;border-radius:50%;border:1.5px solid white;"></div><span>Healthy Station</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;background:#F59E0B;border-radius:50%;border:1.5px solid white;"></div><span style="color:${legendMuted}">Maintenance</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;background:#EF4444;border-radius:50%;border:1.5px solid white;"></div><span style="color:${legendMuted}">High E. coli</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;background:linear-gradient(135deg,#22C55E,#16A34A);border-radius:2px;border:1.5px solid white;transform:rotate(45deg);"></div><span>Green Infra.</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;background:linear-gradient(135deg,#8B5CF6,#7C3AED);border-radius:2px;border:1.5px solid white;"></div><span>Stormwater</span></div>
          ${layers.wardBoundaries ? `<div style="border-top:1px solid ${legendBorder};padding-top:5px;margin-top:3px;"></div><div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;border:2px solid #FDB927;border-radius:2px;"></div><span>Ward Boundaries</span></div>` : ""}
        </div>
      `;
      return div;
    };
    legend.addTo(map);

    // Station navigation bridge
    if (onStationNavigate) {
      (window as unknown as Record<string, unknown>).__navigateStation = (id: string) => onStationNavigate(id);
    }

    return () => {
      map.remove();
      if (typeof window !== "undefined") {
        delete (window as unknown as Record<string, unknown>).__navigateStation;
      }
    };
  }, [mapReady, onStationSelect, onStationNavigate, isDark, layers, monthSnapshot]);

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden border transition-colors duration-300 ${
      isDark ? "border-panel-border" : "border-slate-200"
    }`}>
      <MapLayerControls layers={layers} onLayerToggle={handleLayerToggle} />
      <div id="dc-map" className="w-full h-full min-h-[500px]" />
      {!mapReady && (
        <div className={`absolute inset-0 flex items-center justify-center ${isDark ? "bg-udc-dark" : "bg-slate-50"}`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-water-blue border-t-transparent rounded-full animate-spin" />
            <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading DC Map...</span>
          </div>
        </div>
      )}
    </div>
  );
}
