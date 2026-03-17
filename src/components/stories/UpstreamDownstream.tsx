"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, Play, Pause, RotateCcw, CloudRain, Droplets, X, Info } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { StoryCard, FadeIn } from "./ScrollySection";

/**
 * "Upstream to Downstream" — Animated watershed propagation showing
 * how pollution moves through the river system with a top-down river view.
 */

interface StationNode {
  id: string;
  name: string;
  short: string;
  x: number;
  y: number;
  labelSide: "top" | "bottom";
  type: "headwater" | "tributary" | "main" | "tidal";
  turbidity: number;
  flowPosition: number;
  /** Plain-English explanation of what this NTU reading means */
  explanation: string;
}

const STATIONS: StationNode[] = [
  {
    id: "NEB-001", name: "NE Branch Headwaters", short: "NE Head",
    x: 80, y: 45, labelSide: "top", type: "headwater", turbidity: 12, flowPosition: 5,
    explanation: "12 NTU is very clear water — typical of a healthy headwater stream with minimal upstream development. You could see the bottom clearly at this reading. Headwaters like this serve as the baseline for downstream comparison.",
  },
  {
    id: "NWB-001", name: "NW Branch at Hyattsville", short: "NW Branch",
    x: 115, y: 115, labelSide: "bottom", type: "tributary", turbidity: 15, flowPosition: 15,
    explanation: "15 NTU is still relatively clear — slightly higher than headwaters due to suburban runoff from Hyattsville. The NW Branch drains residential neighborhoods, picking up sediment from lawns and roads.",
  },
  {
    id: "NEB-002", name: "NE Branch at Colmar Manor", short: "Colmar",
    x: 155, y: 80, labelSide: "top", type: "tributary", turbidity: 18, flowPosition: 20,
    explanation: "18 NTU shows slight cloudiness — the NE Branch has picked up sediment as it flows through Colmar Manor. This is within normal range but already higher than the pristine headwaters upstream.",
  },
  {
    id: "ANA-001", name: "Anacostia at Bladensburg", short: "Bladensburg",
    x: 250, y: 145, labelSide: "bottom", type: "main", turbidity: 25, flowPosition: 35,
    explanation: "25 NTU is the EPA threshold for aesthetic concern. This is where the NE and NW branches merge to form the Anacostia. The combined flow from two tributaries plus Bladensburg's urban runoff pushes turbidity to this level.",
  },
  {
    id: "ANA-002", name: "Anacostia at Benning Rd", short: "Benning",
    x: 390, y: 120, labelSide: "top", type: "main", turbidity: 32, flowPosition: 55,
    explanation: "32 NTU means noticeably murky water. Benning Road area is heavily urbanized with impervious surfaces. Combined Sewer Overflow (CSO) outfalls in this stretch discharge during storms, adding sediment and pollutants.",
  },
  {
    id: "ANA-003", name: "Anacostia at Navy Yard", short: "Navy Yard",
    x: 530, y: 155, labelSide: "bottom", type: "main", turbidity: 38, flowPosition: 75,
    explanation: "38 NTU reflects accumulated pollution from the entire upstream watershed. Navy Yard sits in the tidal zone where water moves slowly, allowing sediment to accumulate. Historic contamination from the former Navy Yard industrial site adds to baseline levels.",
  },
  {
    id: "POT-001", name: "Potomac Confluence", short: "Potomac",
    x: 670, y: 130, labelSide: "top", type: "tidal", turbidity: 28, flowPosition: 95,
    explanation: "28 NTU — actually lower than Navy Yard because the Anacostia's polluted water mixes with the much larger Potomac River, diluting the turbidity. However, this still contributes to Chesapeake Bay degradation downstream.",
  },
];

// River path (main channel) — a natural meandering curve
const RIVER_MAIN_PATH = "M 40,60 C 100,40 140,100 200,130 C 260,160 320,90 400,115 C 480,140 540,180 600,150 C 660,120 700,135 730,130";
const TRIB_NW_PATH = "M 60,160 C 90,140 120,130 170,120";
const TRIB_NE_PATH = "M 50,20 C 70,30 80,50 100,55";

