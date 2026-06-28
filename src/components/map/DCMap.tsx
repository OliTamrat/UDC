"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  monitoringStations,
  type MonitoringStation,
} from "@/data/dc-waterways";
import {
  loadWards,
  loadWatersheds,
  loadSubwatersheds,
  loadWaterways,
  loadWaterbodies,
  loadFloodplains,
  loadGreenInfrastructure,
  loadCsoSewershed,
  loadMs4Sewersheds,
  type GeoJSONData,
} from "@/data/dc-geojson";
import { useTheme } from "@/context/ThemeContext";
import MapLayerControls, { type MapLayerState } from "./MapLayerControls";
import type { MonthlySnapshot } from "./TimeSlider";
import { watershed } from "@/config/site.config";

let L: typeof import("leaflet") | null = null;

function getStationColor(station: MonitoringStation, ecoliMultiplier?: number): string {
  if (station.status === "offline") return "#6B7280";
  if (station.status === "maintenance") return "#F59E0B";
  if (station.type === "green-infrastructure") return "#22C55E";
  if (station.type === "stormwater") return "#8B5CF6";
  const reading = station.lastReading;
  if (!reading) return "#3B82F6";
  const rawEcoli = reading.eColiCount ?? 0;
  const ecoli = ecoliMultiplier ? rawEcoli * ecoliMultiplier : rawEcoli;
  if (ecoli > 1000) return "#EF4444";
  if (ecoli > 400) return "#F59E0B";
  return "#22C55E";
}

const TILE_LAYERS = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
};

