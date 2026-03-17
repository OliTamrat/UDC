"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Play, Pause, RotateCcw, MapPin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { StoryCard, FadeIn } from "./ScrollySection";

/**
 * "Upstream to Downstream" — Animated watershed propagation showing
 * how pollution moves through the river system.
 */

interface StationNode {
  id: string;
  name: string;
  short: string;
  position: number; // 0-100% along the river
  type: "headwater" | "tributary" | "main" | "tidal";
  turbidity: number; // baseline
}

const STATIONS: StationNode[] = [
  { id: "NEB-001", name: "NE Branch Headwaters", short: "NE Head", position: 5, type: "headwater", turbidity: 12 },
  { id: "NEB-002", name: "NE Branch at Colmar Manor", short: "Colmar", position: 20, type: "tributary", turbidity: 18 },
  { id: "NWB-001", name: "NW Branch at Hyattsville", short: "NW Branch", position: 15, type: "tributary", turbidity: 15 },
  { id: "ANA-001", name: "Anacostia at Bladensburg", short: "Bladensburg", position: 35, type: "main", turbidity: 25 },
  { id: "ANA-002", name: "Anacostia at Benning Rd", short: "Benning", position: 55, type: "main", turbidity: 32 },
  { id: "ANA-003", name: "Anacostia at Navy Yard", short: "Navy Yard", position: 75, type: "main", turbidity: 38 },
  { id: "POT-001", name: "Potomac Confluence", short: "Potomac", position: 95, type: "tidal", turbidity: 28 },
];

interface PollutionWave {
  startPosition: number;
  currentPosition: number;
  intensity: number; // 0-1
  source: string;
}

export default function UpstreamDownstream() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [playing, setPlaying] = useState(false);
  const [timeStep, setTimeStep] = useState(0);
  const [scenario, setScenario] = useState<"storm" | "cso" | "construction">("storm");
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_STEPS = 60;

  // Pollution propagation based on scenario
  const getStationTurbidity = (station: StationNode, step: number): number => {
    const base = station.turbidity;
    const sourcePosition =
      scenario === "storm" ? 0 :
      scenario === "cso" ? 50 :
      15;

    const distance = Math.abs(station.position - sourcePosition);
    const travelTime = distance * 0.5; // steps to reach this station
    const elapsed = step - travelTime;

    if (elapsed < 0) return base; // wave hasn't arrived yet

    const peakIntensity =
      scenario === "storm" ? 8 :
      scenario === "cso" ? 6 :
      4;

    // Bell curve of intensity
    const decay = Math.max(0, 1 - distance / 100);
    const timeFactor = Math.exp(-((elapsed - 10) ** 2) / 200);
    const spike = peakIntensity * timeFactor * decay;

    return Math.round(base + base * spike);
  };

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
    },
    {
      id: "cso" as const,
      label: "Sewer Overflow",
      desc: "CSO event at Capitol Hill",
      color: "text-red-400",
    },
    {
      id: "construction" as const,
      label: "Construction Runoff",
      desc: "Exposed soil near tributary",
      color: "text-orange-400",
    },
  ];

  const hoursElapsed = Math.round((timeStep / MAX_STEPS) * 48);

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
              <span
                className={`text-xs font-semibold ${s.color}`}
              >
                {s.label}
              </span>
              <p
                className={`text-[10px] ${
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
          className={`rounded-xl border p-4 mb-4 ${
            isDark ? "bg-panel-bg border-panel-border" : "bg-slate-50 border-slate-200"
          }`}
        >
          {/* Time indicator */}
          <div className="flex items-center justify-between mb-4">
            <span
              className={`text-xs font-medium ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}
            >
              {hoursElapsed === 0 ? "Before event" : `${hoursElapsed} hours after event`}
            </span>
            {/* Playback controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPlaying(!playing)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark
                    ? "bg-water-blue/20 text-blue-300 hover:bg-water-blue/30"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                }`}
              >
                {playing ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
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

          {/* River path */}
          <div className="relative h-48 mb-2">
            {/* River line */}
            <div className="absolute top-1/2 left-0 right-0 h-3 -translate-y-1/2">
              <svg className="w-full h-full" viewBox="0 0 100 3" preserveAspectRatio="none">
                <path
                  d="M 0 1.5 Q 15 0.5, 30 1.5 Q 45 2.5, 60 1.5 Q 75 0.5, 90 1.5 L 100 1.5"
                  fill="none"
                  stroke={isDark ? "#1E3A5F" : "#CBD5E1"}
                  strokeWidth="3"
                />
                <path
                  d="M 0 1.5 Q 15 0.5, 30 1.5 Q 45 2.5, 60 1.5 Q 75 0.5, 90 1.5 L 100 1.5"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                  strokeDasharray="2 1"
                  opacity="0.4"
                  style={{ animation: "water-flow 3s linear infinite" }}
                />
              </svg>
            </div>

            {/* Flow direction arrow */}
            <div className="absolute top-[calc(50%+16px)] left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1">
                <span className={`text-[9px] ${isDark ? "text-slate-600" : "text-slate-300"}`}>
                  Upstream
                </span>
                <ArrowRight className={`w-3 h-3 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
                <span className={`text-[9px] ${isDark ? "text-slate-600" : "text-slate-300"}`}>
                  Downstream
                </span>
              </div>
            </div>

            {/* Station markers */}
            {STATIONS.map((station) => {
              const turbidity = getStationTurbidity(station, timeStep);
              const ratio = turbidity / station.turbidity;
              const markerColor =
                ratio > 5 ? "bg-red-500" :
                ratio > 3 ? "bg-orange-500" :
                ratio > 1.5 ? "bg-amber-500" :
                "bg-green-500";

              const size = Math.min(40, 16 + ratio * 4);

              return (
                <div
                  key={station.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                  style={{
                    left: `${station.position}%`,
                    top: station.type === "tributary" ? "30%" : "50%",
                  }}
                >
                  {/* Label */}
                  <span
                    className={`text-[9px] font-medium whitespace-nowrap ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {station.short}
                  </span>
                  {/* Marker */}
                  <div
                    className={`rounded-full ${markerColor} transition-all duration-500 flex items-center justify-center`}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      boxShadow:
                        ratio > 3
                          ? `0 0 ${ratio * 4}px ${ratio * 2}px ${markerColor === "bg-red-500" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`
                          : "none",
                    }}
                  >
                    <span className="text-white text-[8px] font-bold">
                      {turbidity}
                    </span>
                  </div>
                  {/* Turbidity value */}
                  <span
                    className={`text-[9px] ${
                      ratio > 3 ? "text-red-400 font-medium" : isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    NTU
                  </span>
                </div>
              );
            })}
          </div>

          {/* Timeline scrubber */}
          <input
            type="range"
            min={0}
            max={MAX_STEPS}
            value={timeStep}
            onChange={(e) => {
              setTimeStep(Number(e.target.value));
              setPlaying(false);
            }}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-water-blue"
            style={{
              background: isDark
                ? `linear-gradient(to right, #3B82F6 ${(timeStep / MAX_STEPS) * 100}%, #1E3A5F ${(timeStep / MAX_STEPS) * 100}%)`
                : `linear-gradient(to right, #3B82F6 ${(timeStep / MAX_STEPS) * 100}%, #E2E8F0 ${(timeStep / MAX_STEPS) * 100}%)`,
            }}
          />
        </div>
      </FadeIn>

      {/* Key insight */}
      <FadeIn delay={400}>
        <div
          className={`rounded-xl border p-4 ${
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
