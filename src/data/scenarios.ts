// Sprint 4: Animated Scenarios — Scenario definitions, spike detection, and simulation engine
// Provides pre-built pollution scenarios and generates time-series data for each station
// Baselines can be overridden with real ingested data via setRealBaselines()

import { monitoringStations, getStationHistoricalData } from "./dc-waterways";

// ─── Real Baseline Data (injected at runtime from API) ───────────────────────

export interface BaselineValues {
  dissolvedOxygen: number;
  temperature: number;
  pH: number;
  turbidity: number;
  eColiCount: number;
  readingCount: number;
}

// Module-level store for real baselines: { [stationId]: { [month]: values } }
let realBaselines: Record<string, Record<number, BaselineValues>> | null = null;
let baselineSource: "hardcoded" | "real" | "seed" = "hardcoded";

export function setRealBaselines(
  baselines: Record<string, Record<number, BaselineValues>>,
  source: "real" | "seed"
) {
  realBaselines = baselines;
  baselineSource = source;
}

export function getBaselineSource(): string {
  return baselineSource;
}

export function hasRealBaselines(): boolean {
  return realBaselines !== null && Object.keys(realBaselines).length > 0;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name reference
  color: string; // tailwind color class
  accentHex: string;
  duration: number; // total steps (each step = 1 hour)
  affectedParams: string[];
  sourceStations: string[]; // where the event originates
  peakStep: number; // step at which the event peaks
  category: "storm" | "cso" | "industrial" | "seasonal" | "construction";
}

export interface ScenarioFrame {
  step: number;
  hour: number;
  stations: StationSnapshot[];
  spikes: SpikeEvent[];
}

export interface StationSnapshot {
  stationId: string;
  stationName: string;
  position: [number, number];
  type: string;
  values: {
    dissolvedOxygen: number;
    temperature: number;
    pH: number;
    turbidity: number;
    eColiCount: number;
  };
  status: "normal" | "elevated" | "warning" | "critical";
  changeFromBaseline: {
    dissolvedOxygen: number;
    turbidity: number;
    eColiCount: number;
  };
}

export interface SpikeEvent {
  stationId: string;
  stationName: string;
  parameter: string;
  value: number;
  threshold: number;
  severity: "warning" | "critical";
  step: number;
  description: string;
}

// ─── Scenario Library ───────────────────────────────────────────────────────

export const scenarios: ScenarioDefinition[] = [
  {
    id: "summer-storm",
    name: "Summer Thunderstorm",
    description:
      "A 2-inch thunderstorm hits DC in July, flushing urban runoff into tributaries. Watch turbidity spike at upstream stations and propagate downstream over 48 hours.",
    icon: "CloudRain",
    color: "blue",
    accentHex: "#3B82F6",
    duration: 48,
    affectedParams: ["turbidity", "eColiCount", "dissolvedOxygen"],
    sourceStations: ["WB-001", "HR-001", "SW-001"],
    peakStep: 6,
    category: "storm",
  },
  {
    id: "cso-overflow",
    name: "Combined Sewer Overflow",
    description:
      "Heavy rainfall triggers a CSO event near Benning Road. Raw sewage mixes with stormwater, causing E. coli to spike dangerously at mid-river stations before reaching the tidal zone.",
    icon: "AlertTriangle",
    color: "red",
    accentHex: "#EF4444",
    duration: 72,
    affectedParams: ["eColiCount", "dissolvedOxygen", "pH", "turbidity"],
    sourceStations: ["SW-001", "SW-002"],
    peakStep: 4,
    category: "cso",
  },
  {
    id: "construction-runoff",
    name: "Construction Site Runoff",
    description:
      "Inadequate erosion controls at a construction site near Kenilworth release sediment-laden runoff during a rainstorm. Turbidity rises sharply at nearby stations.",
    icon: "Construction",
    color: "amber",
    accentHex: "#F59E0B",
    duration: 36,
    affectedParams: ["turbidity", "dissolvedOxygen"],
    sourceStations: ["ANA-002"],
    peakStep: 3,
    category: "construction",
  },
  {
    id: "summer-heatwave",
    name: "Summer Heat Wave",
    description:
      "A 5-day heat wave pushes water temperatures above 28°C. Dissolved oxygen drops below EPA minimums at multiple stations, stressing aquatic life throughout the watershed.",
    icon: "Thermometer",
    color: "orange",
    accentHex: "#F97316",
    duration: 120,
    affectedParams: ["dissolvedOxygen", "temperature"],
    sourceStations: ["ANA-001", "ANA-002", "ANA-003", "ANA-004"],
    peakStep: 72,
    category: "seasonal",
  },
  {
    id: "spring-flush",
    name: "Spring First Flush",
    description:
      "The season's first major rain after winter washes months of accumulated pollutants — road salt, oil, sediment — into waterways. Every parameter spikes simultaneously across the watershed.",
    icon: "Droplets",
    color: "emerald",
    accentHex: "#10B981",
    duration: 60,
    affectedParams: ["turbidity", "eColiCount", "dissolvedOxygen", "pH"],
    sourceStations: ["WB-001", "HR-001", "PB-001", "SW-001", "SW-002"],
    peakStep: 8,
    category: "storm",
  },
];

