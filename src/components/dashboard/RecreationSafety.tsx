"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Droplets, Activity, Thermometer, Waves, Clock, MapPin, TrendingDown, TrendingUp, Minus, Info } from "lucide-react";
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

type SafetyLevel = "safe" | "caution" | "unsafe" | "no-data";

interface ParamAssessment {
  label: string;
  value: number | null;
  unit: string;
  epaLimit: string;
  level: SafetyLevel;
  message: string;
  pct: number; // 0-100, how close to threshold
}

function assessParam(label: string, value: number | null, unit: string, epaLimit: string, opts: { min?: number; max?: number; cautionMin?: number; cautionMax?: number }): ParamAssessment {
  if (value == null) return { label, value, unit, epaLimit, level: "no-data", message: "No data available", pct: 0 };
  let level: SafetyLevel = "safe";
  let message = "Within safe range";
  let pct = 0;

  if (opts.max != null) {
    pct = Math.min(100, (value / opts.max) * 100);
    if (value > opts.max) { level = "unsafe"; message = `Exceeds EPA limit of ${opts.max} ${unit}`; pct = 100; }
    else if (opts.cautionMax && value > opts.cautionMax) { level = "caution"; message = `Approaching EPA limit`; }
  }
  if (opts.min != null) {
    pct = Math.min(100, opts.min > 0 ? ((opts.min - Math.min(value, opts.min)) / opts.min) * 100 + (value >= opts.min ? 0 : 50) : 0);
    if (value < opts.min) { level = "unsafe"; message = `Below EPA minimum of ${opts.min} ${unit}`; pct = 100; }
    else if (opts.cautionMin && value < opts.cautionMin) { level = "caution"; message = `Approaching EPA minimum`; }
    else { pct = 0; }
  }

  return { label, value, unit, epaLimit, level, message, pct };
}

function assessStation(station: StationData): { overall: SafetyLevel; params: ParamAssessment[]; freshness: string; isFresh: boolean } {
  const r = station.lastReading;
  if (!r || !r.timestamp) return { overall: "no-data", params: [], freshness: "No data", isFresh: false };

  // Data freshness
  const ageMs = Date.now() - new Date(r.timestamp).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const isFresh = ageHours < 6;
  const freshness = ageHours < 1 ? "< 1 hour ago" : ageHours < 24 ? `${Math.round(ageHours)} hours ago` : `${Math.round(ageHours / 24)} days ago`;

  const params: ParamAssessment[] = [
    assessParam("E. coli", r.eColiCount, "CFU/100mL", "Max 410", { max: 410, cautionMax: 235 }),
    assessParam("Dissolved Oxygen", r.dissolvedOxygen, "mg/L", "Min 5.0", { min: 5.0, cautionMin: 6.0 }),
    assessParam("pH", r.pH, "", "6.5 - 9.0", { min: 6.5, max: 9.0, cautionMin: 6.8, cautionMax: 8.5 }),
    assessParam("Turbidity", r.turbidity, "NTU", "Max 50", { max: 50, cautionMax: 25 }),
    assessParam("Temperature", r.temperature, "°C", "Max 32", { max: 32, cautionMax: 28 }),
  ];

  const measured = params.filter(p => p.level !== "no-data");
  const hasUnsafe = measured.some(p => p.level === "unsafe");
  const hasCaution = measured.some(p => p.level === "caution");
  const overall: SafetyLevel = measured.length === 0 ? "no-data" : hasUnsafe ? "unsafe" : hasCaution ? "caution" : "safe";

  return { overall, params, freshness, isFresh };
}

