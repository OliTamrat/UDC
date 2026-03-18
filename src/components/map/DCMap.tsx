"use client";

import { useEffect, useState, useCallback } from "react";
import {
  anacostiaRiver,
  dcStreams,
  monitoringStations,
  type MonitoringStation,
} from "@/data/dc-waterways";
import {
  dcWardBoundaries,
  anacostiaWatershed,
  floodZones,
  imperviousZones,
} from "@/data/dc-boundaries";
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
  const rawEcoli = reading.eColiCount ?? 0;
  const ecoli = ecoliMultiplier ? rawEcoli * ecoliMultiplier : rawEcoli;
  if (ecoli > 1000) return "#EF4444";
  if (ecoli > 400) return "#F59E0B";
  return "#22C55E";
}

function getHealthColor(healthIndex: number): string {
  if (healthIndex >= 60) return "#22C55E";
  if (healthIndex >= 40) return "#F59E0B";
  return "#EF4444";
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
      center: [38.892, -76.970],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    // Theme-aware tiles
    const tileConfig = isDark ? TILE_LAYERS.dark : TILE_LAYERS.light;
    leaflet.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    const waterColor = "#2563EB";
    const waterColorLight = "#3B82F6";

    // =============================================
    // WATERSHED BOUNDARY
    // =============================================
    if (layers.watershedBoundary) {
      leaflet.polygon(anacostiaWatershed.coordinates, {
        color: "#06B6D4",
        weight: 2,
        opacity: 0.6,
        fillColor: "#06B6D4",
        fillOpacity: isDark ? 0.06 : 0.04,
        dashArray: "10 6",
      })
        .bindTooltip(`${anacostiaWatershed.name} (${anacostiaWatershed.area})`, { direction: "center" })
        .addTo(map);
    }

    // =============================================
    // WARD BOUNDARIES
    // =============================================
    if (layers.wardBoundaries) {
      const riskColors: Record<string, string> = { Low: "#22C55E", Medium: "#F59E0B", High: "#EF4444" };
      dcWardBoundaries.forEach((ward) => {
        const fillColor = riskColors[ward.floodRisk] || "#FDB927";
        leaflet.polygon(ward.coordinates, {
          color: "#FDB927",
          weight: 2,
          opacity: isDark ? 0.7 : 0.6,
          fillColor: fillColor,
          fillOpacity: isDark ? 0.08 : 0.06,
        })
          .bindTooltip(`Ward ${ward.ward}`, {
            permanent: true,
            direction: "center",
            className: "ward-label",
          })
          .bindPopup(`
            <div style="font-family:Inter,system-ui,sans-serif;min-width:180px;">
              <h3 style="font-weight:700;font-size:14px;color:${isDark ? "#F8FAFC" : "#1E293B"};margin:0 0 6px;">Ward ${ward.ward}</h3>
              <div style="display:grid;gap:4px;font-size:11px;color:${isDark ? "#94A3B8" : "#64748B"};">
                <div>Population: <strong style="color:${isDark ? "#E2E8F0" : "#334155"}">${ward.population != null ? ward.population.toLocaleString() : "N/A"}</strong></div>
                <div>Council: <strong style="color:${isDark ? "#E2E8F0" : "#334155"}">${ward.councilMember}</strong></div>
                <div>Flood Risk: <strong style="color:${riskColors[ward.floodRisk]}">${ward.floodRisk}</strong></div>
                <div>Impervious: <strong style="color:${isDark ? "#E2E8F0" : "#334155"}">${ward.impervious}%</strong></div>
              </div>
            </div>
          `, { maxWidth: 250, className: "station-popup" })
          .addTo(map);
      });
    }

    // =============================================
    // FLOOD ZONES
    // =============================================
    if (layers.floodZones) {
      floodZones.forEach((zone) => {
        const color = zone.riskLevel === "AE" ? "#EF4444" : "#F59E0B";
        leaflet.polygon(zone.coordinates, {
          color: color,
          weight: 1.5,
          opacity: 0.7,
          fillColor: color,
          fillOpacity: isDark ? 0.2 : 0.15,
          dashArray: zone.riskLevel === "AE" ? undefined : "4 4",
        })
          .bindTooltip(`${zone.name} (Zone ${zone.riskLevel})`, { direction: "top" })
          .addTo(map);
      });
    }

    // =============================================
    // IMPERVIOUS SURFACES
    // =============================================
    if (layers.imperviousSurfaces) {
      imperviousZones.forEach((zone) => {
        const opacity = zone.percentage / 100;
        leaflet.polygon(zone.coordinates, {
          color: "#8B5CF6",
          weight: 1.5,
          opacity: 0.6,
          fillColor: "#8B5CF6",
          fillOpacity: isDark ? opacity * 0.3 : opacity * 0.2,
        })
          .bindTooltip(`${zone.name} (${zone.percentage}% impervious)`, { direction: "top" })
          .addTo(map);
      });
    }

    // =============================================
    // WATERWAYS
    // =============================================
    if (layers.waterways) {
      // Anacostia River — multi-layer realistic rendering
      leaflet.polyline(anacostiaRiver.coordinates, {
        color: waterColor, weight: 28, opacity: isDark ? 0.08 : 0.06,
        smoothFactor: 1.5, lineCap: "round", lineJoin: "round",
      }).addTo(map);
      leaflet.polyline(anacostiaRiver.coordinates, {
        color: waterColorLight, weight: 16, opacity: isDark ? 0.15 : 0.1,
        smoothFactor: 1.5, lineCap: "round", lineJoin: "round",
      }).addTo(map);
      leaflet.polyline(anacostiaRiver.coordinates, {
        color: waterColor, weight: 6, opacity: 0.85,
        smoothFactor: 1.5, lineCap: "round", lineJoin: "round",
      }).addTo(map);
      leaflet.polyline(anacostiaRiver.coordinates, {
        color: "#60A5FA", weight: 2, opacity: isDark ? 0.5 : 0.35,
        smoothFactor: 1.5, lineCap: "round", lineJoin: "round",
      })
        .bindTooltip("Anacostia River", { permanent: false, direction: "top" })
        .addTo(map);

      // Potomac River
      const potomac = dcStreams.find(s => s.id === "potomac-river");
      if (potomac) {
        leaflet.polyline(potomac.coordinates, {
          color: waterColor, weight: 32, opacity: isDark ? 0.07 : 0.05,
          smoothFactor: 1.5, lineCap: "round", lineJoin: "round",
        }).addTo(map);
        leaflet.polyline(potomac.coordinates, {
          color: waterColorLight, weight: 18, opacity: isDark ? 0.12 : 0.08,
          smoothFactor: 1.5, lineCap: "round", lineJoin: "round",
        }).addTo(map);
        leaflet.polyline(potomac.coordinates, {
          color: waterColor, weight: 7, opacity: 0.8,
          smoothFactor: 1.5, lineCap: "round", lineJoin: "round",
        }).addTo(map);
        leaflet.polyline(potomac.coordinates, {
          color: "#60A5FA", weight: 2.5, opacity: isDark ? 0.45 : 0.3,
          smoothFactor: 1.5, lineCap: "round", lineJoin: "round",
        })
          .bindTooltip(`Potomac River (Health: ${potomac.healthIndex}/100)`, { direction: "top" })
          .addTo(map);
      }

      // Streams & tributaries
      dcStreams.forEach((stream) => {
        if (stream.id === "potomac-river") return;
        const healthColor = getHealthColor(stream.healthIndex);
        const baseWeight = stream.type === "river" ? 5 : 3;

        leaflet.polyline(stream.coordinates, {
          color: healthColor, weight: baseWeight + 8, opacity: isDark ? 0.08 : 0.05,
          smoothFactor: 1.5, lineCap: "round", lineJoin: "round",
        }).addTo(map);
        leaflet.polyline(stream.coordinates, {
          color: healthColor, weight: baseWeight, opacity: 0.75,
          smoothFactor: 1.5, lineCap: "round", lineJoin: "round",
        }).addTo(map);
        leaflet.polyline(stream.coordinates, {
          color: isDark ? "#93C5FD" : "#60A5FA", weight: 1, opacity: isDark ? 0.35 : 0.25,
          smoothFactor: 1.5, lineCap: "round", lineJoin: "round",
        })
          .bindTooltip(`${stream.name} (Health: ${stream.healthIndex}/100)`, { direction: "top" })
          .addTo(map);
      });
    }

    // =============================================
    // MONITORING STATIONS
    // =============================================
    if (layers.monitoringStations) {
      const popupBg = isDark ? "rgba(15, 29, 50, 0.95)" : "rgba(255, 255, 255, 0.98)";
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
    // UDC CAMPUS
    // =============================================
    const udcIcon = leaflet.divIcon({
      className: "udc-campus-marker",
      html: `<div style="background:linear-gradient(135deg,#FDB927,#CE1141);width:22px;height:22px;border-radius:4px;border:2px solid white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:8px;color:white;box-shadow:0 0 16px rgba(253,185,39,0.5),0 2px 8px rgba(0,0,0,0.3);">UDC</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    const popupText = isDark ? "#F8FAFC" : "#1E293B";
    const popupSecondary = isDark ? "#94A3B8" : "#64748B";
    leaflet.marker([38.9436, -77.0631], { icon: udcIcon })
      .bindPopup(`<div style="font-family:Inter,system-ui,sans-serif;"><h3 style="font-weight:700;font-size:14px;color:${popupText};margin:0 0 4px;">University of the District of Columbia</h3><p style="font-size:11px;color:${popupSecondary};margin:0 0 6px;">CAUSES / WRRI Research Hub</p><p style="font-size:11px;color:${isDark ? "#CBD5E1" : "#475569"};margin:0;">4200 Connecticut Ave NW, Washington, DC</p></div>`)
      .addTo(map);

    // DC Boundary — accurate outline from US Districts GeoJSON (119 points)
    // Traces NW diagonal → north vertex → NE diagonal → east vertex → SE diagonal → Potomac River
    const dcBoundary: [number, number][] = [
      // NW diagonal border (Maryland line)
      [38.93435, -77.119751], [38.935356, -77.118861], [38.949699, -77.099914],
      // North vertex of diamond
      [38.995548, -77.041018],
      // NE diagonal border
      [38.974781, -77.013763],
      // East vertex of diamond
      [38.892852, -76.909393],
      // South vertex → start of Potomac River border
      [38.791645, -77.039006],
      // Potomac River — western/southern border (detailed)
      [38.800496, -77.039191], [38.810527, -77.037288], [38.814635, -77.037343],
      [38.81609, -77.038412], [38.818885, -77.03912], [38.819504, -77.038923],
      [38.820254, -77.039972], [38.821656, -77.039496], [38.82209, -77.040758],
      [38.82294, -77.041107], [38.823604, -77.040618], [38.823751, -77.039769],
      [38.824473, -77.038784], [38.830138, -77.037755], [38.8321, -77.039116],
      [38.83371, -77.041889], [38.833332, -77.042579], [38.831484, -77.041984],
      [38.83119, -77.042805], [38.83143, -77.043207], [38.833361, -77.043774],
      [38.833819, -77.044442], [38.835928, -77.045218], [38.838476, -77.045273],
      [38.839894, -77.046513], [38.840148, -77.04587], [38.840632, -77.046736],
      [38.840655, -77.047489], [38.841259, -77.048025], [38.841183, -77.046146],
      [38.840214, -77.044739], [38.840198, -77.043904], [38.840558, -77.043406],
      [38.839795, -77.043065], [38.839516, -77.041784], [38.839248, -77.038935],
      [38.839405, -77.036804], [38.840101, -77.034593], [38.84281, -77.033902],
      [38.844549, -77.033066], [38.848016, -77.032267], [38.851672, -77.032211],
      [38.855027, -77.032843], [38.85768, -77.03417], [38.859749, -77.035387],
      [38.861111, -77.036805], [38.861265, -77.037585], [38.863293, -77.038082],
      [38.863241, -77.039738], [38.86269, -77.039858], [38.862375, -77.04037],
      [38.863236, -77.041725], [38.863372, -77.042763], [38.863945, -77.042452],
      [38.863684, -77.042505], [38.86366, -77.040787], [38.864284, -77.037924],
      [38.865106, -77.037735], [38.866664, -77.037998], [38.869732, -77.039464],
      [38.871441, -77.040684], [38.87411, -77.043334], [38.875613, -77.045869],
      [38.874958, -77.047219], [38.873966, -77.046394], [38.873046, -77.04654],
      [38.872455, -77.04624], [38.872057, -77.046517], [38.871314, -77.049154],
      [38.871647, -77.050155], [38.873906, -77.051682], [38.876564, -77.051531],
      [38.879006, -77.05354], [38.878876, -77.053751], [38.879712, -77.054141],
      [38.880342, -77.055581], [38.880262, -77.057931], [38.880914, -77.059141],
      [38.888956, -77.064251], [38.889598, -77.064409], [38.89019, -77.063773],
      [38.890944, -77.06399], [38.891715, -77.064643], [38.893557, -77.065133],
      [38.89453, -77.066005], [38.894833, -77.065905], [38.897161, -77.067224],
      [38.898094, -77.067595], [38.899229, -77.067572], [38.900288, -77.068641],
      [38.901195, -77.070657], [38.901123, -77.073373], [38.902368, -77.078248],
      [38.902274, -77.082656], [38.905767, -77.093216], [38.911916, -77.102032],
      [38.913281, -77.103415], [38.915923, -77.104134], [38.91763, -77.105587],
      [38.920026, -77.106801], [38.921636, -77.108513], [38.924657, -77.112659],
      [38.927376, -77.114903], [38.928165, -77.115957], [38.929631, -77.116466],
      // Close polygon back to start
      [38.93435, -77.119751],
    ];
    leaflet.polygon(dcBoundary, {
      color: "#FDB927", weight: 1.5, opacity: isDark ? 0.4 : 0.5,
      fillColor: "#FDB927", fillOpacity: isDark ? 0.02 : 0.03, dashArray: "6 4",
    }).addTo(map);

    // =============================================
    // LEGEND
    // =============================================
    const legendBg = isDark ? "rgba(15, 29, 50, 0.9)" : "rgba(255, 255, 255, 0.95)";
    const legendBorder = isDark ? "rgba(30, 58, 95, 0.5)" : "rgba(226, 232, 240, 0.8)";
    const legendText = isDark ? "#F8FAFC" : "#1E293B";
    const legendMuted = isDark ? "#94A3B8" : "#64748B";

    const isMobile = window.innerWidth < 640;
    const legend = new leaflet.Control({ position: "bottomright" });
    legend.onAdd = () => {
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "display:flex;flex-direction:column;align-items:flex-end;";

      const content = document.createElement("div");
      content.style.cssText = `background:${legendBg};backdrop-filter:blur(12px);border:1px solid ${legendBorder};border-radius:10px;padding:${isMobile ? "8px 10px" : "12px"};font-family:Inter,system-ui,sans-serif;color:${legendText};font-size:${isMobile ? "10px" : "11px"};min-width:${isMobile ? "140px" : "170px"};box-shadow:0 4px 12px rgba(0,0,0,${isDark ? "0.3" : "0.1"});max-height:${isMobile ? "50vh" : "none"};overflow-y:auto;display:${isMobile ? "none" : "block"};`;
      content.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:5px;">
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:24px;height:4px;background:linear-gradient(90deg,#2563EB,#60A5FA);border-radius:2px;"></div><span>Rivers</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:24px;height:3px;background:#22C55E;border-radius:2px;"></div><span style="color:${legendMuted}">Healthy (&ge;60)</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:24px;height:3px;background:#F59E0B;border-radius:2px;"></div><span style="color:${legendMuted}">Moderate (40-59)</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:24px;height:3px;background:#EF4444;border-radius:2px;"></div><span style="color:${legendMuted}">Poor (&lt;40)</span></div>
          <div style="border-top:1px solid ${legendBorder};padding-top:5px;margin-top:3px;"></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;background:#3B82F6;border-radius:50%;border:1.5px solid white;"></div><span>River Station</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;background:linear-gradient(135deg,#22C55E,#16A34A);border-radius:2px;border:1.5px solid white;transform:rotate(45deg);"></div><span>Green Infra.</span></div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;background:linear-gradient(135deg,#8B5CF6,#7C3AED);border-radius:2px;border:1.5px solid white;"></div><span>Stormwater</span></div>
          ${layers.floodZones ? `<div style="border-top:1px solid ${legendBorder};padding-top:5px;margin-top:3px;"></div><div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;background:#EF444433;border:1px solid #EF4444;border-radius:2px;"></div><span>Flood Zone</span></div>` : ""}
          ${layers.imperviousSurfaces ? `<div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;background:#8B5CF633;border:1px solid #8B5CF6;border-radius:2px;"></div><span>Impervious</span></div>` : ""}
          ${layers.watershedBoundary ? `<div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:8px;border:1.5px dashed #06B6D4;border-radius:2px;"></div><span>Watershed</span></div>` : ""}
        </div>
      `;

      // Toggle button for mobile — always-visible compact button
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

      // Prevent map interactions when touching legend
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
      isDark ? "border-panel-border" : "border-slate-200"
    }`}>
      <MapLayerControls layers={layers} onLayerToggle={handleLayerToggle} />
      <div id="dc-map" className="w-full h-full min-h-[500px]" />
      {!mapReady && (
        <div className={`absolute inset-0 flex items-center justify-center ${isDark ? "bg-udc-dark" : "bg-slate-50"}`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-water-blue border-t-transparent rounded-full animate-spin" />
            <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-500"}`}>Loading DC Map...</span>
          </div>
        </div>
      )}
    </div>
  );
}
