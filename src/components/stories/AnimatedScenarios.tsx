"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, SkipBack, AlertTriangle, Activity, Timer, Zap } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { StoryCard, FadeIn } from "./ScrollySection";

/**
 * Sprint 4: Animated Scenarios — Timeline playback showing pollution events
 * over 24 hours with synchronized station markers and multi-parameter charts.
 *
 * Features:
 *   - Play/pause/scrub timeline controller
 *   - SVG river map with color-changing station markers
 *   - Synchronized line charts for turbidity, DO, pH
 *   - Auto-detected pollution spike annotations
 */

// ---------------------------------------------------------------------------
// Data: Simulated 24-hour scenario data for 4 active stations
// Based on real USGS patterns for the Anacostia watershed
// ---------------------------------------------------------------------------

interface TimePoint {
  hour: number;
  label: string;
  stations: Record<string, StationReading>;
  event?: string;
}

interface StationReading {
  turbidity: number;
  dissolvedOxygen: number;
  ph: number;
  conductivity: number;
}

interface StationMeta {
  id: string;
  name: string;
  short: string;
  x: number;
  y: number;
  type: "tributary" | "main" | "tidal";
}

const STATIONS_META: StationMeta[] = [
  { id: "ANA-002", name: "NE Branch at Riverdale", short: "Riverdale", x: 100, y: 60, type: "tributary" },
  { id: "ANA-003", name: "Anacostia at Buzzard Point", short: "Buzzard Pt", x: 500, y: 150, type: "tidal" },
  { id: "WB-001", name: "Watts Branch", short: "Watts Br", x: 300, y: 40, type: "tributary" },
  { id: "HR-001", name: "Hickey Run", short: "Hickey Run", x: 350, y: 130, type: "tributary" },
];

// 24-hour scenario: calm morning → afternoon storm → CSO event → recovery
function generateScenarioData(): TimePoint[] {
  const points: TimePoint[] = [];

  for (let h = 0; h < 24; h++) {
    const label = `${h.toString().padStart(2, "0")}:00`;
    const stations: Record<string, StationReading> = {};

    // Storm ramps up 12:00-15:00, peaks 14:00-16:00, CSO at 15:00-17:00
    const stormIntensity = h >= 12 && h <= 18 ? Math.sin(((h - 12) / 6) * Math.PI) : 0;
    const csoActive = h >= 15 && h <= 17;
    const recovery = h >= 18 ? (h - 18) / 6 : 0;

    // ANA-002 (Riverdale) - upstream, first to see storm runoff
    const anaDelay = Math.max(0, stormIntensity - 0.1);
    stations["ANA-002"] = {
      turbidity: 12 + anaDelay * 60 + (csoActive ? 30 : 0) - recovery * 40,
      dissolvedOxygen: 8.5 - anaDelay * 3 - (csoActive ? 1.5 : 0) + recovery * 2,
      ph: 7.2 - anaDelay * 0.3 + recovery * 0.15,
      conductivity: 350 + anaDelay * 200 + (csoActive ? 150 : 0) - recovery * 100,
    };

    // WB-001 (Watts Branch) - small urban stream, most responsive
    stations["WB-001"] = {
      turbidity: 15 + stormIntensity * 120 + (csoActive ? 80 : 0) - recovery * 60,
      dissolvedOxygen: 7.0 - stormIntensity * 4 - (csoActive ? 2 : 0) + recovery * 2.5,
      ph: 7.0 - stormIntensity * 0.5 + recovery * 0.2,
      conductivity: 400 + stormIntensity * 350 + (csoActive ? 200 : 0) - recovery * 150,
    };

    // HR-001 (Hickey Run) - also urban, slightly less responsive
    stations["HR-001"] = {
      turbidity: 14 + stormIntensity * 90 + (csoActive ? 50 : 0) - recovery * 45,
      dissolvedOxygen: 7.5 - stormIntensity * 3.5 - (csoActive ? 1 : 0) + recovery * 2,
      ph: 7.1 - stormIntensity * 0.4 + recovery * 0.2,
      conductivity: 380 + stormIntensity * 280 + (csoActive ? 180 : 0) - recovery * 120,
    };

    // ANA-003 (Buzzard Point) - tidal, delayed response, dilution effect
    const tidalDelay = h >= 14 ? Math.sin(((Math.min(h, 20) - 14) / 6) * Math.PI) * 0.7 : 0;
    stations["ANA-003"] = {
      turbidity: 20 + tidalDelay * 50 + (h >= 17 && h <= 19 ? 25 : 0) - (h >= 20 ? (h - 20) / 4 * 20 : 0),
      dissolvedOxygen: 6.5 - tidalDelay * 2 + (h >= 20 ? (h - 20) / 4 : 0),
      ph: 7.4 - tidalDelay * 0.2,
      conductivity: 500 + tidalDelay * 150 + (h >= 17 ? 80 : 0) - (h >= 20 ? (h - 20) / 4 * 60 : 0),
    };

    // Clamp values to valid ranges
    for (const st of Object.values(stations)) {
      st.turbidity = Math.max(5, Math.round(st.turbidity * 10) / 10);
      st.dissolvedOxygen = Math.max(1, Math.min(12, Math.round(st.dissolvedOxygen * 10) / 10));
      st.ph = Math.max(6, Math.min(9, Math.round(st.ph * 100) / 100));
      st.conductivity = Math.max(100, Math.round(st.conductivity));
    }

    let event: string | undefined;
    if (h === 12) event = "Storm begins";
    else if (h === 14) event = "Peak rainfall";
    else if (h === 15) event = "CSO overflow activated";
    else if (h === 17) event = "CSO ends";
    else if (h === 20) event = "Recovery begins";

    points.push({ hour: h, label, stations, event });
  }
  return points;
}

