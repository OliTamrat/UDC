"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import TimelinePlayback from "@/components/scenarios/TimelinePlayback";
import AnimatedMapLayer from "@/components/scenarios/AnimatedMapLayer";
import SynchronizedCharts from "@/components/scenarios/SynchronizedCharts";
import ScenarioLibrary from "@/components/scenarios/ScenarioLibrary";
import {
  scenarios,
  generateScenarioFrames,
  getSpikeSummary,
  setRealBaselines,
  hasRealBaselines,
  getBaselineSource,
} from "@/data/scenarios";
import type { ScenarioFrame, StationSnapshot, SpikeSummary, BaselineValues } from "@/data/scenarios";
import {
  AlertCircle,
  Database,
  Info,
  X,
} from "lucide-react";
import { useSidebarClass } from "@/hooks/useSidebarMargin";

export default function ScenariosPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const sidebarClass = useSidebarClass();

  // Scenario state
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("summer-storm");
  const [frames, setFrames] = useState<ScenarioFrame[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedStations, setSelectedStations] = useState<string[]>([
    "ANA-001",
    "ANA-002",
    "ANA-003",
    "WB-001",
  ]);
  const [detailStation, setDetailStation] = useState<StationSnapshot | null>(null);
  const [baselinesLoaded, setBaselinesLoaded] = useState(false);
  const [baselineInfo, setBaselineInfo] = useState<{ source: string; stationCount: number; totalReadings: number } | null>(null);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  // Fetch real baselines from API on mount
  useEffect(() => {
    async function loadBaselines() {
      try {
        const res = await fetch("/api/baselines");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (data.baselines && Object.keys(data.baselines).length > 0) {
          setRealBaselines(
            data.baselines as Record<string, Record<number, BaselineValues>>,
            data.source === "real" ? "real" : "seed"
          );
          setBaselineInfo({
            source: data.source,
            stationCount: data.stationCount,
            totalReadings: data.totalReadings,
          });
        }
      } catch {
        // Silently fall back to hardcoded baselines
      } finally {
        setBaselinesLoaded(true);
      }
    }
    loadBaselines();
  }, []);

  // Generate frames when scenario changes or baselines finish loading
  useEffect(() => {
    if (!baselinesLoaded) return;
    const newFrames = generateScenarioFrames(selectedScenarioId);
    setFrames(newFrames);
    setCurrentStep(0);
    setPlaying(false);
  }, [selectedScenarioId, baselinesLoaded]);

  // Playback loop
  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next > frames.length - 1) {
          setPlaying(false);
          return frames.length - 1;
        }
        return next;
      });
    }, 500 / speed);
    return () => clearInterval(interval);
  }, [playing, speed, frames.length]);

  const spikeSummary = useMemo(() => {
    if (!frames.length) return null;
    return getSpikeSummary(frames);
  }, [frames]);

  const currentFrame = frames[currentStep] || null;

  const getStepLabel = useCallback(
    (step: number) => {
      if (!selectedScenario) return `Hour ${step}`;
      const hrs = step;
      if (hrs < 1) return "Event Start";
      if (hrs === 1) return "1 hour after event";
      if (hrs < 24) return `${hrs} hours after event`;
      const days = Math.floor(hrs / 24);
      const remainHrs = hrs % 24;
      if (remainHrs === 0) return `${days} day${days > 1 ? "s" : ""} after event`;
      return `${days}d ${remainHrs}h after event`;
    },
    [selectedScenario]
  );

  const getStepColor = useCallback(
    (step: number) => {
      if (!frames[step]) return "#3B82F6";
      const spikes = frames[step].spikes.length;
      if (spikes > 8) return "#EF4444";
      if (spikes > 4) return "#F97316";
      if (spikes > 0) return "#F59E0B";
      return "#22C55E";
    },
    [frames]
  );

  const handleStationClick = (station: StationSnapshot) => {
    setDetailStation(station);
  };

  const toggleStation = (stationId: string) => {
    setSelectedStations((prev) =>
      prev.includes(stationId) ? prev.filter((s) => s !== stationId) : [...prev, stationId]
    );
  };

  const availableStations = currentFrame?.stations || [];

  return (
    <div className={`flex min-h-screen ${isDark ? "bg-udc-dark text-white" : "bg-[#F9FAFB] text-[#111827]"}`}>
      <Sidebar />
      <main id="main-content" className={`flex-1 ${sidebarClass} min-w-0 overflow-x-hidden`}>
        <Header />
        <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
          {/* Hero */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isDark ? "bg-udc-gold/20 text-udc-gold" : "bg-amber-100 text-amber-700"
                }`}
              >
                Sprint 4 — Animated Scenarios
              </span>
            </div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>
              Pollution Scenario{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Simulator
              </span>
            </h1>
            <p className={`text-sm mt-1 max-w-2xl ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>
              Watch how pollution events propagate through the Anacostia watershed in real time.
              Select a scenario, press play, and observe station readings change as contamination
              travels downstream.
            </p>
          </div>

          {/* Scenario Selector */}
          <ScenarioLibrary
            scenarios={scenarios}
            selectedId={selectedScenarioId}
            onSelect={setSelectedScenarioId}
            spikeSummary={spikeSummary}
            className="mb-6"
          />

          {/* Timeline */}
          {selectedScenario && frames.length > 0 && (
            <TimelinePlayback
              totalSteps={frames.length - 1}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              playing={playing}
              onPlayPause={() => setPlaying(!playing)}
              onReset={() => {
                setCurrentStep(0);
                setPlaying(false);
              }}
              speed={speed}
              onSpeedChange={setSpeed}
              getStepLabel={getStepLabel}
              getStepColor={getStepColor}
              className="mb-6"
            />
          )}

          {/* Map + Active Spikes Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Map */}
            <div className="lg:col-span-2">
              {currentFrame && (
                <AnimatedMapLayer
                  stations={currentFrame.stations}
                  onStationClick={handleStationClick}
                />
              )}
            </div>

            {/* Active Alerts */}
            <div>
              <div
                className={`rounded-xl border p-4 h-full ${
                  isDark ? "bg-[#13161F]/90 border-white/[0.06]" : "bg-white/90 border-[#E5E7EB] shadow-sm"
                }`}
              >
                <h4
                  className={`text-xs font-semibold mb-3 flex items-center gap-2 ${
                    isDark ? "text-white" : "text-[#111827]"
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  Active Alerts ({currentFrame?.spikes.length || 0})
                </h4>
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {currentFrame?.spikes.length === 0 && (
                    <p className={`text-[11px] ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                      No EPA threshold violations at this time step.
                    </p>
                  )}
                  {currentFrame?.spikes.map((spike, i) => (
                    <div
                      key={`${spike.stationId}-${spike.parameter}-${i}`}
                      className={`p-2.5 rounded-lg border text-[11px] ${
                        spike.severity === "critical"
                          ? isDark
                            ? "border-red-500/30 bg-red-500/10"
                            : "border-red-200 bg-red-50"
                          : isDark
                            ? "border-amber-500/30 bg-amber-500/10"
                            : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-semibold ${
                            spike.severity === "critical" ? "text-red-400" : "text-amber-400"
                          }`}
                        >
                          {spike.severity === "critical" ? "CRITICAL" : "WARNING"}
                        </span>
                        <span className={`text-[9px] ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                          {spike.stationId}
                        </span>
                      </div>
                      <p className={isDark ? "text-[#E5E7EB]" : "text-[#374151]"}>
                        {spike.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Station Selector */}
          <div
            className={`rounded-xl border p-4 mb-4 ${
              isDark ? "bg-[#13161F]/90 border-white/[0.06]" : "bg-white/90 border-[#E5E7EB] shadow-sm"
            }`}
          >
            <h4 className={`text-xs font-semibold mb-2 ${isDark ? "text-white" : "text-[#111827]"}`}>
              Chart Stations
            </h4>
            <p className={`text-[10px] mb-3 ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
              Select stations to compare in the synchronized charts below
            </p>
            <div className="flex flex-wrap gap-2">
              {availableStations.map((station) => {
                const isSelected = selectedStations.includes(station.stationId);
                return (
                  <button
                    key={station.stationId}
                    onClick={() => toggleStation(station.stationId)}
                    className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${
                      isSelected
                        ? isDark
                          ? "bg-water-blue/20 border-water-blue/40 text-blue-300"
                          : "bg-blue-50 border-blue-300 text-blue-700"
                        : isDark
                          ? "bg-transparent border-white/[0.06] text-[#D1D5DB] hover:border-[#6B7280]"
                          : "bg-transparent border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
                    }`}
                  >
                    {station.stationId}
                    <span className={`ml-1 text-[9px] ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                      {station.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Synchronized Charts */}
          <SynchronizedCharts
            frames={frames}
            currentStep={currentStep}
            selectedStations={selectedStations}
            className="mb-6"
          />

          {/* Station Detail Modal */}
          {detailStation && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setDetailStation(null)}
              />
              <div
                className={`relative z-10 w-full max-w-md rounded-2xl border p-6 ${
                  isDark ? "bg-[#13161F] border-white/[0.06]" : "bg-white border-[#E5E7EB] shadow-xl"
                }`}
              >
                <button
                  onClick={() => setDetailStation(null)}
                  className={`absolute top-3 right-3 p-1.5 rounded-lg ${
                    isDark ? "hover:bg-white/[0.04] text-[#D1D5DB]" : "hover:bg-[#F3F4F6] text-[#6B7280]"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>

                <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>
                  {detailStation.stationName}
                </h3>
                <p className={`text-xs mb-4 ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
                  {detailStation.stationId} · {detailStation.type}
                </p>

                {/* Status badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      detailStation.status === "critical"
                        ? "bg-red-500/20 text-red-400"
                        : detailStation.status === "warning"
                          ? "bg-orange-500/20 text-orange-400"
                          : detailStation.status === "elevated"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {detailStation.status}
                  </span>
                </div>

                {/* Values grid */}
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const items: { label: string; value: string; change: number | null; unit: string; epa: string | null }[] = [
                      { label: "Dissolved Oxygen", value: `${detailStation.values.dissolvedOxygen.toFixed(1)} mg/L`, change: detailStation.changeFromBaseline.dissolvedOxygen, unit: "mg/L", epa: "min 5.0" },
                      { label: "Turbidity", value: `${detailStation.values.turbidity} NTU`, change: detailStation.changeFromBaseline.turbidity, unit: "NTU", epa: "< 50" },
                      { label: "E. coli", value: `${detailStation.values.eColiCount} CFU/100mL`, change: detailStation.changeFromBaseline.eColiCount, unit: "CFU", epa: "< 410" },
                      { label: "Temperature", value: `${detailStation.values.temperature.toFixed(1)} °C`, change: null, unit: "°C", epa: null },
                      { label: "pH", value: detailStation.values.pH.toFixed(1), change: null, unit: "", epa: "6.5–9.0" },
                    ];
                    return items.map((item) => (
                      <div
                        key={item.label}
                        className={`p-3 rounded-lg ${isDark ? "bg-[#1F2937]" : "bg-[#F9FAFB]"}`}
                      >
                        <p className={`text-[10px] ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
                          {item.label}
                        </p>
                        <p className={`text-sm font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>
                          {item.value}
                        </p>
                        {item.change !== null && (
                          <p
                            className={`text-[10px] mt-0.5 ${
                              item.change > 0 ? "text-red-400" : item.change < 0 ? "text-blue-400" : "text-[#9CA3AF]"
                            }`}
                          >
                            {item.change > 0 ? "+" : ""}
                            {item.change.toFixed(1)} {item.unit} vs baseline
                          </p>
                        )}
                        {item.epa && (
                          <p className={`text-[9px] mt-0.5 ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                            EPA: {item.epa}
                          </p>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            className={`rounded-xl border p-4 ${
              isDark ? "bg-[#13161F]/60 border-white/[0.06]" : "bg-[#F9FAFB] border-[#E5E7EB]"
            }`}
          >
            <div className="flex items-start gap-2 mb-3">
              <Info className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`} />
              <p className={`text-[11px] leading-relaxed ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
                These scenarios are simulated using baseline data from UDC WRRI monitoring stations
                and modeled pollution propagation dynamics. The simulation engine uses Gaussian pulse
                models with flow-delay propagation to approximate how contaminants travel through the
                Anacostia watershed. Actual pollution events may vary based on precipitation intensity,
                infrastructure conditions, and tidal influences.
              </p>
            </div>
            {baselineInfo && (
              <div className={`flex items-center gap-2 pt-3 border-t ${isDark ? "border-white/[0.06]" : "border-[#E5E7EB]"}`}>
                <Database className={`w-3.5 h-3.5 ${baselineInfo.source === "real" ? "text-green-400" : "text-amber-400"}`} />
                <p className={`text-[10px] ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                  {baselineInfo.source === "real" ? (
                    <>
                      Baselines grounded in <strong className={isDark ? "text-green-300" : "text-green-600"}>{baselineInfo.totalReadings.toLocaleString()} real sensor readings</strong> from {baselineInfo.stationCount} stations (USGS/EPA/WQP ingested data)
                    </>
                  ) : (
                    <>
                      Using seed baseline data from {baselineInfo.stationCount} stations ({baselineInfo.totalReadings} readings) — run ingestion for real sensor baselines
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
