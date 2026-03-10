"use client";

import { useEffect, useState } from "react";
import {
  anacostiaRiver,
  dcStreams,
  monitoringStations,
  type MonitoringStation,
} from "@/data/dc-waterways";

// Dynamic import to avoid SSR issues with Leaflet
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

function StationPopupContent({ station }: { station: MonitoringStation }) {
  const reading = station.lastReading;
  const statusColor =
    station.status === "active" ? "text-green-400" : station.status === "maintenance" ? "text-yellow-400" : "text-gray-400";

  return (
    <div className="min-w-[260px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-white">{station.name}</h3>
        <span className={`text-xs font-medium ${statusColor} capitalize`}>
          {station.status}
        </span>
      </div>
      <div className="text-xs text-slate-400 mb-2">
        ID: {station.id} | Type: {station.type.replace("-", " ")}
      </div>
      {reading && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-udc-dark/50 rounded-md p-2">
            <div className="text-[10px] text-slate-500 uppercase">Temp</div>
            <div className="text-sm font-semibold text-cyan-400">{reading.temperature}°C</div>
          </div>
          <div className="bg-udc-dark/50 rounded-md p-2">
            <div className="text-[10px] text-slate-500 uppercase">DO</div>
            <div className="text-sm font-semibold text-blue-400">{reading.dissolvedOxygen} mg/L</div>
          </div>
          <div className="bg-udc-dark/50 rounded-md p-2">
            <div className="text-[10px] text-slate-500 uppercase">pH</div>
            <div className="text-sm font-semibold text-green-400">{reading.pH}</div>
          </div>
          <div className="bg-udc-dark/50 rounded-md p-2">
            <div className="text-[10px] text-slate-500 uppercase">Turbidity</div>
            <div className="text-sm font-semibold text-amber-400">{reading.turbidity} NTU</div>
          </div>
          <div className="bg-udc-dark/50 rounded-md p-2 col-span-2">
            <div className="text-[10px] text-slate-500 uppercase">E. coli</div>
            <div className={`text-sm font-semibold ${reading.eColiCount > 400 ? "text-red-400" : "text-green-400"}`}>
              {reading.eColiCount.toLocaleString()} CFU/100mL
            </div>
          </div>
        </div>
      )}
      <div className="mt-2 text-[10px] text-slate-500">
        Last updated: {reading ? new Date(reading.timestamp).toLocaleString() : "N/A"}
      </div>
    </div>
  );
}