const SCENARIO_DATA = generateScenarioData();

// ---------------------------------------------------------------------------
// Pollution spike detection
// ---------------------------------------------------------------------------

interface Spike {
  hour: number;
  station: string;
  parameter: string;
  value: number;
  severity: "warning" | "danger";
}

function detectSpikes(): Spike[] {
  const spikes: Spike[] = [];
  const thresholds = {
    turbidity: { warning: 50, danger: 100 },
    dissolvedOxygen: { warning: 5, danger: 3 }, // inverted — low is bad
  };

  for (const point of SCENARIO_DATA) {
    for (const [stId, reading] of Object.entries(point.stations)) {
      if (reading.turbidity > thresholds.turbidity.danger) {
        spikes.push({ hour: point.hour, station: stId, parameter: "Turbidity", value: reading.turbidity, severity: "danger" });
      } else if (reading.turbidity > thresholds.turbidity.warning) {
        spikes.push({ hour: point.hour, station: stId, parameter: "Turbidity", value: reading.turbidity, severity: "warning" });
      }
      if (reading.dissolvedOxygen < thresholds.dissolvedOxygen.danger) {
        spikes.push({ hour: point.hour, station: stId, parameter: "Dissolved Oxygen", value: reading.dissolvedOxygen, severity: "danger" });
      } else if (reading.dissolvedOxygen < thresholds.dissolvedOxygen.warning) {
        spikes.push({ hour: point.hour, station: stId, parameter: "Dissolved Oxygen", value: reading.dissolvedOxygen, severity: "warning" });
      }
    }
  }
  return spikes;
}

const ALL_SPIKES = detectSpikes();

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function turbidityColor(ntu: number): string {
  if (ntu > 100) return "#ef4444"; // red
  if (ntu > 50) return "#f97316";  // orange
  if (ntu > 25) return "#eab308";  // yellow
  return "#22c55e";                // green
}

function doColor(mgL: number): string {
  if (mgL < 3) return "#ef4444";
  if (mgL < 5) return "#f97316";
  if (mgL < 6.5) return "#eab308";
  return "#22c55e";
}

// ---------------------------------------------------------------------------
// Timeline Player Control
// ---------------------------------------------------------------------------