/** NTU Explanation Modal */
function NTUModal({
  station,
  currentTurbidity,
  isDark,
  onClose,
}: {
  station: StationNode;
  currentTurbidity: number;
  isDark: boolean;
  onClose: () => void;
}) {
  const ratio = currentTurbidity / station.turbidity;
  const status = ratio > 5 ? "Dangerous" : ratio > 3 ? "High" : ratio > 1.5 ? "Elevated" : "Normal";
  const statusColor = ratio > 5 ? "text-red-400" : ratio > 3 ? "text-orange-400" : ratio > 1.5 ? "text-amber-400" : "text-green-400";
  const statusBg = ratio > 5 ? "bg-red-500/10" : ratio > 3 ? "bg-orange-500/10" : ratio > 1.5 ? "bg-amber-500/10" : "bg-green-500/10";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className={`relative max-w-md w-full rounded-t-2xl sm:rounded-2xl border p-5 shadow-2xl max-h-[85vh] overflow-y-auto ${
          isDark ? "bg-slate-900 border-panel-border" : "bg-white border-slate-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center mb-3">
          <div className={`w-10 h-1 rounded-full ${isDark ? "bg-slate-600" : "bg-slate-300"}`} />
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${
            isDark ? "hover:bg-white/10 active:bg-white/20 text-slate-400" : "hover:bg-slate-100 active:bg-slate-200 text-slate-500"
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-xl ${isDark ? "bg-water-blue/10" : "bg-blue-50"}`}>
            <Info className="w-5 h-5 text-water-blue" />
          </div>
          <div>
            <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              {station.name}
            </h3>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Station {station.id} · {station.type === "headwater" ? "Headwater" : station.type === "tributary" ? "Tributary" : station.type === "tidal" ? "Tidal" : "Main Channel"}
            </p>
          </div>
        </div>

        {/* Current reading */}
        <div className={`rounded-xl p-3 mb-4 border ${isDark ? "bg-panel-bg border-panel-border" : "bg-slate-50 border-slate-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-[10px] uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Current Turbidity
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold ${statusColor}`}>{currentTurbidity}</span>
                <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>NTU</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Baseline
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-lg font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{station.turbidity}</span>
                <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>NTU</span>
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBg} ${statusColor}`}>
              {status}
            </span>
            {ratio > 1.1 && (
              <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {ratio.toFixed(1)}x baseline
              </span>
            )}
          </div>
        </div>

        {/* Explanation */}
        <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          {station.explanation}
        </p>

        {/* NTU scale reference */}
        <div className={`mt-4 pt-3 border-t ${isDark ? "border-panel-border" : "border-slate-200"}`}>
          <span className={`text-[10px] font-medium uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            NTU Reference Scale
          </span>
          <div className="flex items-center gap-1 mt-1.5">
            {[
              { range: "0-10", label: "Crystal clear", color: "bg-blue-400" },
              { range: "10-25", label: "Clear", color: "bg-green-400" },
              { range: "25-50", label: "Slightly cloudy", color: "bg-amber-400" },
              { range: "50-150", label: "Cloudy", color: "bg-orange-400" },
              { range: "150+", label: "Murky", color: "bg-red-400" },
            ].map((item) => (
              <div key={item.range} className="flex-1 text-center">
                <div className={`h-1.5 rounded-full ${item.color} mb-1`} />
                <span className={`text-[7px] block ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className={`sm:hidden w-full mt-4 py-3 rounded-xl text-sm font-medium transition-colors ${
            isDark
              ? "bg-white/10 text-slate-300 active:bg-white/20"
              : "bg-slate-100 text-slate-600 active:bg-slate-200"
          }`}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function UpstreamDownstream() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [playing, setPlaying] = useState(false);
  const [timeStep, setTimeStep] = useState(0);
  const [scenario, setScenario] = useState<"storm" | "cso" | "construction">("storm");
  const [selectedStation, setSelectedStation] = useState<StationNode | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_STEPS = 60;

  const getStationTurbidity = useCallback((station: StationNode, step: number): number => {
    const base = station.turbidity;
    const sourcePosition =
      scenario === "storm" ? 0 :
      scenario === "cso" ? 50 :
      15;

    const distance = Math.abs(station.flowPosition - sourcePosition);
    const travelTime = distance * 0.5;
    const elapsed = step - travelTime;

    if (elapsed < 0) return base;

    const peakIntensity =
      scenario === "storm" ? 8 :
      scenario === "cso" ? 6 :
      4;

    const decay = Math.max(0, 1 - distance / 100);
    const timeFactor = Math.exp(-((elapsed - 10) ** 2) / 200);
    const spike = peakIntensity * timeFactor * decay;

    return Math.round(base + base * spike);
  }, [scenario]);

  const getPollutionFront = useCallback((step: number): number => {
    const sourcePosition =
      scenario === "storm" ? 0 :
      scenario === "cso" ? 50 :
      15;
    return Math.min(100, sourcePosition + step * 2);
  }, [scenario]);

  useEffect(() => {
    if (playing) {
      animRef.current = setInterval(() => {
        setTimeStep((t) => {
          if (t >= MAX_STEPS) {
            setPlaying(false);
            return MAX_STEPS;
          }
          return t + 1;
        });
      }, 200);
    }
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [playing]);

  const reset = () => {
    setTimeStep(0);
    setPlaying(false);
  };

  const scenarios = [
    {
      id: "storm" as const,
      label: "Major Storm",
      desc: "4 inches of rain in 6 hours",
      color: "text-blue-400",
      icon: <CloudRain className="w-3.5 h-3.5" />,
    },
    {
      id: "cso" as const,
      label: "Sewer Overflow",
      desc: "CSO event at Capitol Hill",
      color: "text-red-400",
      icon: <Droplets className="w-3.5 h-3.5" />,
    },
    {
      id: "construction" as const,
      label: "Construction Runoff",
      desc: "Exposed soil near tributary",
      color: "text-orange-400",
      icon: <ArrowRight className="w-3.5 h-3.5" />,
    },
  ];

  const hoursElapsed = Math.round((timeStep / MAX_STEPS) * 48);
  const pollutionFront = getPollutionFront(timeStep);

  // Stable rain drops for HTML overlay (same approach as RainStory)
  const rainDrops = useRef(
    Array.from({ length: 40 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * -20,
      height: 6 + Math.random() * 14,
      duration: 0.3 + Math.random() * 0.5,
      delay: Math.random() * 1.5,
    }))
  ).current;

  return (
    <StoryCard
      title="Upstream to Downstream"
      subtitle="Watch pollution travel through the watershed"
      icon={<ArrowRight className="w-5 h-5 text-cyan-400" />}
      accentColor={isDark ? "bg-cyan-500/10" : "bg-cyan-50"}
    >
      <FadeIn>
        <p
          className={`text-sm leading-relaxed mb-5 ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          When pollution enters the Anacostia watershed, it doesn&apos;t stay put. Water carries
          it downstream — from suburban tributaries in Maryland, through DC neighborhoods, to the
          Potomac and ultimately the Chesapeake Bay. Select a scenario and press play to see how
          pollution propagates. <strong>Click any station marker</strong> to learn what the reading means.
        </p>
      </FadeIn>

      {/* Scenario selector */}
      <FadeIn delay={100}>
        <div className="flex gap-2 mb-5">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setScenario(s.id);
                reset();
              }}
              className={`flex-1 px-3 py-2 rounded-lg border text-left transition-colors ${
                scenario === s.id
                  ? isDark
                    ? "bg-panel-bg border-water-blue/40"
                    : "bg-blue-50 border-blue-300"
                  : isDark
                    ? "border-panel-border hover:border-panel-border/80"
                    : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={s.color}>{s.icon}</span>
                <span className={`text-xs font-semibold ${s.color}`}>
                  {s.label}
                </span>
              </div>
              <p
                className={`text-[10px] mt-0.5 ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {s.desc}
              </p>
            </button>
          ))}
        </div>
      </FadeIn>

      {/* River visualization */}
      <FadeIn delay={200}>
        <div
          className={`rounded-xl border overflow-hidden ${
            isDark ? "bg-slate-900/80 border-panel-border" : "bg-gradient-to-b from-green-50/50 to-slate-50 border-slate-200"
          }`}
        >
          {/* Time indicator + controls */}
          <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
            isDark ? "border-panel-border bg-panel-bg/50" : "border-slate-200 bg-white/80"
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${playing ? "bg-green-400 animate-pulse" : timeStep > 0 ? "bg-amber-400" : "bg-slate-400"}`} />
              <span className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                {hoursElapsed === 0 ? "Before event" : `${hoursElapsed} hours after event`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPlaying(!playing)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark
                    ? "bg-water-blue/20 text-blue-300 hover:bg-water-blue/30"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                }`}
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={reset}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark
                    ? "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SVG River Scene */}
          <div className="relative" style={{ paddingBottom: "28%" }}>
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 750 210"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="cleanWater" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={isDark ? "#1e3a5f" : "#93c5fd"} />
                  <stop offset="100%" stopColor={isDark ? "#1e4d8f" : "#60a5fa"} />
                </linearGradient>
                <linearGradient id="pollutedWater" x1="0%" y1="0%" x2="100%" y2="0%">
                  {scenario === "storm" && (
                    <>
                      <stop offset="0%" stopColor="#92400e" />
                      <stop offset="100%" stopColor="#78350f" />
                    </>
                  )}
                  {scenario === "cso" && (
                    <>
                      <stop offset="0%" stopColor="#064e3b" />
                      <stop offset="100%" stopColor="#065f46" />
                    </>
                  )}
                  {scenario === "construction" && (
                    <>
                      <stop offset="0%" stopColor="#9a3412" />
                      <stop offset="100%" stopColor="#7c2d12" />
                    </>
                  )}
                </linearGradient>
              </defs>

              {/* Background terrain */}
              <rect width="750" height="210" fill={isDark ? "#0c1424" : "#f0fdf4"} />

              {/* Terrain texture */}
              <g opacity={isDark ? "0.15" : "0.2"}>
                <circle cx="100" cy="30" r="60" fill={isDark ? "#166534" : "#bbf7d0"} />
                <circle cx="300" cy="180" r="80" fill={isDark ? "#166534" : "#bbf7d0"} />
                <circle cx="550" cy="40" r="70" fill={isDark ? "#166534" : "#bbf7d0"} />
                <circle cx="680" cy="170" r="50" fill={isDark ? "#166534" : "#bbf7d0"} />
              </g>

              {/* River banks */}
              <path d={RIVER_MAIN_PATH} fill="none" stroke={isDark ? "#1a3320" : "#86efac"} strokeWidth="32" strokeLinecap="round" opacity="0.3" />
              <path d={TRIB_NW_PATH} fill="none" stroke={isDark ? "#1a3320" : "#86efac"} strokeWidth="18" strokeLinecap="round" opacity="0.25" />
              <path d={TRIB_NE_PATH} fill="none" stroke={isDark ? "#1a3320" : "#86efac"} strokeWidth="16" strokeLinecap="round" opacity="0.25" />

              {/* Main river — clean water */}
              <path d={RIVER_MAIN_PATH} fill="none" stroke="url(#cleanWater)" strokeWidth="20" strokeLinecap="round" opacity={isDark ? "0.8" : "0.6"} />
              <path d={TRIB_NW_PATH} fill="none" stroke="url(#cleanWater)" strokeWidth="10" strokeLinecap="round" opacity={isDark ? "0.6" : "0.5"} />
              <path d={TRIB_NE_PATH} fill="none" stroke="url(#cleanWater)" strokeWidth="8" strokeLinecap="round" opacity={isDark ? "0.6" : "0.5"} />

              {/* Pollution overlay */}
              {timeStep > 0 && (
                <path
                  d={RIVER_MAIN_PATH}
                  fill="none"
                  stroke="url(#pollutedWater)"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray="730"
                  strokeDashoffset={730 - (pollutionFront / 100) * 730}
                  opacity={Math.min(0.8, timeStep / 15)}
                  style={{ transition: "stroke-dashoffset 0.4s ease-out, opacity 0.5s ease" }}
                />
              )}

              {/* Water shimmer — animated dashes flowing downstream */}
              <path d={RIVER_MAIN_PATH} fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.1" strokeDasharray="4 12">
                <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.5s" repeatCount="indefinite" />
              </path>
              <path d={RIVER_MAIN_PATH} fill="none" stroke="white" strokeWidth="0.5" strokeLinecap="round" opacity="0.08" strokeDasharray="2 8">
                <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="2s" repeatCount="indefinite" />
              </path>

              {/* Flow direction arrows */}
              {[0.2, 0.4, 0.6, 0.8].map((t, i) => {
                const ax = 40 + t * 690;
                const ay = 60 + Math.sin(t * Math.PI * 3) * 40 + 30;
                return (
                  <polygon
                    key={i}
                    points={`${ax},${ay - 3} ${ax + 6},${ay} ${ax},${ay + 3}`}
                    fill={isDark ? "#94a3b8" : "#64748b"}
                    opacity={isDark ? 0.3 : 0.2}
                  >
                    <animate attributeName="opacity" values="0.15;0.4;0.15" dur="2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                  </polygon>
                );
              })}

              {/* Rain splash circles are rendered via SVG below; rain drops use HTML overlay */}

              {/* Rain splash circles on water surface during storm */}
              {playing && scenario === "storm" && timeStep < 30 && (
                <g>
                  {[
                    { cx: 120, cy: 85 }, { cx: 280, cy: 140 }, { cx: 450, cy: 125 },
                    { cx: 580, cy: 160 }, { cx: 350, cy: 110 }, { cx: 650, cy: 135 },
                  ].map((splash, i) => (
                    <circle
                      key={`splash-${i}`}
                      cx={splash.cx}
                      cy={splash.cy}
                      r="2"
                      fill="none"
                      stroke="#93c5fd"
                      strokeWidth="1"
                      opacity="0"
                    >
                      <animate attributeName="r" from="1" to="10" dur="1.2s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.7" to="0" dur="1.2s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
                    </circle>
                  ))}
                </g>
              )}

              {/* Station markers — clickable */}
              {STATIONS.map((station) => {
                const turbidity = getStationTurbidity(station, timeStep);
                const ratio = turbidity / station.turbidity;
                const isAffected = ratio > 1.3;
                const markerFill =
                  ratio > 5 ? "#ef4444" :
                  ratio > 3 ? "#f97316" :
                  ratio > 1.5 ? "#f59e0b" :
                  "#22c55e";
                const markerRadius = Math.min(16, 8 + ratio * 1.5);
                const labelY = station.labelSide === "top"
                  ? station.y - markerRadius - 14
                  : station.y + markerRadius + 4;

                return (
                  <g
                    key={station.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedStation(station)}
                  >
                    {/* Pulse ring for affected stations */}
                    {isAffected && (
                      <circle cx={station.x} cy={station.y} r={markerRadius + 4} fill="none" stroke={markerFill} strokeWidth="1.5" opacity="0.4">
                        <animate attributeName="r" from={markerRadius + 2} to={markerRadius + 12} dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Clickable hit area (larger invisible circle) */}
                    <circle cx={station.x} cy={station.y} r={markerRadius + 6} fill="transparent" />

                    {/* Station dot */}
                    <circle
                      cx={station.x} cy={station.y} r={markerRadius}
                      fill={markerFill}
                      stroke={isDark ? "#0f172a" : "#ffffff"}
                      strokeWidth="2"
                      style={{ transition: "fill 0.5s ease" }}
                    />

                    {/* NTU value */}
                    <text x={station.x} y={station.y + 3.5} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                      {turbidity}
                    </text>

                    {/* Station label */}
                    <text x={station.x} y={labelY} textAnchor="middle" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="8" fontWeight="500">
                      {station.short}
                    </text>
                    <text x={station.x} y={labelY + 10} textAnchor="middle" fill={ratio > 3 ? "#ef4444" : isDark ? "#475569" : "#94a3b8"} fontSize="7">
                      NTU
                    </text>

                    {/* Info icon hint */}
                    <circle cx={station.x + markerRadius + 2} cy={station.y - markerRadius - 2} r="4" fill={isDark ? "#334155" : "#e2e8f0"} />
                    <text x={station.x + markerRadius + 2} y={station.y - markerRadius + 1.5} textAnchor="middle" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="5" fontWeight="bold">
                      i
                    </text>
                  </g>
                );
              })}

              {/* Pollution source indicator */}
              {timeStep > 0 && (
                <g>
                  {scenario === "storm" && (
                    <g>
                      <circle cx="55" cy="55" r="6" fill="#fbbf24" opacity="0.6">
                        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <text x="55" y="20" textAnchor="middle" fill="#fbbf24" fontSize="7" fontWeight="bold">STORM</text>
                    </g>
                  )}
                  {scenario === "cso" && (
                    <g>
                      <circle cx="420" cy="115" r="6" fill="#ef4444" opacity="0.6">
                        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <text x="420" y="95" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">CSO</text>
                    </g>
                  )}
                  {scenario === "construction" && (
                    <g>
                      <circle cx="130" cy="108" r="6" fill="#f97316" opacity="0.6">
                        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <text x="130" y="90" textAnchor="middle" fill="#f97316" fontSize="7" fontWeight="bold">RUNOFF</text>
                    </g>
                  )}
                </g>
              )}

              {/* Geographic labels */}
              <text x="20" y="195" fill={isDark ? "#334155" : "#cbd5e1"} fontSize="8">Maryland</text>
              <text x="680" y="195" fill={isDark ? "#334155" : "#cbd5e1"} fontSize="8" textAnchor="end">Potomac River</text>
              <text x="350" y="200" fill={isDark ? "#334155" : "#cbd5e1"} fontSize="7" textAnchor="middle">Washington, DC</text>
            </svg>

            {/* HTML rain overlay — same approach as RainStory for mobile visibility */}
            {playing && scenario === "storm" && timeStep < 30 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {rainDrops.map((drop, i) => (
                  <div
                    key={`rain-${i}`}
                    className="absolute w-0.5 bg-blue-400/50 rounded-full"
                    style={{
                      left: `${drop.left}%`,
                      top: `${drop.top}%`,
                      height: `${drop.height}px`,
                      animation: `rain-fall ${drop.duration}s linear infinite`,
                      animationDelay: `${drop.delay}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Timeline scrubber */}
          <div className={`px-4 py-3 border-t ${isDark ? "border-panel-border" : "border-slate-200"}`}>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-medium w-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}>0h</span>
              <input
                type="range"
                min={0}
                max={MAX_STEPS}
                value={timeStep}
                onChange={(e) => {
                  setTimeStep(Number(e.target.value));
                  setPlaying(false);
                }}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-water-blue"
                style={{
                  background: isDark
                    ? `linear-gradient(to right, #3B82F6 ${(timeStep / MAX_STEPS) * 100}%, #1E3A5F ${(timeStep / MAX_STEPS) * 100}%)`
                    : `linear-gradient(to right, #3B82F6 ${(timeStep / MAX_STEPS) * 100}%, #E2E8F0 ${(timeStep / MAX_STEPS) * 100}%)`,
                }}
              />
              <span className={`text-[9px] font-medium w-8 text-right ${isDark ? "text-slate-500" : "text-slate-400"}`}>48h</span>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              {[
                { color: "bg-green-500", label: "Normal" },
                { color: "bg-amber-500", label: "Elevated" },
                { color: "bg-orange-500", label: "High" },
                { color: "bg-red-500", label: "Dangerous" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className={`text-[8px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.label}</span>
                </div>
              ))}
              <span className={`text-[8px] ml-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                Click markers for details
              </span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Key insight */}
      <FadeIn delay={400}>
        <div
          className={`rounded-xl border p-4 mt-4 ${
            isDark ? "bg-cyan-950/20 border-cyan-500/20" : "bg-cyan-50 border-cyan-200"
          }`}
        >
          <p className={`text-sm leading-relaxed ${isDark ? "text-cyan-300" : "text-cyan-700"}`}>
            <strong>The bigger picture:</strong> The Anacostia watershed covers 176 square
            miles across DC and Maryland. Pollution that enters in suburban Hyattsville
            reaches the Potomac within 24-48 hours. This is why watershed management
            requires cooperation across state lines — and why UDC&apos;s monitoring network
            tracks stations from headwaters to tidal confluence.
          </p>
        </div>
      </FadeIn>

      {/* NTU Explanation Modal */}
      {selectedStation && (
        <NTUModal
          station={selectedStation}
          currentTurbidity={getStationTurbidity(selectedStation, timeStep)}
          isDark={isDark}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </StoryCard>
  );
}