export default function DCMap({
  onStationSelect,
  selectedStation,
}: {
  onStationSelect?: (station: MonitoringStation | null) => void;
  selectedStation?: MonitoringStation | null;
}) {
  const [mapReady, setMapReady] = useState(false);

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

    // Check if map already exists
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

    // Dark-themed map tiles
    leaflet.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    // Draw Anacostia River
    leaflet.polyline(anacostiaRiver.coordinates, {
      color: "#3B82F6",
      weight: 5,
      opacity: 0.9,
      smoothFactor: 1.5,
    })
      .bindTooltip("Anacostia River", {
        permanent: false,
        className: "river-tooltip",
        direction: "top",
      })
      .addTo(map);

    // Add glow effect for Anacostia
    leaflet.polyline(anacostiaRiver.coordinates, {
      color: "#3B82F6",
      weight: 12,
      opacity: 0.15,
      smoothFactor: 1.5,
    }).addTo(map);

    // Draw DC streams and tributaries
    dcStreams.forEach((stream) => {
      const color = getHealthColor(stream.healthIndex);
      leaflet.polyline(stream.coordinates, {
        color,
        weight: stream.type === "river" ? 4 : 3,
        opacity: 0.8,
        smoothFactor: 1.5,
        dashArray: stream.type === "stream" ? "8 4" : undefined,
      })
        .bindTooltip(`${stream.name} (Health: ${stream.healthIndex}/100)`, {
          permanent: false,
          direction: "top",
        })
        .addTo(map);

      // Add glow effect
      leaflet.polyline(stream.coordinates, {
        color,
        weight: 10,
        opacity: 0.1,
        smoothFactor: 1.5,
      }).addTo(map);
    });

    // Add monitoring station markers
    monitoringStations.forEach((station) => {
      const color = getStationColor(station);
      const size = station.type === "river" ? 12 : 10;

      const icon = leaflet.divIcon({
        className: "custom-station-marker",
        html: `
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
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = leaflet.marker(station.position, { icon }).addTo(map);

      // Create popup content
      const reading = station.lastReading;
      const statusColor = station.status === "active" ? "#22C55E" : station.status === "maintenance" ? "#F59E0B" : "#6B7280";

      let popupHtml = `
        <div style="min-width:260px;font-family:Inter,system-ui,sans-serif;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <h3 style="font-weight:600;font-size:13px;color:white;margin:0;">${station.name}</h3>
            <span style="font-size:11px;font-weight:500;color:${statusColor};text-transform:capitalize;">${station.status}</span>
          </div>
          <div style="font-size:11px;color:#94A3B8;margin-bottom:8px;">
            ID: ${station.id} | Type: ${station.type.replace("-", " ")}
          </div>
      `;

      if (reading) {
        const ecoliColor = reading.eColiCount > 400 ? "#F87171" : "#4ADE80";
        popupHtml += `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <div style="background:rgba(10,22,40,0.5);border-radius:6px;padding:6px;">
              <div style="font-size:9px;color:#64748B;text-transform:uppercase;">Temp</div>
              <div style="font-size:13px;font-weight:600;color:#22D3EE;">${reading.temperature}°C</div>
            </div>
            <div style="background:rgba(10,22,40,0.5);border-radius:6px;padding:6px;">
              <div style="font-size:9px;color:#64748B;text-transform:uppercase;">DO</div>
              <div style="font-size:13px;font-weight:600;color:#60A5FA;">${reading.dissolvedOxygen} mg/L</div>
            </div>
            <div style="background:rgba(10,22,40,0.5);border-radius:6px;padding:6px;">
              <div style="font-size:9px;color:#64748B;text-transform:uppercase;">pH</div>
              <div style="font-size:13px;font-weight:600;color:#4ADE80;">${reading.pH}</div>
            </div>
            <div style="background:rgba(10,22,40,0.5);border-radius:6px;padding:6px;">
              <div style="font-size:9px;color:#64748B;text-transform:uppercase;">Turbidity</div>
              <div style="font-size:13px;font-weight:600;color:#FBBF24;">${reading.turbidity} NTU</div>
            </div>
            <div style="background:rgba(10,22,40,0.5);border-radius:6px;padding:6px;grid-column:span 2;">
              <div style="font-size:9px;color:#64748B;text-transform:uppercase;">E. coli</div>
              <div style="font-size:13px;font-weight:600;color:${ecoliColor};">
                ${reading.eColiCount.toLocaleString()} CFU/100mL
              </div>
            </div>
          </div>
          <div style="margin-top:6px;font-size:10px;color:#64748B;">
            Last updated: ${new Date(reading.timestamp).toLocaleString()}
          </div>
        `;
      }

      popupHtml += `</div>`;

      marker.bindPopup(popupHtml, { maxWidth: 300, className: "station-popup" });

      marker.on("click", () => {
        onStationSelect?.(station);
      });
    });

    // Add UDC campus marker
    const udcIcon = leaflet.divIcon({
      className: "udc-campus-marker",
      html: `
        <div style="
          background: linear-gradient(135deg, #FDB927, #CE1141);
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 8px;
          color: white;
          box-shadow: 0 0 16px rgba(253,185,39,0.4);
        ">UDC</div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    leaflet.marker([38.9435, -77.0230], { icon: udcIcon })
      .bindPopup(`
        <div style="font-family:Inter,system-ui,sans-serif;">
          <h3 style="font-weight:700;font-size:14px;color:white;margin:0 0 4px 0;">University of the District of Columbia</h3>
          <p style="font-size:11px;color:#94A3B8;margin:0 0 6px 0;">CAUSES / WRRI Research Hub</p>
          <p style="font-size:11px;color:#CBD5E1;margin:0;">4200 Connecticut Ave NW, Washington, DC</p>
        </div>
      `)
      .addTo(map);

    // Add DC boundary approximate outline
    const dcBoundary: [number, number][] = [
      [38.9955, -77.0415],
      [38.9940, -76.9095],
      [38.8275, -76.9115],
      [38.7920, -77.0405],
      [38.8345, -77.0405],
      [38.9340, -77.0420],
      [38.9955, -77.0415],
    ];

    leaflet.polygon(dcBoundary, {
      color: "#FDB927",
      weight: 1.5,
      opacity: 0.4,
      fillColor: "#FDB927",
      fillOpacity: 0.02,
      dashArray: "6 4",
    }).addTo(map);

    // Legend
    const legend = new leaflet.Control({ position: "bottomright" });
    legend.onAdd = () => {
      const div = document.createElement("div");
      div.style.cssText = `
        background: rgba(15, 29, 50, 0.9);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(30, 58, 95, 0.5);
        border-radius: 10px;
        padding: 12px;
        font-family: Inter, system-ui, sans-serif;
        color: #F8FAFC;
        font-size: 11px;
        min-width: 160px;
      `;
      div.innerHTML = `
        <div style="font-weight:600;margin-bottom:8px;font-size:12px;">Map Legend</div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:24px;height:3px;background:#3B82F6;border-radius:2px;"></div>
            <span>Anacostia River</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:24px;height:3px;background:#22C55E;border-radius:2px;"></div>
            <span>Healthy Stream</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:24px;height:3px;background:#F59E0B;border-radius:2px;"></div>
            <span>Moderate Health</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:24px;height:3px;background:#EF4444;border-radius:2px;"></div>
            <span>Poor Health</span>
          </div>
          <div style="border-top:1px solid rgba(30,58,95,0.5);padding-top:5px;margin-top:3px;"></div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:8px;height:8px;background:#3B82F6;border-radius:50%;border:1.5px solid white;"></div>
            <span>River Station</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:8px;height:8px;background:#22C55E;border-radius:50%;border:1.5px solid white;"></div>
            <span>Green Infrastructure</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:8px;height:8px;background:#8B5CF6;border-radius:50%;border:1.5px solid white;"></div>
            <span>Stormwater BMP</span>
          </div>
        </div>
      `;
      return div;
    };
    legend.addTo(map);

    return () => {
      map.remove();
    };
  }, [mapReady, onStationSelect]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-panel-border">
      <div id="dc-map" className="w-full h-full min-h-[500px]" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-udc-dark">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-water-blue border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Loading DC Map...</span>
          </div>
        </div>
      )}
    </div>
  );
}