const LEVEL_STYLE = {
  safe: {
    label: "Safe for Recreation",
    summary: "All measured parameters are within EPA recreational water quality standards.",
    gradient: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-500",
    textColor: "text-emerald-500",
    pillDark: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pillLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    barColor: "bg-emerald-500",
  },
  caution: {
    label: "Caution Advised",
    summary: "Some parameters are elevated. Limit water contact and avoid swallowing water.",
    gradient: "from-amber-500 to-orange-500",
    iconBg: "bg-amber-500",
    textColor: "text-amber-500",
    pillDark: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    pillLight: "bg-amber-50 text-amber-700 border-amber-200",
    barColor: "bg-amber-500",
  },
  unsafe: {
    label: "Avoid Water Contact",
    summary: "Water quality exceeds EPA recreational limits. Do not swim, wade, or allow pets in the water.",
    gradient: "from-red-500 to-rose-500",
    iconBg: "bg-red-500",
    textColor: "text-red-500",
    pillDark: "bg-red-500/15 text-red-400 border-red-500/30",
    pillLight: "bg-red-50 text-red-700 border-red-200",
    barColor: "bg-red-500",
  },
  "no-data": {
    label: "No Recent Data",
    summary: "Insufficient sensor data to assess safety. Exercise caution near the water.",
    gradient: "from-slate-500 to-gray-500",
    iconBg: "bg-slate-500",
    textColor: "text-slate-400",
    pillDark: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    pillLight: "bg-slate-50 text-slate-600 border-slate-200",
    barColor: "bg-slate-400",
  },
};

const LEVEL_ICON = { safe: ShieldCheck, caution: AlertTriangle, unsafe: ShieldAlert, "no-data": Info };
const PARAM_ICON: Record<string, typeof Droplets> = { "E. coli": AlertTriangle, "Dissolved Oxygen": Droplets, "pH": Activity, "Turbidity": Waves, "Temperature": Thermometer };

