"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Droplets,
  Thermometer,
  Activity,
  AlertTriangle,
  TreePine,
  Waves,
  FlaskConical,
  Radio,
  TrendingUp,
  TrendingDown,
  Info,
  Shield,
  MapPin,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import type { MonitoringStation } from "@/data/dc-waterways";
import Modal from "@/components/Modal";

// ---------------------------------------------------------------------------
// Metrics computation
// ---------------------------------------------------------------------------
function computeMetrics(stations: MonitoringStation[]) {
  const active = stations.filter(
    (s) => s.status === "active" && s.lastReading && s.type !== "green-infrastructure"
  );
  const avg = (key: string) => {
    if (active.length === 0) return 0;
    const sum = active.reduce((acc, s) => {
      const reading = s.lastReading as unknown as Record<string, number>;
      return acc + (reading[key] || 0);
    }, 0);
    return Math.round((sum / active.length) * 10) / 10;
  };

  return {
    stations,
    active,
    activeCount: stations.filter((s) => s.status === "active").length,
    totalCount: stations.length,
    avgDO: avg("dissolvedOxygen"),
    avgTemp: avg("temperature"),
    avgPH: avg("pH"),
    avgTurbidity: avg("turbidity"),
    ecoliAlerts: stations.filter(
      (s) => s.lastReading && s.lastReading.eColiCount != null && s.lastReading.eColiCount > 400
    ),
    giStations: stations.filter((s) => s.type === "green-infrastructure"),
  };
}

type Metrics = ReturnType<typeof computeMetrics>;

// ---------------------------------------------------------------------------
// Card configurations
// ---------------------------------------------------------------------------
interface MetricCardConfig {
  label: string;
  getValue: (m: Metrics) => string;
  getTotal?: (m: Metrics) => string;
  unit?: string;
  icon: typeof Radio;
  color: string;
  bgColor: string;
  borderColor: string;
  lightBorderColor: string;
  lightBgColor: string;
  getTrend: (m: Metrics) => { text: string; positive: boolean };
  modalKey: string;
}

const cardConfigs: MetricCardConfig[] = [
  {
    label: "Active Stations",
    getValue: (m) => m.activeCount.toString(),
    getTotal: (m) => m.totalCount.toString(),
    icon: Radio,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    lightBorderColor: "border-green-200",
    lightBgColor: "bg-green-50",
    getTrend: () => ({ text: "+2 this month", positive: true }),
    modalKey: "stations",
  },
  {
    label: "Avg. Dissolved Oxygen",
    getValue: (m) => m.avgDO.toString(),
    unit: "mg/L",
    icon: Droplets,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    lightBorderColor: "border-blue-200",
    lightBgColor: "bg-blue-50",
    getTrend: (m) => ({
      text: m.avgDO >= 5 ? "Within EPA standards" : "Below EPA minimum",
      positive: m.avgDO >= 5,
    }),
    modalKey: "do",
  },
  {
    label: "Avg. Temperature",
    getValue: (m) => m.avgTemp.toString(),
    unit: "°C",
    icon: Thermometer,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    lightBorderColor: "border-cyan-200",
    lightBgColor: "bg-cyan-50",
    getTrend: () => ({ text: "Seasonal normal", positive: true }),
    modalKey: "temp",
  },
  {
    label: "Avg. pH Level",
    getValue: (m) => m.avgPH.toString(),
    icon: Activity,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    lightBorderColor: "border-emerald-200",
    lightBgColor: "bg-emerald-50",
    getTrend: (m) => ({
      text: m.avgPH >= 6.5 && m.avgPH <= 9.0 ? "Neutral range" : "Outside optimal range",
      positive: m.avgPH >= 6.5 && m.avgPH <= 9.0,
    }),
    modalKey: "ph",
  },
  {
    label: "Avg. Turbidity",
    getValue: (m) => m.avgTurbidity.toString(),
    unit: "NTU",
    icon: Waves,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    lightBorderColor: "border-amber-200",
    lightBgColor: "bg-amber-50",
    getTrend: (m) => ({
      text: m.avgTurbidity > 50 ? "Above baseline" : "Within normal range",
      positive: m.avgTurbidity <= 50,
    }),
    modalKey: "turbidity",
  },
  {
    label: "E. coli Alerts",
    getValue: (m) => m.ecoliAlerts.length.toString(),
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    lightBorderColor: "border-red-200",
    lightBgColor: "bg-red-50",
    getTrend: (m) => ({
      text: `${m.ecoliAlerts.length} station${m.ecoliAlerts.length !== 1 ? "s" : ""} above EPA limit`,
      positive: m.ecoliAlerts.length === 0,
    }),
    modalKey: "ecoli",
  },
  {
    label: "Green Infrastructure",
    getValue: (m) => m.giStations.length.toString(),
    icon: TreePine,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    lightBorderColor: "border-green-200",
    lightBgColor: "bg-green-50",
    getTrend: () => ({ text: "Active UDC sites", positive: true }),
    modalKey: "gi",
  },
  {
    label: "Active Research",
    getValue: () => "6",
    icon: FlaskConical,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    lightBorderColor: "border-purple-200",
    lightBgColor: "bg-purple-50",
    getTrend: () => ({ text: "WRRI/CAUSES projects", positive: true }),
    modalKey: "research",
  },
];

