"use client";

import { useState } from "react";
import { Layers, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export interface MapLayerState {
  wardBoundaries: boolean;
  watershedBoundary: boolean;
  floodZones: boolean;
  imperviousSurfaces: boolean;
  monitoringStations: boolean;
  waterways: boolean;
}

interface MapLayerControlsProps {
  layers: MapLayerState;
  onLayerToggle: (layer: keyof MapLayerState) => void;
}

const LAYER_CONFIG: { key: keyof MapLayerState; label: string; color: string; group: string }[] = [
  { key: "waterways", label: "Rivers & Streams", color: "#3B82F6", group: "Base" },
  { key: "monitoringStations", label: "Monitoring Stations", color: "#22C55E", group: "Base" },
  { key: "wardBoundaries", label: "DC Ward Boundaries", color: "#FDB927", group: "Boundaries" },
  { key: "watershedBoundary", label: "Anacostia Watershed", color: "#06B6D4", group: "Boundaries" },
  { key: "floodZones", label: "FEMA Flood Zones", color: "#EF4444", group: "Overlays" },
  { key: "imperviousSurfaces", label: "Impervious Surfaces", color: "#8B5CF6", group: "Overlays" },
];

export default function MapLayerControls({ layers, onLayerToggle }: MapLayerControlsProps) {
  const [expanded, setExpanded] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const groups = [...new Set(LAYER_CONFIG.map(l => l.group))];

  return (
    <div className={`absolute top-3 right-3 z-[1000] ${expanded ? "w-[220px]" : ""}`}>
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg text-xs font-medium transition-colors ${
            isDark
              ? "bg-panel-bg/95 border-panel-border text-slate-300 hover:bg-panel-hover backdrop-blur-md"
              : "bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 backdrop-blur-md shadow-md"
          }`}
        >
          <Layers className="w-4 h-4" />
          Layers
        </button>
      ) : (
        <div className={`rounded-xl border shadow-xl text-xs ${
          isDark ? "bg-panel-bg/95 border-panel-border backdrop-blur-md" : "bg-white/95 border-slate-200 backdrop-blur-md shadow-lg"
        }`}>
          <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: isDark ? "#1E3A5F" : "#E2E8F0" }}>
            <div className="flex items-center gap-2">
              <Layers className={`w-4 h-4 ${isDark ? "text-slate-300" : "text-slate-500"}`} />
              <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Map Layers</span>
            </div>
            <button onClick={() => setExpanded(false)} className={`p-1 rounded hover:bg-opacity-20 ${isDark ? "hover:bg-white" : "hover:bg-slate-200"}`}>
              <ChevronUp className={`w-3.5 h-3.5 ${isDark ? "text-slate-300" : "text-slate-500"}`} />
            </button>
          </div>
          <div className="py-1.5">
            {groups.map((group) => (
              <div key={group}>
                <div className={`px-3 py-1 text-[9px] font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {group}
                </div>
                {LAYER_CONFIG.filter(l => l.group === group).map((layerDef) => {
                  const isOn = layers[layerDef.key];
                  return (
                    <button
                      key={layerDef.key}
                      onClick={() => onLayerToggle(layerDef.key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 transition-colors ${
                        isDark ? "hover:bg-panel-hover" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0" style={{
                        borderColor: isOn ? layerDef.color : isDark ? "#475569" : "#CBD5E1",
                        backgroundColor: isOn ? layerDef.color + "20" : "transparent",
                      }}>
                        {isOn && <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: layerDef.color }} />}
                      </div>
                      <span className={`flex-1 text-left ${
                        isOn
                          ? isDark ? "text-slate-200" : "text-slate-800"
                          : isDark ? "text-slate-400" : "text-slate-600"
                      }`}>
                        {layerDef.label}
                      </span>
                      {isOn
                        ? <Eye className="w-3 h-3" style={{ color: layerDef.color }} />
                        : <EyeOff className={`w-3 h-3 ${isDark ? "text-slate-500" : "text-slate-300"}`} />
                      }
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