// ─── Simulation Engine ──────────────────────────────────────────────────────

// Station flow order (upstream to downstream)
const FLOW_ORDER: Record<string, number> = {
  "GI-001": 0,
  "GI-002": 1,
  "GI-003": 2,
  "HR-001": 10,
  "WB-001": 15,
  "ANA-001": 20,
  "PB-001": 25,
  "ANA-002": 30,
  "SW-001": 35,
  "ANA-004": 40,
  "SW-002": 45,
  "ANA-003": 50,
};

function getFlowDelay(sourceIds: string[], targetId: string): number {
  const sourcePos = Math.min(...sourceIds.map((id) => FLOW_ORDER[id] ?? 50));
  const targetPos = FLOW_ORDER[targetId] ?? 50;
  const distance = Math.abs(targetPos - sourcePos);
  return Math.max(0, distance * 0.3); // ~0.3 hours per flow unit
}

function gaussianPulse(t: number, peak: number, width: number): number {
  return Math.exp(-((t - peak) ** 2) / (2 * width ** 2));
}

function getBaselineValues(stationId: string, monthIndex: number = 6) {
  // 1) Try real ingested data first (month is 1-indexed in the API, monthIndex is 0-indexed)
  const monthNum = monthIndex + 1;
  if (realBaselines && realBaselines[stationId] && realBaselines[stationId][monthNum]) {
    const rb = realBaselines[stationId][monthNum];
    return {
      dissolvedOxygen: rb.dissolvedOxygen,
      temperature: rb.temperature,
      pH: rb.pH,
      turbidity: rb.turbidity,
      eColiCount: rb.eColiCount,
    };
  }

  // 2) Fall back to hardcoded seasonal profiles
  const hist = getStationHistoricalData(stationId);
  if (!hist) {
    return { dissolvedOxygen: 7, temperature: 20, pH: 7.0, turbidity: 20, eColiCount: 300 };
  }
  const d = hist.data[monthIndex];
  return {
    dissolvedOxygen: d.dissolvedOxygen,
    temperature: d.temperature,
    pH: d.pH,
    turbidity: d.turbidity,
    eColiCount: d.eColiCount,
  };
}

function getStationStatus(
  values: StationSnapshot["values"],
  baseline: StationSnapshot["values"]
): StationSnapshot["status"] {
  const turbRatio = values.turbidity / Math.max(baseline.turbidity, 1);
  const ecoliRatio = values.eColiCount / Math.max(baseline.eColiCount, 1);
  const doDropPct = (baseline.dissolvedOxygen - values.dissolvedOxygen) / Math.max(baseline.dissolvedOxygen, 1);

  if (turbRatio > 4 || ecoliRatio > 4 || values.dissolvedOxygen < 3 || doDropPct > 0.5) return "critical";
  if (turbRatio > 2.5 || ecoliRatio > 2.5 || values.dissolvedOxygen < 4 || doDropPct > 0.3) return "warning";
  if (turbRatio > 1.5 || ecoliRatio > 1.5 || doDropPct > 0.15) return "elevated";
  return "normal";
}

