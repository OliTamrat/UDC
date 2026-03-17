"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, Play, Pause, RotateCcw, CloudRain, Droplets } from "lucide-react";
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
  /** X position as % along the SVG river path */
  x: number;
  /** Y position in the SVG viewBox */
  y: number;
  /** Label offset direction */
  labelSide: "top" | "bottom";
  type: "headwater" | "tributary" | "main" | "tidal";
  turbidity: number; // baseline NTU
  /** Position along the main flow for propagation calc (0-100) */
  flowPosition: number;
}

const STATIONS: StationNode[] = [
  { id: "NEB-001", name: "NE Branch Headwaters", short: "NE Head", x: 80, y: 45, labelSide: "top", type: "headwater", turbidity: 12, flowPosition: 5 },
  { id: "NWB-001", name: "NW Branch at Hyattsville", short: "NW Branch", x: 115, y: 115, labelSide: "bottom", type: "tributary", turbidity: 15, flowPosition: 15 },
  { id: "NEB-002", name: "NE Branch at Colmar Manor", short: "Colmar", x: 155, y: 80, labelSide: "top", type: "tributary", turbidity: 18, flowPosition: 20 },
  { id: "ANA-001", name: "Anacostia at Bladensburg", short: "Bladensburg", x: 250, y: 145, labelSide: "bottom", type: "main", turbidity: 25, flowPosition: 35 },
  { id: "ANA-002", name: "Anacostia at Benning Rd", short: "Benning", x: 390, y: 120, labelSide: "top", type: "main", turbidity: 32, flowPosition: 55 },
  { id: "ANA-003", name: "Anacostia at Navy Yard", short: "Navy Yard", x: 530, y: 155, labelSide: "bottom", type: "main", turbidity: 38, flowPosition: 75 },
  { id: "POT-001", name: "Potomac Confluence", short: "Potomac", x: 670, y: 130, labelSide: "top", type: "tidal", turbidity: 28, flowPosition: 95 },
];

// River path (main channel) — a natural meandering curve
const RIVER_MAIN_PATH = "M 40,60 C 100,40 140,100 200,130 C 260,160 320,90 400,115 C 480,140 540,180 600,150 C 660,120 700,135 730,130";
// NW Branch tributary
const TRIB_NW_PATH = "M 60,160 C 90,140 120,130 170,120";
// NE Branch upper tributary
const TRIB_NE_PATH = "M 50,20 C 70,30 80,50 100,55";

