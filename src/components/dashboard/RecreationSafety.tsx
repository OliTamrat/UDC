"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Waves, Droplets, Activity, Thermometer, Info, MapPin } from "lucide-react";
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
    timestamp: string;
  };
}

type SafetyLevel = "safe" | "caution" | "unsafe";

interface ParameterCheck {
  label: string;
  value: number | null;
  unit: string;
  threshold: string;
  level: SafetyLevel;
  message: string;
  icon: typeof Droplets;
}

function assessStation(station: StationData): { overall: SafetyLevel; checks: ParameterCheck[] } {
  const r = station.lastReading;
  if (!r) return { overall: "caution", checks: [] };

  const checks: ParameterCheck[] = [];

  // E. coli — EPA 2012 Recreational Water Quality Criteria
  if (r.eColiCount != null) {
    const level: SafetyLevel = r.eColiCount > 410 ? "unsafe" : r.eColiCount > 235 ? "caution" : "safe";
    checks.push({
      label: "E. coli",
      value: r.eColiCount,
      unit: "CFU/100mL",
      threshold: "EPA limit: 410",
      level,
      message: level === "unsafe" ? "Exceeds EPA swimming limit" : level === "caution" ? "Elevated — avoid prolonged contact" : "Within safe range",
      icon: AlertTriangle,
    });
  }

  // Dissolved Oxygen — hypoxia risk
  if (r.dissolvedOxygen != null) {
    const level: SafetyLevel = r.dissolvedOxygen < 2 ? "unsafe" : r.dissolvedOxygen < 5 ? "caution" : "safe";
    checks.push({
      label: "Dissolved Oxygen",
      value: r.dissolvedOxygen,
      unit: "mg/L",
      threshold: "EPA min: 5.0",
      level,
      message: level === "unsafe" ? "Hypoxic — dead zone conditions" : level === "caution" ? "Below EPA aquatic life standard" : "Healthy oxygen levels",
      icon: Droplets,
    });
  }

  // pH — skin/eye irritation
  if (r.pH != null) {
    const level: SafetyLevel = r.pH < 6.0 || r.pH > 9.5 ? "unsafe" : r.pH < 6.5 || r.pH > 9.0 ? "caution" : "safe";
    checks.push({
      label: "pH Level",
      value: r.pH,
      unit: "std units",
      threshold: "Safe range: 6.5–9.0",
      level,
      message: level === "unsafe" ? "Risk of skin/eye irritation" : level === "caution" ? "Slightly outside optimal range" : "Neutral, safe range",
      icon: Activity,
    });
  }

  // Turbidity — visibility
  if (r.turbidity != null) {
    const level: SafetyLevel = r.turbidity > 50 ? "unsafe" : r.turbidity > 25 ? "caution" : "safe";
    checks.push({
      label: "Turbidity",
      value: r.turbidity,
      unit: "NTU",
      threshold: "Concern: > 50",
      level,
      message: level === "unsafe" ? "Very low visibility — unsafe for wading" : level === "caution" ? "Reduced visibility" : "Clear water conditions",
      icon: Waves,
    });
  }

  // Temperature — thermal stress
  if (r.temperature != null) {
    const level: SafetyLevel = r.temperature > 32 ? "caution" : r.temperature < 4 ? "caution" : "safe";
    checks.push({
      label: "Temperature",
      value: r.temperature,
      unit: "°C",
      threshold: "Comfort: 4–32°C",
      level,
      message: level === "caution" ? "Extreme temperature — exercise caution" : "Comfortable range",
      icon: Thermometer,
    });
  }

  // Overall: worst parameter wins
  const hasUnsafe = checks.some((c) => c.level === "unsafe");
  const hasCaution = checks.some((c) => c.level === "caution");
  const overall: SafetyLevel = hasUnsafe ? "unsafe" : hasCaution ? "caution" : "safe";

  return { overall, checks };
}

const LEVEL_CONFIG: Record<SafetyLevel, {
  label: string;
  message: string;
  icon: typeof ShieldCheck;
  color: string;
  bgDark: string;
  bgLight: string;
  borderDark: string;
  borderLight: string;
  badgeDark: string;
  badgeLight: string;
}> = {
  safe: {
    label: "Safe for Recreation",
    message: "Water quality conditions are within EPA recreational standards. Enjoy the waterway responsibly.",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bgDark: "bg-emerald-950/30",
    bgLight: "bg-emerald-50",
    borderDark: "border-emerald-500/20",
    borderLight: "border-emerald-300",
    badgeDark: "bg-emerald-500/15 text-emerald-400",
    badgeLight: "bg-emerald-100 text-emerald-700",
  },
  caution: {
    label: "Caution Advised",
    message: "Some parameters are elevated. Avoid prolonged water contact and keep wounds covered.",
    icon: AlertTriangle,
    color: "text-amber-500",
    bgDark: "bg-amber-950/20",
    bgLight: "bg-amber-50",
    borderDark: "border-amber-500/20",
    borderLight: "border-amber-300",
    badgeDark: "bg-amber-500/15 text-amber-400",
    badgeLight: "bg-amber-100 text-amber-700",
  },
  unsafe: {
    label: "Avoid Water Contact",
    message: "Water quality exceeds EPA recreational limits. Do not swim, wade, or allow pets in the water.",
    icon: ShieldAlert,
    color: "text-red-500",
    bgDark: "bg-red-950/20",
    bgLight: "bg-red-50",
    borderDark: "border-red-500/20",
    borderLight: "border-red-300",
    badgeDark: "bg-red-500/15 text-red-400",
    badgeLight: "bg-red-100 text-red-700",
  },
};