// Stations relevant for public recreation (Anacostia corridor, Wards 7 & 8)
const RECREATION_STATIONS = ["ANA-002", "ANA-003", "WB-001", "HR-001"];

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
        // Only active stations with real (non-seed) readings
        setStations(all.filter((s) =>
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
      <div className={`rounded-2xl border p-5 animate-pulse ${isDark ? "bg-[#13161F]/90 border-white/[0.06]" : "bg-white border-[#D1D5DB]"}`}>
        <div className={`h-5 rounded w-48 mb-3 ${isDark ? "bg-white/[0.06]" : "bg-[#E5E7EB]"}`} />
        <div className={`h-16 rounded w-full mb-3 ${isDark ? "bg-white/[0.06]" : "bg-[#E5E7EB]"}`} />
        <div className={`h-3 rounded w-56 ${isDark ? "bg-white/[0.06]" : "bg-[#E5E7EB]"}`} />
      </div>
    );
  }

  const assessments = stations.map(s => ({ station: s, ...assessStation(s) }));
  const measured = assessments.filter(a => a.overall !== "no-data");
  const safeCount = measured.filter(a => a.overall === "safe").length;
  const cautionCount = measured.filter(a => a.overall === "caution").length;
  const unsafeCount = measured.filter(a => a.overall === "unsafe").length;

  // Overall: worst station with real data
  const basinLevel: SafetyLevel = measured.length === 0 ? "no-data" : unsafeCount > 0 ? "unsafe" : cautionCount > 0 ? "caution" : "safe";
  const style = LEVEL_STYLE[basinLevel];
  const StatusIcon = LEVEL_ICON[basinLevel];

  // Latest timestamp across all stations
  const latestTimestamp = assessments
    .filter(a => a.station.lastReading?.timestamp)
    .map(a => new Date(a.station.lastReading!.timestamp).getTime())
    .reduce((max, t) => Math.max(max, t), 0);
  const lastUpdated = latestTimestamp > 0 ? new Date(latestTimestamp) : null;

  // Collect worst reading per parameter (only from real data)
  const worstParams = new Map<string, ParamAssessment>();
  for (const a of assessments) {
    for (const p of a.params) {
      if (p.level === "no-data") continue;
      const existing = worstParams.get(p.label);
      const rank = { safe: 0, caution: 1, unsafe: 2, "no-data": -1 };
      if (!existing || rank[p.level] > rank[existing.level]) worstParams.set(p.label, p);
    }
  }

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#13161F]/90 border-white/[0.06] shadow-lg shadow-black/20" : "bg-white border-[#D1D5DB] shadow-md"}`}>

      {/* Hero status bar */}
      <div className={`relative px-5 py-4 bg-gradient-to-r ${style.gradient}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <StatusIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Is It Safe Today?</h3>
              <p className="text-white/80 text-xs font-medium">{style.label}</p>
            </div>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
              <Clock className="w-3 h-3 text-white/80" />
              <span className="text-[10px] text-white/90 font-medium">
                {lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Summary message */}
        <p className={`text-xs leading-relaxed mb-4 ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
          {style.summary}
          {measured.length > 0 && ` Based on real-time USGS sensor readings from ${measured.length} active monitoring station${measured.length > 1 ? "s" : ""}.`}
        </p>

        {/* Station status pills */}
        {measured.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <MapPin className={`w-3 h-3 ${isDark ? "text-env-teal" : "text-teal-600"}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
                Anacostia Corridor Stations
              </span>
            </div>
            <div className="space-y-2">
              {assessments.map((a) => {
                const sStyle = LEVEL_STYLE[a.overall];
                const SIcon = LEVEL_ICON[a.overall];
                const shortName = a.station.name
                  .replace("Anacostia at ", "")
                  .replace("Watts Branch at ", "Watts Branch — ")
                  .replace("Hickey Run at ", "Hickey Run — ");

                return (
                  <div key={a.station.id} className={`flex items-center gap-3 rounded-xl border p-3 ${isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-[#E5E7EB] bg-[#FAFAFA]"}`}>
                    <div className={`p-1.5 rounded-lg ${isDark ? "bg-white/[0.04]" : "bg-white"}`}>
                      <SIcon className={`w-4 h-4 ${sStyle.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-[#111827]"}`}>{shortName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDark ? sStyle.pillDark : sStyle.pillLight}`}>
                          {sStyle.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {a.params.filter(p => p.level !== "no-data").slice(0, 3).map(p => (
                          <span key={p.label} className={`text-[9px] ${isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}>
                            {p.label.replace("Dissolved Oxygen", "DO")}: <span className={LEVEL_STYLE[p.level].textColor}>{p.value} {p.unit}</span>
                          </span>
                        ))}
                        <span className={`text-[9px] flex items-center gap-0.5 ${a.isFresh ? (isDark ? "text-emerald-500" : "text-emerald-600") : (isDark ? "text-[#6B7280]" : "text-[#9CA3AF]")}`}>
                          <Clock className="w-2.5 h-2.5" />{a.freshness}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Parameter gauges */}
        {worstParams.size > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Activity className={`w-3 h-3 ${isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
                EPA Parameter Assessment
              </span>
            </div>
            <div className="space-y-2">
              {Array.from(worstParams.values()).map((p) => {
                const pStyle = LEVEL_STYLE[p.level];
                const PIcon = PARAM_ICON[p.label] || Activity;
                // Bar width: for "safe" show how good, for "unsafe" show how bad
                const barPct = p.level === "safe" ? Math.max(10, 100 - p.pct) : Math.max(10, p.pct);

                return (
                  <div key={p.label} className={`rounded-xl border p-3 ${isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-[#E5E7EB] bg-[#FAFAFA]"}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <PIcon className={`w-3.5 h-3.5 ${pStyle.textColor}`} />
                        <span className={`text-[11px] font-semibold ${isDark ? "text-[#E5E7EB]" : "text-[#111827]"}`}>{p.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${pStyle.textColor}`}>
                          {p.value != null ? `${p.value} ${p.unit}` : "—"}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${isDark ? pStyle.pillDark : pStyle.pillLight}`}>
                          {p.epaLimit}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.06]" : "bg-[#E5E7EB]"}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${pStyle.barColor}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <p className={`text-[9px] mt-1 ${isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}>{p.message}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Data source footer */}
      <div className={`px-4 sm:px-5 py-2.5 border-t ${isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-[#E5E7EB] bg-[#FAFAFA]"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-[9px] ${isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}>
              Source: USGS NWIS real-time sensors
            </span>
            <span className={`text-[9px] flex items-center gap-1 ${isDark ? "text-emerald-500/70" : "text-emerald-600/70"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Updated hourly
            </span>
          </div>
          <span className={`text-[9px] ${isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}>
            EPA 2012 Recreational Water Quality Criteria
          </span>
        </div>
      </div>
    </div>
  );
}