export default function UpstreamDownstream() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [playing, setPlaying] = useState(false);
  const [timeStep, setTimeStep] = useState(0);
  const [scenario, setScenario] = useState<"storm" | "cso" | "construction">("storm");
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

  /** How far pollution has reached (0-100 flow position) */
  const getPollutionFront = useCallback((step: number): number => {
    const sourcePosition =
      scenario === "storm" ? 0 :
      scenario === "cso" ? 50 :
      15;
    // Pollution moves ~2 flow-units per step
    return Math.min(100, sourcePosition + step * 2);
  }, [scenario]);

  /** Pollution intensity at a given flow position (0-1) */
  const getPollutionIntensity = useCallback((flowPos: number, step: number): number => {
    const sourcePosition =
      scenario === "storm" ? 0 :
      scenario === "cso" ? 50 :
      15;
    const distance = Math.abs(flowPos - sourcePosition);
    const travelTime = distance * 0.5;
    const elapsed = step - travelTime;

    if (elapsed < 0) return 0;

    const peakIntensity = scenario === "storm" ? 1 : scenario === "cso" ? 0.8 : 0.6;
    const decay = Math.max(0, 1 - distance / 100);
    const timeFactor = Math.exp(-((elapsed - 10) ** 2) / 200);

    return Math.min(1, peakIntensity * timeFactor * decay);
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

  // Compute pollution color for the river gradient
  const pollutionFront = getPollutionFront(timeStep);

  // Generate flow particles along the river
  const flowParticles = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      offset: Math.random() * 100,
      speed: 0.8 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 6,
      size: 1.5 + Math.random() * 2,
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
          pollution propagates.
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
                {/* Clean water gradient */}
                <linearGradient id="cleanWater" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={isDark ? "#1e3a5f" : "#93c5fd"} />
                  <stop offset="100%" stopColor={isDark ? "#1e4d8f" : "#60a5fa"} />
                </linearGradient>

                {/* Polluted water gradient — dynamic based on scenario */}
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

                {/* River bank texture */}
                <linearGradient id="riverBank" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isDark ? "#1a2e1a" : "#86efac"} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={isDark ? "#0a1a0a" : "#4ade80"} stopOpacity="0.1" />
                </linearGradient>

                {/* Glow filter for polluted markers */}
                <filter id="pollutionGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background terrain */}
              <rect width="750" height="210" fill={isDark ? "#0c1424" : "#f0fdf4"} rx="0" />

              {/* Subtle terrain texture */}
              {isDark && (
                <g opacity="0.15">
                  <circle cx="100" cy="30" r="60" fill="#166534" />
                  <circle cx="300" cy="180" r="80" fill="#166534" />
                  <circle cx="550" cy="40" r="70" fill="#166534" />
                  <circle cx="680" cy="170" r="50" fill="#166534" />
                </g>
              )}
              {!isDark && (
                <g opacity="0.2">
                  <circle cx="100" cy="30" r="60" fill="#bbf7d0" />
                  <circle cx="300" cy="180" r="80" fill="#bbf7d0" />
                  <circle cx="550" cy="40" r="70" fill="#bbf7d0" />
                  <circle cx="680" cy="170" r="50" fill="#bbf7d0" />
                </g>
              )}

              {/* River banks (wider stroke behind the water) */}
              <path
                d={RIVER_MAIN_PATH}
                fill="none"
                stroke={isDark ? "#1a3320" : "#86efac"}
                strokeWidth="32"
                strokeLinecap="round"
                opacity="0.3"
              />
              <path
                d={TRIB_NW_PATH}
                fill="none"
                stroke={isDark ? "#1a3320" : "#86efac"}
                strokeWidth="18"
                strokeLinecap="round"
                opacity="0.25"
              />
              <path
                d={TRIB_NE_PATH}
                fill="none"
                stroke={isDark ? "#1a3320" : "#86efac"}
                strokeWidth="16"
                strokeLinecap="round"
                opacity="0.25"
              />

              {/* Main river — clean water base */}
              <path
                d={RIVER_MAIN_PATH}
                fill="none"
                stroke="url(#cleanWater)"
                strokeWidth="20"
                strokeLinecap="round"
                opacity={isDark ? "0.8" : "0.6"}
              />

              {/* Tributaries — clean water */}
              <path
                d={TRIB_NW_PATH}
                fill="none"
                stroke="url(#cleanWater)"
                strokeWidth="10"
                strokeLinecap="round"
                opacity={isDark ? "0.6" : "0.5"}
              />
              <path
                d={TRIB_NE_PATH}
                fill="none"
                stroke="url(#cleanWater)"
                strokeWidth="8"
                strokeLinecap="round"
                opacity={isDark ? "0.6" : "0.5"}
              />

              {/* Pollution overlay on main river */}
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

              {/* Animated water flow particles */}
              {flowParticles.map((particle, i) => {
                const t = ((Date.now() / (1000 * particle.speed) + particle.offset) % 1);
                const flowPos = t * 100;
                const intensity = getPollutionIntensity(flowPos, timeStep);
                // Map flow position to approximate SVG coordinates along the river
                const px = 40 + (t * 690);
                const py = 60 + Math.sin(t * Math.PI * 3) * 40 + 30 + particle.drift;
                const color = intensity > 0.3
                  ? (scenario === "storm" ? "#d97706" : scenario === "cso" ? "#10b981" : "#ea580c")
                  : (isDark ? "#60a5fa" : "#3b82f6");

                return (
                  <circle
                    key={i}
                    cx={px}
                    cy={py}
                    r={particle.size}
                    fill={color}
                    opacity={0.3 + intensity * 0.4}
                  >
                    <animate
                      attributeName="cx"
                      from={40}
                      to={730}
                      dur={`${3 + particle.speed * 2}s`}
                      begin={`${particle.offset * 3}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              })}

              {/* Water shimmer effect on main river */}
              <path
                d={RIVER_MAIN_PATH}
                fill="none"
                stroke="white"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.1"
                strokeDasharray="4 12"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-16"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </path>
              <path
                d={RIVER_MAIN_PATH}
                fill="none"
                stroke="white"
                strokeWidth="0.5"
                strokeLinecap="round"
                opacity="0.08"
                strokeDasharray="2 8"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-10"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Flow direction arrows along river */}
              {[0.2, 0.4, 0.6, 0.8].map((t, i) => {
                const ax = 40 + t * 690;
                const ay = 60 + Math.sin(t * Math.PI * 3) * 40 + 30;
                return (
                  <g key={i} opacity={isDark ? 0.3 : 0.2}>
                    <polygon
                      points={`${ax},${ay - 3} ${ax + 6},${ay} ${ax},${ay + 3}`}
                      fill={isDark ? "#94a3b8" : "#64748b"}
                    >
                      <animate
                        attributeName="opacity"
                        values="0.3;0.6;0.3"
                        dur="2s"
                        begin={`${i * 0.5}s`}
                        repeatCount="indefinite"
                      />
                    </polygon>
                  </g>
                );
              })}

              {/* Station markers */}
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
                  <g key={station.id}>
                    {/* Pulse ring for affected stations */}
                    {isAffected && (
                      <circle
                        cx={station.x}
                        cy={station.y}
                        r={markerRadius + 4}
                        fill="none"
                        stroke={markerFill}
                        strokeWidth="1.5"
                        opacity="0.4"
                      >
                        <animate
                          attributeName="r"
                          from={markerRadius + 2}
                          to={markerRadius + 12}
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          from="0.5"
                          to="0"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Station dot */}
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={markerRadius}
                      fill={markerFill}
                      stroke={isDark ? "#0f172a" : "#ffffff"}
                      strokeWidth="2"
                      style={{ transition: "r 0.5s ease, fill 0.5s ease" }}
                    />

                    {/* NTU value inside marker */}
                    <text
                      x={station.x}
                      y={station.y + 3.5}
                      textAnchor="middle"
                      fill="white"
                      fontSize="8"
                      fontWeight="bold"
                    >
                      {turbidity}
                    </text>

                    {/* Station label */}
                    <text
                      x={station.x}
                      y={labelY}
                      textAnchor="middle"
                      fill={isDark ? "#94a3b8" : "#64748b"}
                      fontSize="8"
                      fontWeight="500"
                    >
                      {station.short}
                    </text>
                    {/* NTU unit below/above label */}
                    <text
                      x={station.x}
                      y={labelY + 10}
                      textAnchor="middle"
                      fill={ratio > 3 ? "#ef4444" : isDark ? "#475569" : "#94a3b8"}
                      fontSize="7"
                    >
                      NTU
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
                      <text x="55" y="20" textAnchor="middle" fill="#fbbf24" fontSize="7" fontWeight="bold">
                        STORM
                      </text>
                    </g>
                  )}
                  {scenario === "cso" && (
                    <g>
                      <circle cx="420" cy="115" r="6" fill="#ef4444" opacity="0.6">
                        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <text x="420" y="95" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">
                        CSO
                      </text>
                    </g>
                  )}
                  {scenario === "construction" && (
                    <g>
                      <circle cx="130" cy="108" r="6" fill="#f97316" opacity="0.6">
                        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <text x="130" y="90" textAnchor="middle" fill="#f97316" fontSize="7" fontWeight="bold">
                        RUNOFF
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* Labels */}
              <text x="20" y="195" fill={isDark ? "#334155" : "#cbd5e1"} fontSize="8">
                Maryland
              </text>
              <text x="680" y="195" fill={isDark ? "#334155" : "#cbd5e1"} fontSize="8" textAnchor="end">
                Potomac River
              </text>
              <text x="350" y="200" fill={isDark ? "#334155" : "#cbd5e1"} fontSize="7" textAnchor="middle">
                Washington, DC
              </text>
            </svg>

            {/* Rain overlay for storm scenario */}
            {playing && scenario === "storm" && timeStep < 30 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 bg-blue-400/30 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * -10}%`,
                      height: `${6 + Math.random() * 10}px`,
                      animation: `rain-fall ${0.4 + Math.random() * 0.5}s linear infinite`,
                      animationDelay: `${Math.random() * 1.5}s`,
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
            {/* Legend */}
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
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Key insight */}
      <FadeIn delay={400}>
        <div
          className={`rounded-xl border p-4 mt-4 ${
            isDark
              ? "bg-cyan-950/20 border-cyan-500/20"
              : "bg-cyan-50 border-cyan-200"
          }`}
        >
          <p
            className={`text-sm leading-relaxed ${
              isDark ? "text-cyan-300" : "text-cyan-700"
            }`}
          >
            <strong>The bigger picture:</strong> The Anacostia watershed covers 176 square
            miles across DC and Maryland. Pollution that enters in suburban Hyattsville
            reaches the Potomac within 24-48 hours. This is why watershed management
            requires cooperation across state lines — and why UDC&apos;s monitoring network
            tracks stations from headwaters to tidal confluence.
          </p>
        </div>
      </FadeIn>
    </StoryCard>
  );
}