function TimelinePlayer({
  currentHour,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  onStepForward,
  onStepBack,
  events,
  spikesAtHour,
  isDark,
}: {
  currentHour: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (hour: number) => void;
  onStepForward: () => void;
  onStepBack: () => void;
  events: { hour: number; label: string }[];
  spikesAtHour: Spike[];
  isDark: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleTrackClick = (e: React.MouseEvent) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(Math.round(pct * 23));
  };

  return (
    <div className={`rounded-xl border p-4 ${isDark ? "bg-panel-bg border-panel-border" : "bg-slate-50 border-slate-200"}`}>
      {/* Controls row */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onStepBack}
          aria-label="Step back"
          className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-200 text-slate-500"}`}
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={isPlaying ? onPause : onPlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="p-2 rounded-full bg-water-blue hover:bg-blue-600 text-white transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          onClick={onStepForward}
          aria-label="Step forward"
          className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-200 text-slate-500"}`}
        >
          <SkipForward className="w-4 h-4" />
        </button>
        <span className={`text-lg font-mono font-bold ml-2 ${isDark ? "text-white" : "text-slate-900"}`}>
          {currentHour.toString().padStart(2, "0")}:00
        </span>
        <div className="flex-1" />
        {spikesAtHour.length > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium text-red-400 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            {spikesAtHour.length} alert{spikesAtHour.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Scrub track */}
      <div
        ref={trackRef}
        className={`relative h-8 rounded-lg cursor-pointer ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
        onClick={handleTrackClick}
      >
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-lg bg-water-blue/30 transition-all duration-300"
          style={{ width: `${(currentHour / 23) * 100}%` }}
        />

        {/* Event markers */}
        {events.map((ev) => (
          <div
            key={ev.hour}
            className="absolute top-0 w-0.5 h-full bg-amber-400/60"
            style={{ left: `${(ev.hour / 23) * 100}%` }}
            title={ev.label}
          />
        ))}

        {/* Spike markers */}
        {ALL_SPIKES.filter((s) => s.severity === "danger").map((sp, i) => (
          <div
            key={`spike-${i}`}
            className="absolute bottom-0 w-1 h-2 rounded-t bg-red-500/70"
            style={{ left: `${(sp.hour / 23) * 100}%` }}
          />
        ))}

        {/* Playhead */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-water-blue border-2 border-white shadow-lg transition-all duration-300"
          style={{ left: `${(currentHour / 23) * 100}%` }}
        />

        {/* Hour labels */}
        <div className="absolute -bottom-5 left-0 right-0 flex justify-between px-1">
          {[0, 6, 12, 18, 23].map((h) => (
            <span key={h} className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {h.toString().padStart(2, "0")}:00
            </span>
          ))}
        </div>
      </div>

      {/* Current event */}
      {SCENARIO_DATA[currentHour]?.event && (
        <div className={`mt-6 text-xs font-medium flex items-center gap-1.5 ${isDark ? "text-amber-400" : "text-amber-600"}`}>
          <Zap className="w-3.5 h-3.5" />
          {SCENARIO_DATA[currentHour].event}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// River Map with Animated Markers
// ---------------------------------------------------------------------------

function AnimatedRiverMap({
  currentHour,
  isDark,
  selectedParam,
}: {
  currentHour: number;
  isDark: boolean;
  selectedParam: "turbidity" | "dissolvedOxygen";
}) {
  const data = SCENARIO_DATA[currentHour];
  if (!data) return null;

  const riverPath = "M 30,80 C 80,30 150,70 220,60 C 290,50 340,100 400,90 C 460,80 520,140 560,155";
  const tribWB = "M 260,10 C 280,25 300,35 310,50";
  const tribHR = "M 320,170 C 330,155 340,140 350,130";

  return (
    <div className={`rounded-xl border overflow-hidden ${isDark ? "bg-slate-900/50 border-panel-border" : "bg-blue-50/50 border-slate-200"}`}>
      <svg viewBox="0 0 600 200" className="w-full h-auto" role="img" aria-label="Animated river map showing station water quality">
        {/* Water background gradient */}
        <defs>
          <linearGradient id="riverGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isDark ? "#1e3a5f" : "#93c5fd"} stopOpacity="0.4" />
            <stop offset="100%" stopColor={isDark ? "#1e3a5f" : "#60a5fa"} stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* River paths */}
        <path d={riverPath} fill="none" stroke="url(#riverGrad)" strokeWidth="18" strokeLinecap="round" />
        <path d={riverPath} fill="none" stroke={isDark ? "#3b82f6" : "#2563eb"} strokeWidth="3" strokeLinecap="round" opacity="0.3" />
        <path d={tribWB} fill="none" stroke="url(#riverGrad)" strokeWidth="8" strokeLinecap="round" />
        <path d={tribHR} fill="none" stroke="url(#riverGrad)" strokeWidth="8" strokeLinecap="round" />

        {/* Flow direction arrows */}
        <text x="150" y="75" fill={isDark ? "#64748b" : "#94a3b8"} fontSize="10" textAnchor="middle" opacity="0.5">→</text>
        <text x="350" y="95" fill={isDark ? "#64748b" : "#94a3b8"} fontSize="10" textAnchor="middle" opacity="0.5">→</text>
        <text x="500" y="150" fill={isDark ? "#64748b" : "#94a3b8"} fontSize="10" textAnchor="middle" opacity="0.5">→</text>

        {/* Station markers */}
        {STATIONS_META.map((st) => {
          const reading = data.stations[st.id];
          if (!reading) return null;
          const color = selectedParam === "turbidity"
            ? turbidityColor(reading.turbidity)
            : doColor(reading.dissolvedOxygen);
          const value = selectedParam === "turbidity" ? reading.turbidity : reading.dissolvedOxygen;
          const unit = selectedParam === "turbidity" ? "NTU" : "mg/L";
          const pulseRadius = selectedParam === "turbidity"
            ? (reading.turbidity > 100 ? 20 : reading.turbidity > 50 ? 16 : 12)
            : (reading.dissolvedOxygen < 3 ? 20 : reading.dissolvedOxygen < 5 ? 16 : 12);

          return (
            <g key={st.id}>
              {/* Pulse ring for alerts */}
              <circle cx={st.x} cy={st.y} r={pulseRadius} fill={color} opacity="0.15">
                <animate attributeName="r" values={`${pulseRadius};${pulseRadius + 8};${pulseRadius}`} dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.15;0.05;0.15" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Station dot */}
              <circle
                cx={st.x} cy={st.y} r="8"
                fill={color} stroke={isDark ? "#1e293b" : "#fff"} strokeWidth="2"
                filter="url(#glow)"
                className="transition-all duration-500"
              />
              {/* Value label */}
              <text
                x={st.x} y={st.y - 14}
                textAnchor="middle"
                fill={color}
                fontSize="11"
                fontWeight="bold"
                className="transition-all duration-500"
              >
                {value}
              </text>
              {/* Station name */}
              <text
                x={st.x} y={st.y + 22}
                textAnchor="middle"
                fill={isDark ? "#94a3b8" : "#64748b"}
                fontSize="9"
              >
                {st.short}
              </text>
              {/* Unit */}
              <text
                x={st.x} y={st.y + 32}
                textAnchor="middle"
                fill={isDark ? "#64748b" : "#94a3b8"}
                fontSize="7"
              >
                {unit}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(10, 175)">
          <text fill={isDark ? "#64748b" : "#94a3b8"} fontSize="8" fontWeight="500">
            {selectedParam === "turbidity" ? "Turbidity (NTU)" : "Dissolved Oxygen (mg/L)"}
          </text>
        </g>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Synchronized Line Chart (simple SVG)
// ---------------------------------------------------------------------------

function MiniChart({
  data,
  currentHour,
  parameter,
  label,
  unit,
  colorFn,
  isDark,
  thresholdLine,
  thresholdLabel,
}: {
  data: TimePoint[];
  currentHour: number;
  parameter: "turbidity" | "dissolvedOxygen" | "ph";
  label: string;
  unit: string;
  colorFn: (v: number) => string;
  isDark: boolean;
  thresholdLine?: number;
  thresholdLabel?: string;
}) {
  const W = 580;
  const H = 100;
  const PAD = { top: 10, right: 10, bottom: 20, left: 35 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Get all values for scale
  const allVals: number[] = [];
  for (const pt of data) {
    for (const r of Object.values(pt.stations)) {
      allVals.push(r[parameter]);
    }
  }
  const minV = Math.min(...allVals) * 0.9;
  const maxV = Math.max(...allVals) * 1.1;

  const x = (hour: number) => PAD.left + (hour / 23) * plotW;
  const y = (val: number) => PAD.top + plotH - ((val - minV) / (maxV - minV)) * plotH;

  const stationColors: Record<string, string> = {
    "ANA-002": "#3b82f6",
    "WB-001": "#f97316",
    "HR-001": "#a855f7",
    "ANA-003": "#14b8a6",
  };

  return (
    <div className={`rounded-lg border p-2 ${isDark ? "bg-panel-bg border-panel-border" : "bg-white border-slate-200"}`}>
      <div className="flex items-center justify-between mb-1 px-1">
        <span className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {label} ({unit})
        </span>
        <div className="flex gap-2">
          {STATIONS_META.map((st) => (
            <span key={st.id} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: stationColors[st.id] }} />
              <span className={`text-[8px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{st.short}</span>
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const yPos = PAD.top + plotH * (1 - pct);
          const val = minV + (maxV - minV) * pct;
          return (
            <g key={pct}>
              <line x1={PAD.left} y1={yPos} x2={W - PAD.right} y2={yPos} stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="0.5" />
              <text x={PAD.left - 4} y={yPos + 3} textAnchor="end" fill={isDark ? "#64748b" : "#94a3b8"} fontSize="7">
                {val.toFixed(parameter === "ph" ? 1 : 0)}
              </text>
            </g>
          );
        })}

        {/* Threshold line */}
        {thresholdLine != null && (
          <g>
            <line
              x1={PAD.left} y1={y(thresholdLine)} x2={W - PAD.right} y2={y(thresholdLine)}
              stroke="#ef4444" strokeWidth="1" strokeDasharray="4,3" opacity="0.6"
            />
            {thresholdLabel && (
              <text x={W - PAD.right - 2} y={y(thresholdLine) - 3} textAnchor="end" fill="#ef4444" fontSize="7" opacity="0.8">
                {thresholdLabel}
              </text>
            )}
          </g>
        )}

        {/* Station lines */}
        {STATIONS_META.map((st) => {
          const points = data
            .filter((_, i) => i <= currentHour)
            .map((pt) => `${x(pt.hour)},${y(pt.stations[st.id]?.[parameter] ?? 0)}`)
            .join(" ");
          return (
            <polyline
              key={st.id}
              points={points}
              fill="none"
              stroke={stationColors[st.id]}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          );
        })}

        {/* Current-hour dots */}
        {STATIONS_META.map((st) => {
          const reading = data[currentHour]?.stations[st.id];
          if (!reading) return null;
          const val = reading[parameter];
          return (
            <circle
              key={`dot-${st.id}`}
              cx={x(currentHour)}
              cy={y(val)}
              r="3"
              fill={colorFn(val)}
              stroke={isDark ? "#1e293b" : "#fff"}
              strokeWidth="1.5"
            />
          );
        })}

        {/* Playhead line */}
        <line
          x1={x(currentHour)} y1={PAD.top} x2={x(currentHour)} y2={H - PAD.bottom}
          stroke={isDark ? "#94a3b8" : "#64748b"} strokeWidth="0.5" strokeDasharray="2,2"
        />

        {/* Hour axis labels */}
        {[0, 6, 12, 18, 23].map((h) => (
          <text key={h} x={x(h)} y={H - 4} textAnchor="middle" fill={isDark ? "#64748b" : "#94a3b8"} fontSize="7">
            {h.toString().padStart(2, "0")}:00
          </text>
        ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spike Alert Panel
// ---------------------------------------------------------------------------

function SpikeAlerts({ spikes, isDark }: { spikes: Spike[]; isDark: boolean }) {
  if (spikes.length === 0) return null;

  const stationName = (id: string) => STATIONS_META.find((s) => s.id === id)?.short ?? id;

  return (
    <div className={`rounded-lg border p-3 ${isDark ? "bg-red-950/20 border-red-900/30" : "bg-red-50 border-red-200"}`}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <span className={`text-xs font-semibold ${isDark ? "text-red-300" : "text-red-700"}`}>
          Active Alerts
        </span>
      </div>
      <div className="space-y-1">
        {spikes.slice(0, 4).map((sp, i) => (
          <div key={i} className={`text-[11px] flex items-center gap-2 ${isDark ? "text-red-300/80" : "text-red-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sp.severity === "danger" ? "bg-red-500" : "bg-amber-500"}`} />
            <span className="font-medium">{stationName(sp.station)}</span>
            <span className={isDark ? "text-slate-500" : "text-slate-400"}>—</span>
            <span>{sp.parameter}: {sp.value} {sp.parameter === "Turbidity" ? "NTU" : "mg/L"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AnimatedScenarios() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [currentHour, setCurrentHour] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedParam, setSelectedParam] = useState<"turbidity" | "dissolvedOxygen">("turbidity");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const stepForward = useCallback(() => setCurrentHour((h) => Math.min(23, h + 1)), []);
  const stepBack = useCallback(() => setCurrentHour((h) => Math.max(0, h - 1)), []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentHour((h) => {
          if (h >= 23) {
            setIsPlaying(false);
            return 23;
          }
          return h + 1;
        });
      }, 800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const events = SCENARIO_DATA
    .filter((p) => p.event)
    .map((p) => ({ hour: p.hour, label: p.event! }));

  const spikesAtHour = ALL_SPIKES.filter((s) => s.hour === currentHour);

  return (
    <StoryCard
      title="24 Hours on the Anacostia"
      subtitle="Watch how a spring storm transforms water quality across the watershed"
      icon={<Activity className="w-5 h-5 text-cyan-400" />}
      accentColor={isDark ? "bg-cyan-500/10" : "bg-cyan-50"}
    >
      <div className="space-y-4">
        {/* Scenario description */}
        <FadeIn>
          <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            This simulation shows a typical spring storm event hitting the Anacostia watershed.
            Press play to watch pollution levels rise as stormwater overwhelms the system,
            triggering Combined Sewer Overflow (CSO) events. Notice how upstream tributaries
            respond first, with the tidal section at Buzzard Point seeing delayed effects.
          </p>
        </FadeIn>

        {/* Parameter toggle */}
        <div className="flex gap-2">
          {(["turbidity", "dissolvedOxygen"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedParam(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedParam === p
                  ? "bg-water-blue text-white"
                  : isDark
                    ? "bg-panel-bg border border-panel-border text-slate-400 hover:text-white"
                    : "bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700"
              }`}
            >
              {p === "turbidity" ? "Turbidity" : "Dissolved Oxygen"}
            </button>
          ))}
        </div>

        {/* Screen reader announcement for current state */}
        <div className="sr-only" aria-live="polite" role="status">
          {`Time: ${currentHour}:00. ${
            SCENARIO_DATA[currentHour]?.event ? `Event: ${SCENARIO_DATA[currentHour].event}. ` : ""
          }${spikesAtHour.length > 0 ? `${spikesAtHour.length} water quality alerts active.` : "No alerts."}`}
        </div>

        {/* River Map */}
        <AnimatedRiverMap currentHour={currentHour} isDark={isDark} selectedParam={selectedParam} />

        {/* Timeline Player */}
        <TimelinePlayer
          currentHour={currentHour}
          isPlaying={isPlaying}
          onPlay={play}
          onPause={pause}
          onSeek={setCurrentHour}
          onStepForward={stepForward}
          onStepBack={stepBack}
          events={events}
          spikesAtHour={spikesAtHour}
          isDark={isDark}
        />

        {/* Spike Alerts */}
        <SpikeAlerts spikes={spikesAtHour} isDark={isDark} />

        {/* Synchronized Charts */}
        <div className="space-y-2">
          <MiniChart
            data={SCENARIO_DATA}
            currentHour={currentHour}
            parameter="turbidity"
            label="Turbidity"
            unit="NTU"
            colorFn={turbidityColor}
            isDark={isDark}
            thresholdLine={50}
            thresholdLabel="EPA concern"
          />
          <MiniChart
            data={SCENARIO_DATA}
            currentHour={currentHour}
            parameter="dissolvedOxygen"
            label="Dissolved Oxygen"
            unit="mg/L"
            colorFn={doColor}
            isDark={isDark}
            thresholdLine={5}
            thresholdLabel="Aquatic stress"
          />
          <MiniChart
            data={SCENARIO_DATA}
            currentHour={currentHour}
            parameter="ph"
            label="pH"
            unit=""
            colorFn={(v) => (v < 6.5 || v > 8.5 ? "#ef4444" : v < 7 || v > 8 ? "#eab308" : "#22c55e")}
            isDark={isDark}
          />
        </div>

        {/* Scenario info */}
        <FadeIn delay={200}>
          <div className={`rounded-xl border p-4 ${isDark ? "bg-panel-bg border-panel-border" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-start gap-3">
              <Timer className="w-4 h-4 mt-0.5 text-water-blue flex-shrink-0" />
              <div>
                <h4 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                  About This Scenario
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Based on real storm event patterns from USGS gauges in the Anacostia watershed.
                  During heavy rainfall, DC&apos;s aging combined sewer system overflows, discharging
                  untreated sewage directly into waterways. The 2023 Clean Rivers Project tunnel
                  now captures 90% of CSO volume, but overflow events still occur during extreme storms.
                  Watts Branch (WB-001) shows the most dramatic response due to its small, heavily
                  urbanized catchment area.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </StoryCard>
  );
}