// ---------------------------------------------------------------------------
// Modal content components
// ---------------------------------------------------------------------------

function StationsModal({ metrics, isDark, router }: { metrics: Metrics; isDark: boolean; router: ReturnType<typeof useRouter> }) {
  const byStatus = {
    active: metrics.stations.filter((s) => s.status === "active"),
    maintenance: metrics.stations.filter((s) => s.status === "maintenance"),
    offline: metrics.stations.filter((s) => s.status === "offline"),
  };
  const byType = {
    river: metrics.stations.filter((s) => s.type === "river"),
    stream: metrics.stations.filter((s) => s.type === "stream"),
    stormwater: metrics.stations.filter((s) => s.type === "stormwater"),
    gi: metrics.stations.filter((s) => s.type === "green-infrastructure"),
  };

  return (
    <div className="space-y-5">
      <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        UDC&apos;s monitoring network consists of {metrics.totalCount} stations across the Anacostia
        watershed, tracking water quality parameters in real time. Each station measures temperature,
        dissolved oxygen, pH, turbidity, conductivity, and E. coli levels.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", count: byStatus.active.length, color: "text-green-400", bg: isDark ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200" },
          { label: "Maintenance", count: byStatus.maintenance.length, color: "text-amber-400", bg: isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200" },
          { label: "Offline", count: byStatus.offline.length, color: "text-slate-400", bg: isDark ? "bg-slate-500/10 border-slate-500/20" : "bg-slate-50 border-slate-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>By Type</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "River Monitoring", count: byType.river.length, color: "text-blue-400" },
            { label: "Stream Gauges", count: byType.stream.length, color: "text-cyan-400" },
            { label: "Stormwater BMP", count: byType.stormwater.length, color: "text-purple-400" },
            { label: "Green Infrastructure", count: byType.gi.length, color: "text-green-400" },
          ].map((t) => (
            <div key={t.label} className={`flex items-center gap-3 p-2.5 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
              <div className={`text-sm font-semibold ${t.color}`}>{t.count}</div>
              <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>All Stations</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {metrics.stations.map((s) => (
            <button
              key={s.id}
              onClick={() => router.push(`/station/${s.id}`)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className={`w-3.5 h-3.5 ${s.status === "active" ? "text-green-400" : s.status === "maintenance" ? "text-amber-400" : "text-slate-400"}`} />
                <div>
                  <div className={`text-xs font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{s.name}</div>
                  <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{s.id} &middot; {s.type.replace("-", " ")}</div>
                </div>
              </div>
              <ExternalLink className={`w-3 h-3 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DOModal({ metrics, isDark }: { metrics: Metrics; isDark: boolean }) {
  const compliant = metrics.active.filter((s) => s.lastReading && s.lastReading.dissolvedOxygen >= 5);
  const nonCompliant = metrics.active.filter((s) => s.lastReading && s.lastReading.dissolvedOxygen < 5);

  return (
    <div className="space-y-5">
      <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        Dissolved oxygen (DO) is the amount of molecular oxygen dissolved in water. It is one of the
        most critical indicators of water health — fish and aquatic insects need at least 5 mg/L to
        survive. The EPA&apos;s Clean Water Act Section 304(a) criterion sets this as the minimum for
        aquatic life support.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl border p-4 ${isDark ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"}`}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className={`text-xs font-semibold ${isDark ? "text-green-400" : "text-green-700"}`}>EPA Compliant</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{compliant.length}</div>
          <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>stations &ge; 5.0 mg/L</div>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className={`text-xs font-semibold ${isDark ? "text-red-400" : "text-red-700"}`}>Below Standard</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{nonCompliant.length}</div>
          <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>stations &lt; 5.0 mg/L</div>
        </div>
      </div>

      <div>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Current Readings by Station</h4>
        <div className="space-y-1">
          {metrics.active.map((s) => {
            const doVal = s.lastReading?.dissolvedOxygen || 0;
            const pct = Math.min((doVal / 14) * 100, 100);
            const isGood = doVal >= 5;
            return (
              <div key={s.id} className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <div className={`w-24 text-xs truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}>{s.name.split(" ").slice(0, 2).join(" ")}</div>
                <div className="flex-1 h-2 rounded-full bg-slate-700/30 overflow-hidden">
                  <div className={`h-full rounded-full ${isGood ? "bg-blue-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                </div>
                <div className={`text-xs font-mono w-16 text-right ${isGood ? "text-blue-400" : "text-red-400"}`}>
                  {doVal.toFixed(1)} mg/L
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`rounded-xl p-4 ${isDark ? "bg-blue-500/5 border border-blue-500/20" : "bg-blue-50 border border-blue-200"}`}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            <strong>Why it matters:</strong> Dissolved oxygen levels below 2 mg/L create hypoxic
            &quot;dead zones&quot; where fish cannot survive. In the Anacostia, summer heat and nutrient
            pollution from urban runoff drive DO levels down. The river&apos;s DO has been improving
            since DC&apos;s Clean Rivers program began addressing combined sewer overflows.
          </div>
        </div>
      </div>
    </div>
  );
}

function TempModal({ metrics, isDark }: { metrics: Metrics; isDark: boolean }) {
  return (
    <div className="space-y-5">
      <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        Water temperature directly affects dissolved oxygen capacity, metabolic rates of aquatic
        organisms, and chemical reaction rates. Urban heat island effects and impervious surface
        runoff significantly elevate stream temperatures in the Anacostia watershed.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl border p-4 ${isDark ? "bg-cyan-500/10 border-cyan-500/20" : "bg-cyan-50 border-cyan-200"}`}>
          <div className={`text-xs font-semibold mb-1 ${isDark ? "text-cyan-400" : "text-cyan-700"}`}>Network Average</div>
          <div className="text-2xl font-bold text-cyan-400">{metrics.avgTemp}°C</div>
          <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>{(metrics.avgTemp * 9 / 5 + 32).toFixed(1)}°F</div>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? "bg-white/5 border-panel-border" : "bg-slate-50 border-slate-200"}`}>
          <div className={`text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>EPA Warm-Water Limit</div>
          <div className="text-2xl font-bold text-amber-400">32°C</div>
          <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>89.6°F max for aquatic life</div>
        </div>
      </div>

      <div>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Current Readings</h4>
        <div className="space-y-1">
          {metrics.active.map((s) => {
            const temp = s.lastReading?.temperature || 0;
            return (
              <div key={s.id} className={`flex items-center justify-between p-2 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>{s.name.split(" ").slice(0, 3).join(" ")}</span>
                <span className={`text-xs font-mono ${temp > 30 ? "text-red-400" : "text-cyan-400"}`}>{temp.toFixed(1)}°C</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`rounded-xl p-4 ${isDark ? "bg-cyan-500/5 border border-cyan-500/20" : "bg-cyan-50 border border-cyan-200"}`}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            <strong>Seasonal patterns:</strong> Anacostia water temperatures follow a clear seasonal
            cycle — cool winter readings (4-8°C) to warm summer peaks (25-30°C). Stormwater runoff
            from hot pavement can cause thermal shock events. Green infrastructure installations at
            UDC sites help mitigate thermal loading by slowing and cooling runoff.
          </div>
        </div>
      </div>
    </div>
  );
}

function PHModal({ metrics, isDark }: { metrics: Metrics; isDark: boolean }) {
  const inRange = metrics.active.filter((s) => s.lastReading && s.lastReading.pH >= 6.5 && s.lastReading.pH <= 9.0);

  return (
    <div className="space-y-5">
      <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        pH measures hydrogen ion concentration on a 0-14 scale. The EPA&apos;s Gold Book recommends
        6.5-9.0 for freshwater aquatic life. pH affects nutrient availability, metal solubility,
        and biological processes in the Anacostia ecosystem.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Acidic", range: "0 — 6.4", color: "text-red-400", bg: isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200" },
          { label: "Optimal", range: "6.5 — 9.0", color: "text-green-400", bg: isDark ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200" },
          { label: "Alkaline", range: "9.1 — 14", color: "text-purple-400", bg: isDark ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-50 border-purple-200" },
        ].map((r) => (
          <div key={r.label} className={`rounded-xl border p-3 text-center ${r.bg}`}>
            <div className={`text-xs font-bold ${r.color}`}>{r.label}</div>
            <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>{r.range}</div>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border p-4 ${isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}>
        <div className="text-center">
          <div className="text-3xl font-bold text-emerald-400">{metrics.avgPH}</div>
          <div className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Network Average &middot; {inRange.length}/{metrics.active.length} stations in optimal range
          </div>
        </div>
      </div>

      <div className={`rounded-xl p-4 ${isDark ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"}`}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            <strong>Anacostia context:</strong> Urban runoff can push pH outside the optimal range —
            road salt (alkaline), acid rain, and organic decomposition all influence pH. The
            Anacostia generally maintains near-neutral pH, but localized spikes occur after heavy
            storms when runoff carries concrete dust and other alkaline materials.
          </div>
        </div>
      </div>
    </div>
  );
}

function TurbidityModal({ metrics, isDark }: { metrics: Metrics; isDark: boolean }) {
  return (
    <div className="space-y-5">
      <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        Turbidity measures water clarity using light scattering. High turbidity indicates suspended
        sediment, algae, or pollutants that block sunlight, suffocate aquatic plants, and clog fish
        gills. It&apos;s a key indicator of erosion and urban runoff impact.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl border p-4 ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
          <div className={`text-xs font-semibold mb-1 ${isDark ? "text-amber-400" : "text-amber-700"}`}>Network Average</div>
          <div className="text-2xl font-bold text-amber-400">{metrics.avgTurbidity} NTU</div>
          <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
            {metrics.avgTurbidity <= 25 ? "Clear water" : metrics.avgTurbidity <= 50 ? "Moderate sediment" : "Elevated — storm impact likely"}
          </div>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? "bg-white/5 border-panel-border" : "bg-slate-50 border-slate-200"}`}>
          <div className={`text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>DC DOEE Reference</div>
          <div className="text-2xl font-bold text-slate-400">&le;50 NTU</div>
          <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>Typical healthy freshwater</div>
        </div>
      </div>

      <div>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Interpretation Guide</h4>
        <div className="space-y-1.5">
          {[
            { range: "0-10 NTU", label: "Crystal clear", desc: "Excellent visibility, healthy for aquatic plants", color: "text-green-400" },
            { range: "10-25 NTU", label: "Slightly cloudy", desc: "Normal for urban streams after light rain", color: "text-green-300" },
            { range: "25-100 NTU", label: "Cloudy", desc: "Reduced light penetration, possible erosion", color: "text-amber-400" },
            { range: "100+ NTU", label: "Very turbid", desc: "Storm event or active construction runoff", color: "text-red-400" },
          ].map((r) => (
            <div key={r.range} className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
              <span className={`text-xs font-mono w-20 ${r.color}`}>{r.range}</span>
              <div>
                <div className={`text-xs font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{r.label}</div>
                <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EcoliModal({ metrics, isDark, router }: { metrics: Metrics; isDark: boolean; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="space-y-5">
      <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        <em>E. coli</em> (Escherichia coli) is a fecal indicator bacterium. Its presence in water
        signals potential contamination from sewage or animal waste. The EPA&apos;s 2012 Recreational
        Water Quality Criteria sets 410 CFU/100mL as the single-sample maximum for primary contact
        recreation (swimming, wading).
      </p>

      {metrics.ecoliAlerts.length > 0 ? (
        <div className={`rounded-xl border p-4 ${isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className={`text-sm font-semibold ${isDark ? "text-red-400" : "text-red-700"}`}>
              {metrics.ecoliAlerts.length} Station{metrics.ecoliAlerts.length !== 1 ? "s" : ""} Exceeding EPA Limit
            </span>
          </div>
          <div className="space-y-2">
            {metrics.ecoliAlerts.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/station/${s.id}`)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                  isDark ? "bg-red-500/5 hover:bg-red-500/10" : "bg-red-50 hover:bg-red-100"
                }`}
              >
                <div>
                  <div className={`text-xs font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{s.name}</div>
                  <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>{s.id}</div>
                </div>
                <div className="text-sm font-bold text-red-400">
                  {s.lastReading?.eColiCount?.toLocaleString()} CFU
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={`rounded-xl border p-4 text-center ${isDark ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"}`}>
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className={`text-sm font-semibold ${isDark ? "text-green-400" : "text-green-700"}`}>All stations within EPA limits</div>
          <div className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>No active E. coli alerts</div>
        </div>
      )}

      <div className={`rounded-xl p-4 ${isDark ? "bg-red-500/5 border border-red-500/20" : "bg-red-50 border border-red-200"}`}>
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            <strong>Public health advisory:</strong> E. coli levels above 410 CFU/100mL indicate
            potential health risk for recreational water contact. The Anacostia&apos;s E. coli levels
            are primarily driven by combined sewer overflows (CSOs) during heavy rain. DC
            Water&apos;s Clean Rivers Project is building underground tunnels to capture CSO
            discharge — projected to reduce overflow volume by 96% when complete.
          </div>
        </div>
      </div>
    </div>
  );
}

function GIModal({ metrics, isDark, router }: { metrics: Metrics; isDark: boolean; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="space-y-5">
      <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        Green infrastructure (GI) uses natural processes — plants, soils, and permeable materials —
        to manage stormwater runoff at the source. UDC&apos;s CAUSES monitors GI performance across
        DC to quantify pollutant removal, volume reduction, and thermal mitigation.
      </p>

      <div className="space-y-2">
        {metrics.giStations.map((s) => (
          <button
            key={s.id}
            onClick={() => router.push(`/station/${s.id}`)}
            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors border ${
              isDark ? "border-green-500/20 bg-green-500/5 hover:bg-green-500/10" : "border-green-200 bg-green-50 hover:bg-green-100"
            }`}
          >
            <TreePine className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{s.name}</div>
              <div className={`text-[10px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}>{s.id} &middot; {s.parameters?.join(", ")}</div>
            </div>
            <ExternalLink className={`w-3 h-3 mt-1 flex-shrink-0 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
          </button>
        ))}
      </div>

      <div className={`rounded-xl p-4 ${isDark ? "bg-green-500/5 border border-green-500/20" : "bg-green-50 border border-green-200"}`}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          <div className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            <strong>UDC&apos;s role:</strong> CAUSES researchers study green roofs, rain gardens,
            bioswales, and tree cells across DC — measuring influent vs. effluent water quality to
            quantify pollution removal rates. These stations help prove that nature-based solutions
            are cost-effective alternatives to grey infrastructure for stormwater management.
          </div>
        </div>
      </div>
    </div>
  );
}

function ResearchModal({ isDark, router }: { isDark: boolean; router: ReturnType<typeof useRouter> }) {
  const projects = [
    { title: "Anacostia Water Quality Assessment", pi: "Dr. Tolessa Deksissa", status: "Active", dept: "WRRI" },
    { title: "Green Infrastructure Performance", pi: "Dr. Tolessa Deksissa", status: "Active", dept: "CAUSES" },
    { title: "Urban Stormwater BMP Monitoring", pi: "Dr. Pradeep Behera", status: "Active", dept: "Civil Engineering" },
    { title: "CSO Impact on Aquatic Ecosystems", pi: "Dr. Matthew Gondwe", status: "Active", dept: "Environmental Science" },
    { title: "Community-Based Water Monitoring", pi: "Dr. Sebhat Tesfamariam", status: "Active", dept: "CAUSES" },
    { title: "Emerging Contaminants Detection", pi: "Dr. Jiajun Xu", status: "Planning", dept: "Chemistry" },
  ];

  return (
    <div className="space-y-5">
      <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        UDC&apos;s Water Resources Research Institute (WRRI) and CAUSES lead active research on
        Anacostia watershed restoration, green infrastructure performance, and environmental justice
        in DC&apos;s underserved communities.
      </p>

      <div className="space-y-2">
        {projects.map((p) => (
          <div key={p.title} className={`p-3 rounded-xl border ${isDark ? "border-panel-border bg-white/5" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{p.title}</div>
                <div className={`text-[10px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}>PI: {p.pi} &middot; {p.dept}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                p.status === "Active"
                  ? isDark ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-green-700 bg-green-50 border-green-200"
                  : isDark ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-amber-700 bg-amber-50 border-amber-200"
              }`}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/research")}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors"
      >
        <FlaskConical className="w-4 h-4" /> View All Research Projects
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function MetricCards() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/stations");
      if (res.ok) {
        setMetrics(computeMetrics(await res.json()));
      }
    } catch {
      const { monitoringStations } = await import("@/data/dc-waterways");
      setMetrics(computeMetrics(monitoringStations));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-xl border p-4 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  const modalContent: Record<string, { title: string; subtitle: string; icon: React.ReactNode; content: React.ReactNode }> = {
    stations: {
      title: "Monitoring Network",
      subtitle: `${metrics.activeCount} active of ${metrics.totalCount} total stations`,
      icon: <Radio className="w-5 h-5 text-green-400" />,
      content: <StationsModal metrics={metrics} isDark={isDark} router={router} />,
    },
    do: {
      title: "Dissolved Oxygen",
      subtitle: `Network average: ${metrics.avgDO} mg/L`,
      icon: <Droplets className="w-5 h-5 text-blue-400" />,
      content: <DOModal metrics={metrics} isDark={isDark} />,
    },
    temp: {
      title: "Water Temperature",
      subtitle: `Network average: ${metrics.avgTemp}°C`,
      icon: <Thermometer className="w-5 h-5 text-cyan-400" />,
      content: <TempModal metrics={metrics} isDark={isDark} />,
    },
    ph: {
      title: "pH Level",
      subtitle: `Network average: ${metrics.avgPH}`,
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
      content: <PHModal metrics={metrics} isDark={isDark} />,
    },
    turbidity: {
      title: "Turbidity",
      subtitle: `Network average: ${metrics.avgTurbidity} NTU`,
      icon: <Waves className="w-5 h-5 text-amber-400" />,
      content: <TurbidityModal metrics={metrics} isDark={isDark} />,
    },
    ecoli: {
      title: "E. coli Alerts",
      subtitle: `${metrics.ecoliAlerts.length} station${metrics.ecoliAlerts.length !== 1 ? "s" : ""} above EPA limit`,
      icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
      content: <EcoliModal metrics={metrics} isDark={isDark} router={router} />,
    },
    gi: {
      title: "Green Infrastructure",
      subtitle: `${metrics.giStations.length} active UDC research sites`,
      icon: <TreePine className="w-5 h-5 text-green-400" />,
      content: <GIModal metrics={metrics} isDark={isDark} router={router} />,
    },
    research: {
      title: "Active Research",
      subtitle: "WRRI & CAUSES projects",
      icon: <FlaskConical className="w-5 h-5 text-purple-400" />,
      content: <ResearchModal isDark={isDark} router={router} />,
    },
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cardConfigs.map((card) => {
          const Icon = card.icon;
          const trend = card.getTrend(metrics);
          const TrendIcon = trend.positive ? TrendingUp : TrendingDown;
          return (
            <button
              key={card.label}
              onClick={() => setActiveModal(card.modalKey)}
              aria-label={`View details for ${card.label}`}
              className={`metric-card rounded-xl border p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer group ${
                isDark
                  ? `${card.borderColor} ${card.bgColor} hover:border-opacity-60`
                  : `${card.lightBorderColor} ${card.lightBgColor} hover:shadow-md`
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${isDark ? card.bgColor : card.lightBgColor}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="flex items-center gap-1">
                  {card.getTotal && (
                    <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>/ {card.getTotal(metrics)}</span>
                  )}
                  <Info className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${card.color}`}>{card.getValue(metrics)}</span>
                {card.unit && <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{card.unit}</span>}
              </div>
              <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{card.label}</p>
              <p className={`text-[10px] mt-2 flex items-center gap-1 ${trend.positive ? "text-green-500" : "text-amber-500"}`}>
                <TrendIcon className="w-3 h-3" />
                {trend.text}
              </p>
            </button>
          );
        })}
      </div>

      {activeModal && modalContent[activeModal] && (
        <Modal
          open={true}
          onClose={() => setActiveModal(null)}
          title={modalContent[activeModal].title}
          subtitle={modalContent[activeModal].subtitle}
          icon={modalContent[activeModal].icon}
        >
          {modalContent[activeModal].content}
        </Modal>
      )}
    </>
  );
}