// Flood zone color by FEMA designation
function floodZoneColor(zone: string): string {
  if (zone === "AE" || zone === "A") return "#EF4444";
  if (zone === "AO" || zone === "AH") return "#F97316";
  if (zone === "VE" || zone === "V") return "#DC2626";
  if (zone === "X") return "#F59E0B";
  return "#F59E0B";
}

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
    subwatersheds: false,
    floodZones: false,
    waterways: true,
    waterbodies: false,
    monitoringStations: true,
    greenInfrastructure: false,
    sewerSystem: false,
  });
  const geoJsonCache = useRef<Record<string, GeoJSONData>>({});
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

  // Pre-load GeoJSON data when layers are toggled on
  useEffect(() => {
    const toLoad: Array<[string, () => Promise<GeoJSONData>]> = [];
    if (layers.wardBoundaries && !geoJsonCache.current.wards) toLoad.push(["wards", loadWards]);
    if (layers.watershedBoundary && !geoJsonCache.current.watersheds) toLoad.push(["watersheds", loadWatersheds]);
    if (layers.subwatersheds && !geoJsonCache.current.subwatersheds) toLoad.push(["subwatersheds", loadSubwatersheds]);
    if (layers.waterways && !geoJsonCache.current.waterways) toLoad.push(["waterways", loadWaterways]);
    if (layers.waterbodies && !geoJsonCache.current.waterbodies) toLoad.push(["waterbodies", loadWaterbodies]);
    if (layers.floodZones && !geoJsonCache.current.floodplains) toLoad.push(["floodplains", loadFloodplains]);
    if (layers.greenInfrastructure && !geoJsonCache.current.greenInfra) toLoad.push(["greenInfra", loadGreenInfrastructure]);
    if (layers.sewerSystem && !geoJsonCache.current.csoSewershed) toLoad.push(["csoSewershed", loadCsoSewershed]);
    if (layers.sewerSystem && !geoJsonCache.current.ms4Sewersheds) toLoad.push(["ms4Sewersheds", loadMs4Sewersheds]);

    if (toLoad.length > 0) {
      Promise.all(toLoad.map(async ([key, loader]) => {
        geoJsonCache.current[key] = await loader();
      }));
    }
  }, [layers]);

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
      center: watershed.mapCenter,
      zoom: watershed.mapZoom,
      zoomControl: true,
      attributionControl: true,
    });

    const tileConfig = isDark ? TILE_LAYERS.dark : TILE_LAYERS.light;
    leaflet.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    // =============================================
    // WATERSHED BOUNDARIES (Official DC GIS)
    // =============================================
    if (layers.watershedBoundary && geoJsonCache.current.watersheds) {
      leaflet.geoJSON(geoJsonCache.current.watersheds as never, {
        style: (feature) => {
          const name = feature?.properties?.NAME || "";
          const isAnacostia = name.toLowerCase().includes("anacostia");
          return {
            color: isAnacostia ? "#06B6D4" : "#94A3B8",
            weight: isAnacostia ? 2.5 : 1.5,
            opacity: isAnacostia ? 0.7 : 0.4,
            fillColor: isAnacostia ? "#06B6D4" : "#94A3B8",
            fillOpacity: isDark ? (isAnacostia ? 0.08 : 0.03) : (isAnacostia ? 0.06 : 0.02),
            dashArray: isAnacostia ? "10 6" : "6 4",
          };
        },
        onEachFeature: (feature, layer) => {
          const name = feature.properties?.NAME || "Watershed";
          layer.bindTooltip(name, { direction: "center" });
          layer.on("click", () => {
            map.flyToBounds((layer as L.Polygon).getBounds(), { padding: [40, 40], duration: 0.8 });
          });
        },
      }).addTo(map);
    }

    // =============================================
    // SUB-WATERSHEDS (Official DC GIS — 188 sub-watersheds)
    // =============================================
    if (layers.subwatersheds && geoJsonCache.current.subwatersheds) {
      leaflet.geoJSON(geoJsonCache.current.subwatersheds as never, {
        style: (feature) => {
          const ws = (feature?.properties?.WATERSHED || "").toLowerCase();
          const color = ws.includes("anacostia") ? "#06B6D4"
            : ws.includes("rock") ? "#8B5CF6"
            : ws.includes("potomac") ? "#3B82F6"
            : "#64748B";
          return {
            color,
            weight: 1,
            opacity: 0.5,
            fillColor: color,
            fillOpacity: isDark ? 0.06 : 0.04,
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          layer.bindTooltip(
            `${p?.SUBSHED || "Sub-watershed"}<br><span style="font-size:10px;opacity:0.7">${p?.WATERSHED || ""} · ${p?.ACRES ? Math.round(Number(p.ACRES)) + " acres" : ""}</span>`,
            { direction: "top" }
          );
          layer.on("click", () => {
            map.flyToBounds((layer as L.Polygon).getBounds(), { padding: [40, 40], duration: 0.8 });
          });
        },
      }).addTo(map);
    }

    // =============================================
    // WARD BOUNDARIES (Official DC GIS — 8 wards)
    // =============================================
    if (layers.wardBoundaries && geoJsonCache.current.wards) {
      leaflet.geoJSON(geoJsonCache.current.wards as never, {
        style: () => ({
          color: "#FDB927",
          weight: 2,
          opacity: isDark ? 0.7 : 0.6,
          fillColor: "#FDB927",
          fillOpacity: isDark ? 0.06 : 0.04,
        }),
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          const ward = p?.WARD || p?.NAME || "";
          layer.bindTooltip(`Ward ${ward}`, {
            permanent: true,
            direction: "center",
            className: "ward-label",
          });
          const popupBg = isDark ? "rgba(19,22,31,0.95)" : "rgba(255,255,255,0.98)";
          const popupText = isDark ? "#F3F4F6" : "#111827";
          const popupSec = isDark ? "#9CA3AF" : "#64748B";
          layer.bindPopup(`
            <div style="font-family:Inter,system-ui,sans-serif;min-width:180px;background:${popupBg};color:${popupText};">
              <h3 style="font-weight:700;font-size:14px;margin:0 0 6px;">Ward ${ward}</h3>
              <div style="display:grid;gap:4px;font-size:11px;color:${popupSec};">
                ${p?.REP_NAME ? `<div>Council: <strong style="color:${popupText}">${p.REP_NAME}</strong></div>` : ""}
                ${p?.REP_PHONE ? `<div>Phone: ${p.REP_PHONE}</div>` : ""}
              </div>
            </div>
          `, { maxWidth: 250, className: "station-popup" });
          // Click to zoom into ward
          layer.on("click", () => {
            map.flyToBounds((layer as L.Polygon).getBounds(), { padding: [40, 40], duration: 0.8 });
          });
        },
      }).addTo(map);
    }

    // =============================================
    // FLOOD ZONES (Official FEMA NFHL 2023 — 402 zones)
    // =============================================
    if (layers.floodZones && geoJsonCache.current.floodplains) {
      leaflet.geoJSON(geoJsonCache.current.floodplains as never, {
        style: (feature) => {
          const zone = feature?.properties?.FLD_ZONE || "X";
          const color = floodZoneColor(zone);
          const isHighRisk = zone === "AE" || zone === "A" || zone === "VE";
          return {
            color,
            weight: isHighRisk ? 1.5 : 1,
            opacity: 0.6,
            fillColor: color,
            fillOpacity: isDark ? (isHighRisk ? 0.2 : 0.1) : (isHighRisk ? 0.15 : 0.08),
            dashArray: isHighRisk ? undefined : "4 4",
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          const zone = p?.FLD_ZONE || "Unknown";
          const subtype = p?.ZONE_SUBTY ? ` (${p.ZONE_SUBTY})` : "";
          layer.bindTooltip(`FEMA Zone ${zone}${subtype}`, { direction: "top" });
          layer.on("click", () => {
            map.flyToBounds((layer as L.Polygon).getBounds(), { padding: [40, 40], duration: 0.8 });
          });
        },
      }).addTo(map);
    }

    // =============================================
    // WATERBODIES (Official DC GIS — river/lake polygons)
    // =============================================
    if (layers.waterbodies && geoJsonCache.current.waterbodies) {
      leaflet.geoJSON(geoJsonCache.current.waterbodies as never, {
        style: () => ({
          color: "#2563EB",
          weight: 0.5,
          opacity: 0.4,
          fillColor: isDark ? "#1D4ED8" : "#3B82F6",
          fillOpacity: isDark ? 0.25 : 0.2,
        }),
      }).addTo(map);
    }

    // =============================================
    // WATERWAYS (Official DC GIS — 1,273 centerlines)
    // =============================================
    if (layers.waterways && geoJsonCache.current.waterways) {
      leaflet.geoJSON(geoJsonCache.current.waterways as never, {
        style: (feature) => {
          const name = (feature?.properties?.NAME || "").toLowerCase();
          const isAnacostia = name.includes("anacostia");
          const isPotomac = name.includes("potomac");
          const isMajor = isAnacostia || isPotomac;
          return {
            color: isMajor ? "#2563EB" : (isDark ? "#60A5FA" : "#3B82F6"),
            weight: isMajor ? 4 : (name ? 2.5 : 1.5),
            opacity: isMajor ? 0.85 : (name ? 0.7 : 0.4),
            lineCap: "round" as const,
            lineJoin: "round" as const,
          };
        },
        onEachFeature: (feature, layer) => {
          const name = feature.properties?.NAME;
          if (name) {
            layer.bindTooltip(name, { direction: "top", sticky: true });
          }
        },
      }).addTo(map);
    }

    // =============================================
    // SEWER SYSTEM — CSO (Combined Sewer) + MS4 (Separated Storm)
    // =============================================
    if (layers.sewerSystem && geoJsonCache.current.csoSewershed) {
      leaflet.geoJSON(geoJsonCache.current.csoSewershed as never, {
        style: () => ({
          color: "#A855F7",
          weight: 2,
          opacity: 0.7,
          fillColor: "#A855F7",
          fillOpacity: isDark ? 0.15 : 0.1,
        }),
        onEachFeature: (feature, layer) => {
          const name = feature.properties?.NAME || "Combined Sewer System";
          layer.bindTooltip(`<strong>CSO Area</strong><br><span style="font-size:10px;opacity:0.7">${name}</span>`, { direction: "center" });
        },
      }).addTo(map);
    }

    if (layers.sewerSystem && geoJsonCache.current.ms4Sewersheds) {
      leaflet.geoJSON(geoJsonCache.current.ms4Sewersheds as never, {
        style: (feature) => {
          const susc = (feature?.properties?.SUSCEPTIBILITY || "").toLowerCase();
          const color = susc === "high" ? "#DC2626" : susc === "medium" ? "#F59E0B" : "#6366F1";
          return {
            color,
            weight: 1,
            opacity: 0.5,
            fillColor: color,
            fillOpacity: isDark ? 0.1 : 0.07,
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          const susc = p?.SUSCEPTIBILITY || "Unknown";
          const acres = p?.ACRES ? Math.round(Number(p.ACRES)) : "";
          layer.bindTooltip(
            `<strong>MS4 Sewershed</strong><br>${p?.SUBSHED || ""}<br><span style="font-size:10px;opacity:0.7">${p?.WATERSHED || ""} · ${acres ? acres + " acres" : ""} · ${susc} susceptibility</span>`,
            { direction: "top" }
          );
        },
      }).addTo(map);
    }

    // =============================================
    // GREEN INFRASTRUCTURE (DDOT — 881 sites)
    // =============================================
    if (layers.greenInfrastructure && geoJsonCache.current.greenInfra) {
      const GI_TYPES: Record<string, string> = {
        "1": "Bioretention", "2": "Permeable Pavement", "3": "Green Roof",
        "4": "Rain Garden", "5": "Tree Box Filter", "6": "Infiltration",
        "7": "Swale", "8": "Planter", "9": "Cistern",
      };
      const GI_COLORS: Record<string, string> = {
        "1": "#10B981", "2": "#0EA5E9", "3": "#22C55E",
        "4": "#34D399", "5": "#6EE7B7", "6": "#14B8A6",
        "7": "#2DD4BF", "8": "#A7F3D0", "9": "#67E8F9",
      };
      leaflet.geoJSON(geoJsonCache.current.greenInfra as never, {
        style: (feature) => {
          const giType = String(feature?.properties?.GI_TYPE || "1");
          const color = GI_COLORS[giType] || "#10B981";
          return {
            color,
            weight: 1.5,
            opacity: 0.8,
            fillColor: color,
            fillOpacity: isDark ? 0.35 : 0.3,
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          const typeName = GI_TYPES[String(p?.GI_TYPE)] || "Green Infrastructure";
          const ward = p?.WARD ? `Ward ${p.WARD}` : "";
          const vicinity = p?.VICINITY || "";
          layer.bindTooltip(
            `<strong>${typeName}</strong><br><span style="font-size:10px;opacity:0.7">${vicinity}${ward ? " · " + ward : ""}</span>`,
            { direction: "top" }
          );
        },
      }).addTo(map);
    }

    // =============================================
    // MONITORING STATIONS (from dc-waterways.ts — unchanged)
    // =============================================
    if (layers.monitoringStations) {
      const popupBg = isDark ? "rgba(19, 22, 31, 0.95)" : "rgba(255, 255, 255, 0.98)";
      const popupText = isDark ? "#F3F4F6" : "#111827";
      const popupSecondary = isDark ? "#9CA3AF" : "#64748B";
      const popupMuted = isDark ? "#9CA3AF" : "#94A3B8";
      const popupDataBg = isDark ? "rgba(10,22,40,0.5)" : "#F1F5F9";
      const popupDataLabel = isDark ? "#9CA3AF" : "#94A3B8";

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
            <div style="font-size:11px;color:${popupSecondary};margin-bottom:8px;">ID: ${station.id} | Type: ${station.type === "green-infrastructure" ? "Green Infrastructure BMP" : station.type.replace("-", " ")}</div>`;

        if (reading) {
          const ecoliColor = (reading.eColiCount ?? 0) > 400 ? "#F87171" : "#4ADE80";
          popupHtml += `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
              <div style="background:${popupDataBg};border-radius:6px;padding:6px;"><div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">Temp</div><div style="font-size:13px;font-weight:600;color:#22D3EE;">${reading.temperature ?? "—"}°C</div></div>
              <div style="background:${popupDataBg};border-radius:6px;padding:6px;"><div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">DO</div><div style="font-size:13px;font-weight:600;color:#60A5FA;">${reading.dissolvedOxygen ?? "—"} mg/L</div></div>
              <div style="background:${popupDataBg};border-radius:6px;padding:6px;"><div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">pH</div><div style="font-size:13px;font-weight:600;color:#4ADE80;">${reading.pH ?? "—"}</div></div>
              <div style="background:${popupDataBg};border-radius:6px;padding:6px;"><div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">Turbidity</div><div style="font-size:13px;font-weight:600;color:#FBBF24;">${reading.turbidity ?? "—"} NTU</div></div>
              <div style="background:${popupDataBg};border-radius:6px;padding:6px;grid-column:span 2;"><div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">E. coli</div><div style="font-size:13px;font-weight:600;color:${ecoliColor};">${reading.eColiCount != null ? reading.eColiCount.toLocaleString() : "—"} CFU/100mL</div></div>
            </div>
            <div style="margin-top:6px;display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:10px;color:${popupMuted};">Last updated: ${reading.timestamp
              ? new Date(reading.timestamp).toLocaleString()
              : "—"}</span>
              <span style="font-size:9px;padding:1px 6px;border-radius:9px;font-weight:500;${
                (reading as unknown as Record<string, unknown>).source === "usgs"
                  ? "background:rgba(59,130,246,0.15);color:#60A5FA;border:1px solid rgba(59,130,246,0.3);"
                  : (reading as unknown as Record<string, unknown>).source === "wqp"
                    ? "background:rgba(20,184,166,0.15);color:#2DD4BF;border:1px solid rgba(20,184,166,0.3);"
                  : (reading as unknown as Record<string, unknown>).source === "epa"
                    ? "background:rgba(74,222,128,0.15);color:#4ADE80;border:1px solid rgba(74,222,128,0.3);"
                    : "background:rgba(100,116,139,0.15);color:#94A3B8;border:1px solid rgba(100,116,139,0.3);"
              }">${
                (reading as unknown as Record<string, unknown>).source === "usgs" ? "USGS"
                  : (reading as unknown as Record<string, unknown>).source === "wqp" ? "EPA WQP"
                  : (reading as unknown as Record<string, unknown>).source === "epa" ? "EPA"
                    : "Seed"
              }</span>
            </div>`;
        }

        popupHtml += viewDetailBtn + `</div>`;
        marker.bindPopup(popupHtml, { maxWidth: 300, className: "station-popup" });
        marker.on("click", () => onStationSelect?.(station));
      });
    }

    // =============================================
    // UDC CAMPUS MARKER
    // =============================================
    const udcIcon = leaflet.divIcon({
      className: "udc-campus-marker",
      html: `<div style="background:linear-gradient(135deg,#FDB927,#CE1141);width:22px;height:22px;border-radius:4px;border:2px solid white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:8px;color:white;box-shadow:0 0 16px rgba(253,185,39,0.5),0 2px 8px rgba(0,0,0,0.3);">UDC</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    const campusPopupText = isDark ? "#F3F4F6" : "#111827";
    const campusPopupSec = isDark ? "#9CA3AF" : "#64748B";
    leaflet.marker([38.9436, -77.0631], { icon: udcIcon })
      .bindPopup(`<div style="font-family:Inter,system-ui,sans-serif;"><h3 style="font-weight:700;font-size:14px;color:${campusPopupText};margin:0 0 4px;">University of the District of Columbia</h3><p style="font-size:11px;color:${campusPopupSec};margin:0 0 6px;">CAUSES / WRRI Research Hub</p><p style="font-size:11px;color:${isDark ? "#D1D5DB" : "#475569"};margin:0;">4200 Connecticut Ave NW, Washington, DC</p></div>`)
      .addTo(map);

    // =============================================
    // LEGEND
    // =============================================
    const legendBg = isDark ? "rgba(19, 22, 31, 0.9)" : "rgba(255, 255, 255, 0.95)";
    const legendBorder = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(226, 232, 240, 0.8)";
    const legendText = isDark ? "#F3F4F6" : "#111827";
    const legendMuted = isDark ? "#9CA3AF" : "#64748B";

    const isMobile = window.innerWidth < 640;
    const legend = new leaflet.Control({ position: "bottomright" });
    legend.onAdd = () => {
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "display:flex;flex-direction:column;align-items:flex-end;";

      const content = document.createElement("div");
      content.style.cssText = `background:${legendBg};backdrop-filter:blur(12px);border:1px solid ${legendBorder};border-radius:10px;padding:${isMobile ? "8px 10px" : "12px"};font-family:Inter,system-ui,sans-serif;color:${legendText};font-size:${isMobile ? "10px" : "11px"};min-width:${isMobile ? "140px" : "170px"};box-shadow:0 4px 12px rgba(0,0,0,${isDark ? "0.3" : "0.1"});max-height:${isMobile ? "50vh" : "none"};overflow-y:auto;display:${isMobile ? "none" : "block"};`;
      content.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:5px;">
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:24px;height:4px;background:linear-gradient(90deg,#2563EB,#60A5FA);border-radius:2px;"></div><span>Rivers & Streams</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;background:#3B82F6;border-radius:50%;border:1.5px solid white;"></div><span>River Station</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;background:linear-gradient(135deg,#22C55E,#16A34A);border-radius:2px;border:1.5px solid white;transform:rotate(45deg);"></div><span>Green Infra.</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;background:linear-gradient(135deg,#8B5CF6,#7C3AED);border-radius:2px;border:1.5px solid white;"></div><span>Stormwater</span></div>
          ${layers.greenInfrastructure ? `<div style="border-top:1px solid ${legendBorder};padding-top:5px;margin-top:3px;"></div><div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;background:#10B98155;border:1px solid #10B981;border-radius:2px;"></div><span>Green Infra. (DDOT)</span></div>` : ""}
          ${layers.sewerSystem ? `${!layers.greenInfrastructure ? `<div style="border-top:1px solid ${legendBorder};padding-top:5px;margin-top:3px;"></div>` : ""}<div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;background:#A855F733;border:1px solid #A855F7;border-radius:2px;"></div><span>CSO Sewershed</span></div><div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;background:#6366F133;border:1px solid #6366F1;border-radius:2px;"></div><span>MS4 Sewershed</span></div>` : ""}
          ${layers.floodZones ? `<div style="border-top:1px solid ${legendBorder};padding-top:5px;margin-top:3px;"></div><div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;background:#EF444433;border:1px solid #EF4444;border-radius:2px;"></div><span>FEMA Flood Zone</span></div>` : ""}
          ${layers.watershedBoundary ? `<div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;border:1.5px dashed #06B6D4;border-radius:2px;"></div><span>Watershed</span></div>` : ""}
          ${layers.subwatersheds ? `<div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;background:#06B6D420;border:1px solid #06B6D4;border-radius:2px;"></div><span>Sub-watershed</span></div>` : ""}
          ${layers.waterbodies ? `<div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;background:#3B82F633;border:1px solid #3B82F6;border-radius:2px;"></div><span>Waterbody</span></div>` : ""}
        </div>
      `;

      const toggle = document.createElement("button");
      toggle.style.cssText = `background:${legendBg};backdrop-filter:blur(12px);border:1px solid ${legendBorder};border-radius:8px;padding:6px 10px;font-family:Inter,system-ui,sans-serif;color:${legendText};font-size:10px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,${isDark ? "0.3" : "0.1"});display:${isMobile ? "block" : "none"};margin-bottom:4px;`;
      toggle.textContent = "Legend ▲";
      let legendOpen = !isMobile;
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        legendOpen = !legendOpen;
        content.style.display = legendOpen ? "block" : "none";
        toggle.textContent = legendOpen ? "Legend ▼" : "Legend ▲";
      });

      wrapper.addEventListener("mousedown", (e) => e.stopPropagation());
      wrapper.addEventListener("touchstart", (e) => e.stopPropagation());

      wrapper.appendChild(toggle);
      wrapper.appendChild(content);
      return wrapper;
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
      isDark ? "border-white/[0.06]" : "border-[#D1D5DB]"
    }`}>
      <MapLayerControls layers={layers} onLayerToggle={handleLayerToggle} />
      <div id="dc-map" className="w-full h-full min-h-[650px]" />
      {!mapReady && (
        <div className={`absolute inset-0 flex items-center justify-center ${isDark ? "bg-udc-dark" : "bg-[#F0F1F3]"}`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-water-blue border-t-transparent rounded-full animate-spin" />
            <span className={`text-sm ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>Loading DC Map...</span>
          </div>
        </div>
      )}
    </div>
  );
}