export function generateScenarioFrames(scenarioId: string): ScenarioFrame[] {
  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario) return [];

  const waterStations = monitoringStations.filter(
    (s) => s.type === "river" || s.type === "stream" || s.type === "stormwater"
  );

  const frames: ScenarioFrame[] = [];

  for (let step = 0; step <= scenario.duration; step++) {
    const snapshots: StationSnapshot[] = [];
    const spikes: SpikeEvent[] = [];

    for (const station of waterStations) {
      const baseline = getBaselineValues(station.id);
      const flowDelay = getFlowDelay(scenario.sourceStations, station.id);
      const isSource = scenario.sourceStations.includes(station.id);
      const elapsed = step - flowDelay;

      // Proximity factor: source stations get full impact, others decay
      const proximity = isSource ? 1.0 : Math.max(0.1, 1 - flowDelay / 30);

      let turbMultiplier = 1;
      let ecoliMultiplier = 1;
      let doOffset = 0;
      let tempOffset = 0;
      let phOffset = 0;

      if (elapsed > 0) {
        const pulseWidth = scenario.category === "seasonal" ? 30 : scenario.category === "cso" ? 6 : 8;
        const intensity = gaussianPulse(elapsed, scenario.peakStep, pulseWidth) * proximity;

        switch (scenario.category) {
          case "storm":
            turbMultiplier = 1 + intensity * 5;
            ecoliMultiplier = 1 + intensity * 4;
            doOffset = -intensity * 3;
            phOffset = -intensity * 0.3;
            break;
          case "cso":
            turbMultiplier = 1 + intensity * 4;
            ecoliMultiplier = 1 + intensity * 8;
            doOffset = -intensity * 4;
            phOffset = -intensity * 0.5;
            break;
          case "construction":
            turbMultiplier = 1 + intensity * 7;
            ecoliMultiplier = 1 + intensity * 1.5;
            doOffset = -intensity * 2;
            break;
          case "seasonal":
            tempOffset = intensity * 4;
            doOffset = -intensity * 3.5;
            break;
        }
      }

      const values = {
        dissolvedOxygen: Math.max(0.5, baseline.dissolvedOxygen + doOffset),
        temperature: Math.min(35, baseline.temperature + tempOffset),
        pH: Math.max(6.0, Math.min(9.0, baseline.pH + phOffset)),
        turbidity: Math.round(baseline.turbidity * turbMultiplier * 10) / 10,
        eColiCount: Math.round(baseline.eColiCount * ecoliMultiplier),
      };

      const status = getStationStatus(values, baseline);

      snapshots.push({
        stationId: station.id,
        stationName: station.name,
        position: station.position,
        type: station.type,
        values,
        status,
        changeFromBaseline: {
          dissolvedOxygen: Math.round((values.dissolvedOxygen - baseline.dissolvedOxygen) * 100) / 100,
          turbidity: Math.round((values.turbidity - baseline.turbidity) * 10) / 10,
          eColiCount: values.eColiCount - baseline.eColiCount,
        },
      });

      // Spike detection
      if (values.turbidity > 50 && values.turbidity > baseline.turbidity * 2) {
        spikes.push({
          stationId: station.id,
          stationName: station.name,
          parameter: "Turbidity",
          value: values.turbidity,
          threshold: 50,
          severity: values.turbidity > 100 ? "critical" : "warning",
          step,
          description: `Turbidity at ${values.turbidity} NTU (${(values.turbidity / baseline.turbidity).toFixed(1)}x baseline)`,
        });
      }
      if (values.eColiCount > 410) {
        spikes.push({
          stationId: station.id,
          stationName: station.name,
          parameter: "E. coli",
          value: values.eColiCount,
          threshold: 410,
          severity: values.eColiCount > 1000 ? "critical" : "warning",
          step,
          description: `E. coli at ${values.eColiCount} CFU/100mL (EPA limit: 410)`,
        });
      }
      if (values.dissolvedOxygen < 5) {
        spikes.push({
          stationId: station.id,
          stationName: station.name,
          parameter: "Dissolved Oxygen",
          value: values.dissolvedOxygen,
          threshold: 5,
          severity: values.dissolvedOxygen < 3 ? "critical" : "warning",
          step,
          description: `DO at ${values.dissolvedOxygen.toFixed(1)} mg/L (EPA min: 5.0)`,
        });
      }
    }

    frames.push({ step, hour: step, stations: snapshots, spikes });
  }

  return frames;
}

// ─── Spike Summary ──────────────────────────────────────────────────────────

export interface SpikeSummary {
  totalSpikes: number;
  criticalSpikes: number;
  warningSpikes: number;
  mostAffectedStation: string;
  peakHour: number;
  parameters: { name: string; count: number }[];
}

export function getSpikeSummary(frames: ScenarioFrame[]): SpikeSummary {
  const allSpikes = frames.flatMap((f) => f.spikes);
  const stationCounts: Record<string, number> = {};
  const paramCounts: Record<string, number> = {};
  let peakHour = 0;
  let peakCount = 0;

  for (const spike of allSpikes) {
    stationCounts[spike.stationName] = (stationCounts[spike.stationName] || 0) + 1;
    paramCounts[spike.parameter] = (paramCounts[spike.parameter] || 0) + 1;
  }

  for (const frame of frames) {
    if (frame.spikes.length > peakCount) {
      peakCount = frame.spikes.length;
      peakHour = frame.hour;
    }
  }

  const mostAffected = Object.entries(stationCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    totalSpikes: allSpikes.length,
    criticalSpikes: allSpikes.filter((s) => s.severity === "critical").length,
    warningSpikes: allSpikes.filter((s) => s.severity === "warning").length,
    mostAffectedStation: mostAffected?.[0] ?? "None",
    peakHour,
    parameters: Object.entries(paramCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}