// Focus on EJ community stations (Wards 7 & 8 — Anacostia corridor)
const EJ_STATIONS = ["ANA-002", "ANA-003", "WB-001", "SW-001", "SW-002"];

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
        // Focus on active river/stream stations near communities
        setStations(all.filter((s) => s.type === "river" || s.type === "stream" || s.type === "stormwater"));
      }
    } catch {
      // Fallback silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className={`rounded-2xl border p-5 animate-pulse ${
        isDark ? "bg-[#13161F]/90 border-white/[0.06]" : "bg-white border-[#D1D5DB]"
      }`}>
        <div className={`h-5 rounded w-48 mb-3 ${isDark ? "bg-white/[0.06]" : "bg-[#E5E7EB]"}`} />
        <div className={`h-3 rounded w-72 mb-2 ${isDark ? "bg-white/[0.06]" : "bg-[#E5E7EB]"}`} />
        <div className={`h-3 rounded w-56 ${isDark ? "bg-white/[0.06]" : "bg-[#E5E7EB]"}`} />
      </div>
    );
  }

  // Assess each station
  const assessments = stations.map((s) => ({ station: s, ...assessStation(s) }));

  // Overall basin safety = worst station
  const hasUnsafe = assessments.some((a) => a.overall === "unsafe");
  const hasCaution = assessments.some((a) => a.overall === "caution");
  const basinLevel: SafetyLevel = hasUnsafe ? "unsafe" : hasCaution ? "caution" : "safe";
  const config = LEVEL_CONFIG[basinLevel];
  const Icon = config.icon;

  // EJ focus stations
  const ejAssessments = assessments.filter((a) => EJ_STATIONS.includes(a.station.id));

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      isDark
        ? `${config.bgDark} ${config.borderDark} shadow-lg shadow-black/20 backdrop-blur-sm`
        : `${config.bgLight} ${config.borderLight} shadow-md shadow-black/[0.08] backdrop-blur-sm`
    }`}>
      {/* Header with status */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ring-1 ring-white/[0.06] ${
              isDark ? config.badgeDark : config.badgeLight
            }`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>
                Is It Safe Today?
              </h3>
              <p className={`text-[10px] font-medium uppercase tracking-wider ${config.color}`}>
                {config.label}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            isDark ? config.badgeDark : config.badgeLight
          }`}>
            {basinLevel === "safe" ? "ALL CLEAR" : basinLevel === "caution" ? "ADVISORY" : "WARNING"}
          </span>
        </div>

        <p className={`text-xs leading-relaxed mb-4 ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
          {config.message}
        </p>

        {/* EJ Focus — Wards 7 & 8 station cards */}
        {ejAssessments.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className={`w-3 h-3 ${isDark ? "text-env-teal" : "text-teal-600"}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
                Wards 7 &amp; 8 — Community Stations
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ejAssessments.map((a) => {
                const sConfig = LEVEL_CONFIG[a.overall];
                const SIcon = sConfig.icon;
                return (
                  <div
                    key={a.station.id}
                    className={`rounded-xl border p-3 ${
                      isDark
                        ? `${sConfig.bgDark} ${sConfig.borderDark}`
                        : `${sConfig.bgLight} ${sConfig.borderLight}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>
                        {a.station.name.replace("Anacostia at ", "").replace("Watts Branch at ", "Watts Br. ")}
                      </span>
                      <SIcon className={`w-3.5 h-3.5 ${sConfig.color}`} />
                    </div>
                    <span className={`text-[10px] font-medium ${sConfig.color}`}>
                      {sConfig.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Parameter breakdown — worst readings across all stations */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Info className={`w-3 h-3 ${isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"}`} />
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
              Parameter Assessment
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(() => {
              // Collect worst reading per parameter across all stations
              const worstByParam = new Map<string, ParameterCheck>();
              for (const a of assessments) {
                for (const c of a.checks) {
                  const existing = worstByParam.get(c.label);
                  const rank = { safe: 0, caution: 1, unsafe: 2 };
                  if (!existing || rank[c.level] > rank[existing.level]) {
                    worstByParam.set(c.label, c);
                  }
                }
              }
              return Array.from(worstByParam.values()).map((check) => {
                const cConfig = LEVEL_CONFIG[check.level];
                const CIcon = check.icon;
                return (
                  <div
                    key={check.label}
                    className={`flex items-center gap-3 rounded-lg border p-2.5 ${
                      isDark
                        ? "border-white/[0.06] bg-white/[0.02]"
                        : "border-[#D1D5DB]/50 bg-white/50"
                    }`}
                  >
                    <CIcon className={`w-4 h-4 flex-shrink-0 ${cConfig.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-medium ${isDark ? "text-[#E5E7EB]" : "text-[#111827]"}`}>
                          {check.label}
                        </span>
                        <span className={`text-[10px] font-bold ${cConfig.color}`}>
                          {check.value != null ? `${check.value} ${check.unit}` : "—"}
                        </span>
                      </div>
                      <span className={`text-[9px] ${isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}>
                        {check.message}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Safety tips footer */}
      <div className={`px-4 sm:px-5 py-3 border-t ${
        isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-[#D1D5DB]/50 bg-white/30"
      }`}>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {[
            "Cover open wounds",
            "Don't swallow water",
            "Wash hands after contact",
            "Keep pets leashed",
          ].map((tip) => (
            <span key={tip} className={`text-[9px] flex items-center gap-1 ${isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}>
              <span className="w-1 h-1 rounded-full bg-current" />
              {tip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
