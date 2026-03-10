"use client";

import { useEffect, useState } from "react";
import {
  anacostiaRiver,
  dcStreams,
  monitoringStations,
  type MonitoringStation,
} from "@/data/dc-waterways";
import { useTheme } from "@/context/ThemeContext";

let L: typeof import("leaflet") | null = null;

function getStationColor(station: MonitoringStation): string {
  if (station.status === "offline") return "#6B7280";
  if (station.status === "maintenance") return "#F59E0B";
  if (station.type === "green-infrastructure") return "#22C55E";
  if (station.type === "stormwater") return "#8B5CF6";
  const reading = station.lastReading;
  if (!reading) return "#3B82F6";
  if (reading.eColiCount > 1000) return "#EF4444";
  if (reading.eColiCount > 400) return "#F59E0B";
  return "#22C55E";
}

function getHealthColor(healthIndex: number): string {
  if (healthIndex >= 60) return "#22C55E";
  if (healthIndex >= 40) return "#F59E0B";
  return "#EF4444";
}

// Tile layer configs for dark and light themes
const TILE_LAYERS = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
};

export default function DCMap({
  onStationSelect,
}: {
  onStationSelect?: (station: MonitoringStation | null) => void;
  selectedStation?: MonitoringStation | null;
}) {
  const [mapReady, setMapReady] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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

    // Clean up any existing map
    if ((container as HTMLElement & { _leaflet_id?: number })._leaflet_id) {
      (container as HTMLElement & { _leaflet_id?: number })._leaflet_id = undefined;
      container.innerHTML = "";
    }

    const map = leaflet.map("dc-map", {
      center: [38.895, -76.975],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    // Theme-aware tile layer
    const tileConfig = isDark ? TILE_LAYERS.dark : TILE_LAYERS.light;
    leaflet.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    // Colors adapt to theme
    const waterColor = "#2563EB";
    const waterColorLight = "#3B82F6";
    const riverWidth = 6;

    // =============================================
    // ANACOSTIA RIVER — realistic water rendering
    // =============================================

    // Layer 1: Wide ambient glow (water body presence)
    leaflet.polyline(anacostiaRiver.coordinates, {
      color: waterColor,
      weight: 28,
      opacity: isDark ? 0.08 : 0.06,
      smoothFactor: 1.5,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    // Layer 2: Medium glow (water surface reflection)
    leaflet.polyline(anacostiaRiver.coordinates, {
      color: waterColorLight,
      weight: 16,
      opacity: isDark ? 0.15 : 0.1,
      smoothFactor: 1.5,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    // Layer 3: Main river body
    leaflet.polyline(anacostiaRiver.coordinates, {
      color: waterColor,
      weight: riverWidth,
      opacity: 0.85,
      smoothFactor: 1.5,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    // Layer 4: Bright center highlight (water surface sheen)
    leaflet.polyline(anacostiaRiver.coordinates, {
      color: "#60A5FA",
      weight: 2,
      opacity: isDark ? 0.5 : 0.35,
      smoothFactor: 1.5,
      lineCap: "round",
      lineJoin: "round",
    })
      .bindTooltip("Anacostia River", {
        permanent: false,
        direction: "top",
      })
      .addTo(map);

    // =============================================
    // POTOMAC RIVER — wider, more prominent
    // =============================================
    const potomac = dcStreams.find(s => s.id === "potomac-river");
    if (potomac) {
      // Wide ambient glow
      leaflet.polyline(potomac.coordinates, {
        color: waterColor,
        weight: 32,
        opacity: isDark ? 0.07 : 0.05,
        smoothFactor: 1.5,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Medium glow
      leaflet.polyline(potomac.coordinates, {
        color: waterColorLight,
        weight: 18,
        opacity: isDark ? 0.12 : 0.08,
        smoothFactor: 1.5,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Main body
      leaflet.polyline(potomac.coordinates, {
        color: waterColor,
        weight: 7,
        opacity: 0.8,
        smoothFactor: 1.5,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Center highlight
      leaflet.polyline(potomac.coordinates, {
        color: "#60A5FA",
        weight: 2.5,
        opacity: isDark ? 0.45 : 0.3,
        smoothFactor: 1.5,
        lineCap: "round",
        lineJoin: "round",
      })
        .bindTooltip(`Potomac River (Health: ${potomac.healthIndex}/100)`, {
          permanent: false,
          direction: "top",
        })
        .addTo(map);
    }

    // =============================================
    // DC STREAMS & TRIBUTARIES — realistic styling
    // =============================================
    dcStreams.forEach((stream) => {
      if (stream.id === "potomac-river") return; // Already rendered above

      const healthColor = getHealthColor(stream.healthIndex);
      const isRiver = stream.type === "river";
      const baseWeight = isRiver ? 5 : 3;

      // Glow effect
      leaflet.polyline(stream.coordinates, {
        color: healthColor,
        weight: baseWeight + 8,
        opacity: isDark ? 0.08 : 0.05,
        smoothFactor: 1.5,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Stream body
      leaflet.polyline(stream.coordinates, {
        color: healthColor,
        weight: baseWeight,
        opacity: 0.75,
        smoothFactor: 1.5,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Center highlight for streams
      leaflet.polyline(stream.coordinates, {
        color: isDark ? "#93C5FD" : "#60A5FA",
        weight: 1,
        opacity: isDark ? 0.35 : 0.25,
        smoothFactor: 1.5,
        lineCap: "round",
        lineJoin: "round",
      })
        .bindTooltip(`${stream.name} (Health: ${stream.healthIndex}/100)`, {
          permanent: false,
          direction: "top",
        })
        .addTo(map);
    });

    // =============================================
    // MONITORING STATION MARKERS
    // =============================================
    const popupBg = isDark ? "rgba(15, 29, 50, 0.95)" : "rgba(255, 255, 255, 0.98)";
    const popupText = isDark ? "#F8FAFC" : "#1E293B";
    const popupSecondary = isDark ? "#94A3B8" : "#64748B";
    const popupMuted = isDark ? "#64748B" : "#94A3B8";
    const popupDataBg = isDark ? "rgba(10,22,40,0.5)" : "#F1F5F9";
    const popupDataLabel = isDark ? "#64748B" : "#94A3B8";

    monitoringStations.forEach((station) => {
      const color = getStationColor(station);
      const isGI = station.type === "green-infrastructure";
      const isSW = station.type === "stormwater";
      const size = station.type === "river" ? 12 : 10;

      // Custom icon - green infrastructure gets a leaf-like square icon
      let iconHtml: string;
      if (isGI) {
        iconHtml = `
          <div style="
            width: ${size + 4}px;
            height: ${size + 4}px;
            background: linear-gradient(135deg, #22C55E, #16A34A);
            border: 2px solid rgba(255,255,255,0.9);
            border-radius: 4px;
            box-shadow: 0 0 14px rgba(34,197,94,0.5), 0 0 6px rgba(34,197,94,0.3);
            position: relative;
            transform: rotate(45deg);
          ">
            ${station.status === "active" ? `
              <div style="
                position: absolute;
                width: ${size + 14}px;
                height: ${size + 14}px;
                border-radius: 4px;
                border: 2px solid #22C55E;
                top: -7px;
                left: -7px;
                animation: pulse-ring 2.5s ease-out infinite;
                opacity: 0.5;
              "></div>
            ` : ""}
          </div>
        `;
      } else if (isSW) {
        iconHtml = `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: linear-gradient(135deg, #8B5CF6, #7C3AED);
            border: 2px solid rgba(255,255,255,0.8);
            border-radius: 3px;
            box-shadow: 0 0 12px ${color}80, 0 0 4px ${color}40;
            position: relative;
          ">
            ${station.status === "active" ? `
              <div style="
                position: absolute;
                width: ${size + 8}px;
                height: ${size + 8}px;
                border-radius: 3px;
                border: 2px solid ${color};
                top: -6px;
                left: -6px;
                animation: pulse-ring 2s ease-out infinite;
                opacity: 0.6;
              "></div>
            ` : ""}
          </div>
        `;
      } else {
        iconHtml = `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border: 2px solid rgba(255,255,255,0.8);
            border-radius: 50%;
            box-shadow: 0 0 12px ${color}80, 0 0 4px ${color}40;
            position: relative;
          ">
            ${station.status === "active" ? `
              <div style="
                position: absolute;
                width: ${size + 8}px;
                height: ${size + 8}px;
                border-radius: 50%;
                border: 2px solid ${color};
                top: -6px;
                left: -6px;
                animation: pulse-ring 2s ease-out infinite;
                opacity: 0.6;
              "></div>
            ` : ""}
          </div>
        `;
      }

      const icon = leaflet.divIcon({
        className: "custom-station-marker",
        html: iconHtml,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = leaflet.marker(station.position, { icon }).addTo(map);

      // Popup content
      const reading = station.lastReading;
      const statusColor = station.status === "active" ? "#22C55E" : station.status === "maintenance" ? "#F59E0B" : "#6B7280";

      let popupHtml = `
        <div style="min-width:260px;font-family:Inter,system-ui,sans-serif;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <h3 style="font-weight:600;font-size:13px;color:${popupText};margin:0;">${station.name}</h3>
            <span style="font-size:11px;font-weight:500;color:${statusColor};text-transform:capitalize;">${station.status}</span>
          </div>
          <div style="font-size:11px;color:${popupSecondary};margin-bottom:8px;">
            ID: ${station.id} | Type: ${station.type.replace("-", " ")}
          </div>
      `;

      if (reading) {
        const ecoliColor = reading.eColiCount > 400 ? "#F87171" : "#4ADE80";
        popupHtml += `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <div style="background:${popupDataBg};border-radius:6px;padding:6px;">
              <div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">Temp</div>
              <div style="font-size:13px;font-weight:600;color:#22D3EE;">${reading.temperature}°C</div>
            </div>
            <div style="background:${popupDataBg};border-radius:6px;padding:6px;">
              <div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">DO</div>
              <div style="font-size:13px;font-weight:600;color:#60A5FA;">${reading.dissolvedOxygen} mg/L</div>
            </div>
            <div style="background:${popupDataBg};border-radius:6px;padding:6px;">
              <div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">pH</div>
              <div style="font-size:13px;font-weight:600;color:#4ADE80;">${reading.pH}</div>
            </div>
            <div style="background:${popupDataBg};border-radius:6px;padding:6px;">
              <div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">Turbidity</div>
              <div style="font-size:13px;font-weight:600;color:#FBBF24;">${reading.turbidity} NTU</div>
            </div>
            <div style="background:${popupDataBg};border-radius:6px;padding:6px;grid-column:span 2;">
              <div style="font-size:9px;color:${popupDataLabel};text-transform:uppercase;">E. coli</div>
              <div style="font-size:13px;font-weight:600;color:${ecoliColor};">
                ${reading.eColiCount.toLocaleString()} CFU/100mL
              </div>
            </div>
          </div>
          <div style="margin-top:6px;font-size:10px;color:${popupMuted};">
            Last updated: ${new Date(reading.timestamp).toLocaleString()}
          </div>
        `;
      }

      popupHtml += `</div>`;
      marker.bindPopup(popupHtml, { maxWidth: 300, className: "station-popup" });
      marker.on("click", () => onStationSelect?.(station));
    });

    // =============================================
    // UDC CAMPUS MARKER
    // =============================================
    const udcIcon = leaflet.divIcon({
      className: "udc-campus-marker",
      html: `
        <div style="
          background: linear-gradient(135deg, #FDB927, #CE1141);
          width: 22px;
          height: 22px;
          border-radius: 4px;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 8px;
          color: white;
          box-shadow: 0 0 16px rgba(253,185,39,0.5), 0 2px 8px rgba(0,0,0,0.3);
        ">UDC</div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    leaflet.marker([38.9435, -77.0230], { icon: udcIcon })
      .bindPopup(`
        <div style="font-family:Inter,system-ui,sans-serif;">
          <h3 style="font-weight:700;font-size:14px;color:${popupText};margin:0 0 4px 0;">University of the District of Columbia</h3>
          <p style="font-size:11px;color:${popupSecondary};margin:0 0 6px 0;">CAUSES / WRRI Research Hub</p>
          <p style="font-size:11px;color:${isDark ? "#CBD5E1" : "#475569"};margin:0;">4200 Connecticut Ave NW, Washington, DC</p>
        </div>
      `)
      .addTo(map);

    // =============================================
    // DC BOUNDARY
    // =============================================
    const dcBoundary: [number, number][] = [
      [38.9955, -77.0415], [38.9940, -76.9095], [38.8275, -76.9115],
      [38.7920, -77.0405], [38.8345, -77.0405], [38.9340, -77.0420], [38.9955, -77.0415],
    ];

    leaflet.polygon(dcBoundary, {
      color: "#FDB927",
      weight: 1.5,
      opacity: isDark ? 0.4 : 0.5,
      fillColor: "#FDB927",
      fillOpacity: isDark ? 0.02 : 0.03,
      dashArray: "6 4",
    }).addTo(map);

    // =============================================
    // LEGEND
    // =============================================
    const legendBg = isDark ? "rgba(15, 29, 50, 0.9)" : "rgba(255, 255, 255, 0.95)";
    const legendBorder = isDark ? "rgba(30, 58, 95, 0.5)" : "rgba(226, 232, 240, 0.8)";
    const legendText = isDark ? "#F8FAFC" : "#1E293B";
    const legendMuted = isDark ? "#94A3B8" : "#64748B";
    const legendSep = isDark ? "rgba(30,58,95,0.5)" : "rgba(226,232,240,0.8)";

    const legend = new leaflet.Control({ position: "bottomright" });
    legend.onAdd = () => {
      const div = document.createElement("div");
      div.style.cssText = `
        background: ${legendBg};
        backdrop-filter: blur(12px);
        border: 1px solid ${legendBorder};
        border-radius: 10px;
        padding: 12px;
        font-family: Inter, system-ui, sans-serif;
        color: ${legendText};
        font-size: 11px;
        min-width: 170px;
        box-shadow: 0 4px 12px rgba(0,0,0,${isDark ? "0.3" : "0.1"});
      `;
      div.innerHTML = `
        <div style="font-weight:600;margin-bottom:8px;font-size:12px;">Map Legend</div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:24px;height:4px;background:linear-gradient(90deg, #2563EB, #60A5FA);border-radius:2px;"></div>
            <span>Anacostia River</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:24px;height:4px;background:linear-gradient(90deg, #2563EB, #60A5FA);border-radius:2px;"></div>
            <span>Potomac River</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:24px;height:3px;background:#22C55E;border-radius:2px;"></div>
            <span style="color:${legendMuted};">Healthy Stream (&ge;60)</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:24px;height:3px;background:#F59E0B;border-radius:2px;"></div>
            <span style="color:${legendMuted};">Moderate (40-59)</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:24px;height:3px;background:#EF4444;border-radius:2px;"></div>
            <span style="color:${legendMuted};">Poor Health (&lt;40)</span>
          </div>
          <div style="border-top:1px solid ${legendSep};padding-top:5px;margin-top:3px;"></div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:8px;height:8px;background:#3B82F6;border-radius:50%;border:1.5px solid white;box-shadow:0 0 4px rgba(59,130,246,0.4);"></div>
            <span>River Station</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:8px;height:8px;background:linear-gradient(135deg,#22C55E,#16A34A);border-radius:2px;border:1.5px solid white;transform:rotate(45deg);box-shadow:0 0 4px rgba(34,197,94,0.4);"></div>
            <span>Green Infrastructure</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:8px;height:8px;background:linear-gradient(135deg,#8B5CF6,#7C3AED);border-radius:2px;border:1.5px solid white;box-shadow:0 0 4px rgba(139,92,246,0.4);"></div>
            <span>Stormwater BMP</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:22px;height:10px;background:linear-gradient(135deg,#FDB927,#CE1141);border-radius:2px;border:1px solid white;font-size:5px;color:white;font-weight:800;text-align:center;line-height:10px;">UDC</div>
            <span>UDC Campus</span>
          </div>
        </div>
      `;
      return div;
    };
    legend.addTo(map);

    return () => { map.remove(); };
  }, [mapReady, onStationSelect, isDark]);

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden border transition-colors duration-300 ${
      isDark ? "border-panel-border" : "border-slate-200"
    }`}>
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
