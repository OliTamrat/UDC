"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Droplets, Activity, Thermometer, Clock, FlaskConical } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface StationData {
  id: string;
  name: string;
  status: string;
  type: string;
  lastReading?: {
    dissolvedOxygen: number | null;
    pH: number | null;
    turbidity: number | null;
    eColiCount: number | null;
    temperature: number | null;
    conductivity: number | null;
    timestamp: string;
    source?: string;
  };
}

type Level = "good" | "caution" | "concern" | "unknown";

const RECREATION_STATIONS = ["ANA-002", "ANA-003", "WB-001", "HR-001"];

function getParamLevel(param: string, value: number | null): { level: Level; display: string } {
  if (value == null) return { level: "unknown", display: "—" };
  switch (param) {
    case "do":
      return value >= 5.0
        ? { level: "good", display: `${value} mg/L` }
        : { level: "concern", display: `${value} mg/L` };
    case "ph":
      return value >= 6.5 && value <= 9.0
        ? { level: "good", display: `${value}` }
        : { level: "caution", display: `${value}` };
    case "temp":
      return value <= 32
        ? { level: "good", display: `${value}°C` }
        : { level: "caution", display: `${value}°C` };
    default:
      return { level: "unknown", display: `${value}` };
  }
}

const DOT_COLORS: Record<Level, string> = {
  good: "bg-emerald-500",
  caution: "bg-amber-500",
  concern: "bg-red-500",
  unknown: "bg-slate-400",
};

export default function RecreationSafety() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [stations, setStations] = useState<StationData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/stations");
      if (res.ok) {
        const all: StationData[] = await res.json();
        setStations(all.filter(s =>
          RECREATION_STATIONS.includes(s.id) &&
          s.status === "active" &&
          s.lastReading?.source !== "seed"
        ));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className={`rounded-2xl border p-4 animate-pulse ${isDark ? "bg-[#13161F]/90 border-white/[0.06]" : "bg-white border-[#D1D5DB]"}`}>
        <div className={`h-4 rounded w-40 mb-2 ${isDark ? "bg-white/[0.06]" : "bg-[#E5E7EB]"}`} />
        <div className={`h-12 rounded w-full ${isDark ? "bg-white/[0.06]" : "bg-[#E5E7EB]"}`} />
      </div>
    );
  }

  // Check if any station has DO below EPA min
  const hasLowDO = stations.some(s => s.lastReading?.dissolvedOxygen != null && s.lastReading.dissolvedOxygen < 5.0);
  const hasBadPH = stations.some(s => s.lastReading?.pH != null && (s.lastReading.pH < 6.5 || s.lastReading.pH > 9.0));
  // E. coli: check if ANY real (non-seed) ecoli data exists
  const hasEcoliData = stations.some(s => s.lastReading?.eColiCount != null);

  // Overall: without E. coli we can't confirm "safe" — best we can say is parameters look OK
  const physicalOk = !hasLowDO && !hasBadPH;
  const overallLevel: Level = hasLowDO ? "concern" : hasBadPH ? "caution" : "good";

  // Latest timestamp
  const latestTs = stations
    .filter(s => s.lastReading?.timestamp)
    .map(s => new Date(s.lastReading!.timestamp).getTime())
    .reduce((max, t) => Math.max(max, t), 0);
  const ageHrs = latestTs > 0 ? (Date.now() - latestTs) / 3.6e6 : 999;
  const freshLabel = ageHrs < 1 ? "< 1 hr ago" : ageHrs < 24 ? `${Math.round(ageHrs)}h ago` : `${Math.round(ageHrs / 24)}d ago`;

  // Status config
  const statusColor = overallLevel === "good" ? "emerald" : overallLevel === "caution" ? "amber" : "red";
  const StatusIcon = overallLevel === "good" ? ShieldCheck : overallLevel === "caution" ? AlertTriangle : ShieldAlert;
  const statusLabel = overallLevel === "good"
    ? "Physical Parameters OK"
    : overallLevel === "caution"
      ? "Caution Advised"
      : "Concern — Low Oxygen";

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#13161F]/90 border-white/[0.06] shadow-lg shadow-black/20" : "bg-white border-[#D1D5DB] shadow-md"}`}>
      {/* Compact header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg bg-${statusColor}-500/15`}>
            <StatusIcon className={`w-4 h-4 text-${statusColor}-500`} />
          </div>
          <div>
            <h3 className={`text-xs font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>
              Recreation Safety
            </h3>
            <p className={`text-[10px] font-medium text-${statusColor}-500`}>{statusLabel}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-[9px] ${isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          USGS Live · {freshLabel}
        </div>
      </div>

      {/* E. coli warning banner — the most important thing */}
      {!hasEcoliData && (
        <div className={`mx-4 mb-3 flex items-start gap-2 rounded-lg px-3 py-2 text-[10px] leading-relaxed ${isDark ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
          <FlaskConical className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">E. coli not measured by real-time sensors.</span> Lab results (EPA/WQP) required for full recreational safety assessment. Physical parameters (DO, pH, temperature) are monitored in real-time and shown below.
          </div>
        </div>
      )}

      {/* Compact station parameter grid */}
      <div className="px-4 pb-3">
        <table className="w-full text-[11px]">
          <thead>
            <tr className={`text-[9px] uppercase tracking-wider ${isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}>
              <th className="text-left font-semibold pb-1.5 pl-0">Station</th>
              <th className="text-center font-semibold pb-1.5">
                <span className="flex items-center justify-center gap-1"><Droplets className="w-2.5 h-2.5" />DO</span>
              </th>
              <th className="text-center font-semibold pb-1.5">
                <span className="flex items-center justify-center gap-1"><Activity className="w-2.5 h-2.5" />pH</span>
              </th>
              <th className="text-center font-semibold pb-1.5">
                <span className="flex items-center justify-center gap-1"><Thermometer className="w-2.5 h-2.5" />Temp</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {stations.map(s => {
              const r = s.lastReading;
              const doCheck = getParamLevel("do", r?.dissolvedOxygen ?? null);
              const phCheck = getParamLevel("ph", r?.pH ?? null);
              const tempCheck = getParamLevel("temp", r?.temperature ?? null);
              const shortName = s.name
                .replace("Anacostia at ", "")
                .replace("Watts Branch at ", "Watts Br.")
                .replace("Hickey Run at ", "Hickey Run");

              return (
                <tr key={s.id} className={`border-t ${isDark ? "border-white/[0.04]" : "border-[#F0F0F0]"}`}>
                  <td className={`py-2 pr-2 font-medium ${isDark ? "text-[#E5E7EB]" : "text-[#111827]"}`}>{shortName}</td>
                  <td className="py-2 text-center">
                    <span className="inline-flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[doCheck.level]}`} />
                      <span className={isDark ? "text-[#D1D5DB]" : "text-[#374151]"}>{doCheck.display}</span>
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="inline-flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[phCheck.level]}`} />
                      <span className={isDark ? "text-[#D1D5DB]" : "text-[#374151]"}>{phCheck.display}</span>
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="inline-flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[tempCheck.level]}`} />
                      <span className={isDark ? "text-[#D1D5DB]" : "text-[#374151]"}>{tempCheck.display}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Compact footer */}
      <div className={`px-4 py-2 border-t flex items-center justify-between text-[9px] ${isDark ? "border-white/[0.04] text-[#6B7280]" : "border-[#F0F0F0] text-[#9CA3AF]"}`}>
        <span>EPA 2012 Recreational Water Quality Criteria · DO min 5.0 mg/L · pH 6.5–9.0</span>
        <span>{stations.length} stations</span>
      </div>
    </div>
  );
}
