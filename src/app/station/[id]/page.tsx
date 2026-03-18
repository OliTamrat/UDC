"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { monitoringStations, getStationHistoricalData } from "@/data/dc-waterways";
import type { MonitoringStation } from "@/data/dc-waterways";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ThresholdDot, getThresholdLevel } from "@/components/dashboard/ThresholdIndicator";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  ArrowLeft, MapPin, Activity, Droplets, Thermometer, Waves,
  AlertTriangle, CheckCircle2, Wrench, AlertCircle, Download, Share2,
  FlaskConical,
} from "lucide-react";

function StatusBadge({ status, isDark }: { status: string; isDark: boolean }) {
  const config: Record<string, { bg: string; text: string; icon: typeof CheckCircle2; label: string }> = {
    active: { bg: isDark ? "bg-green-500/10 border-green-500/30" : "bg-green-50 border-green-200", text: "text-green-400", icon: CheckCircle2, label: "Active" },
    maintenance: { bg: isDark ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-200", text: "text-yellow-400", icon: Wrench, label: "Maintenance" },
    offline: { bg: isDark ? "bg-gray-500/10 border-gray-500/30" : "bg-gray-50 border-gray-200", text: "text-gray-400", icon: AlertCircle, label: "Offline" },
  };
  const c = config[status] || config.offline;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.text}`}>
      <Icon className="w-3.5 h-3.5" /> {c.label}
    </span>
  );
}

interface HistoricalReading {
  month: string;
  dissolvedOxygen: number;
  temperature: number;
  pH: number;
  turbidity: number;
  eColiCount: number;
}

interface HistoricalData {
  description: string;
  data: HistoricalReading[];
}

interface ParameterDef {
  id: string;
  name: string;
  unit: string;
  category: string;
  epaMin: number | null;
  epaMax: number | null;
  description: string;
}

interface MeasurementRecord {
  parameterId: string;
  parameterName: string;
  value: number;
  unit: string;
  category: string;
  epaMin: number | null;
  epaMax: number | null;
  timestamp: string;
  source: string;
}

const SOURCE_CONFIG: Record<string, { label: string; abbr: string; color: string; bg: string }> = {
  usgs:   { label: "USGS NWIS",          abbr: "USGS",   color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30" },
  epa:    { label: "EPA Water Quality Exchange", abbr: "EPA",  color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30" },
  wqp:    { label: "Water Quality Portal", abbr: "WQP",   color: "text-teal-400",   bg: "bg-teal-500/10 border-teal-500/30" },
  seed:   { label: "Baseline/Modeled",    abbr: "Model",  color: "text-slate-400",  bg: "bg-slate-500/10 border-slate-500/30" },
  manual: { label: "Manual Entry",         abbr: "Manual", color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30" },
};

function SourceBadge({ source, isDark }: { source: string; isDark: boolean }) {
  const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG.manual;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.bg} ${cfg.color}`}
      title={`Data source: ${cfg.label}`}
    >
      {cfg.abbr}
    </span>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  physical: "text-blue-400",
  nutrients: "text-green-400",
  metals: "text-orange-400",
  biological: "text-red-400",
  organic: "text-purple-400",
};

const PARAM_ICONS: Record<string, typeof Thermometer> = {
  temperature: Thermometer,
  dissolved_oxygen: Droplets,
  ph: Activity,
  turbidity: Waves,
  conductivity: Activity,
  ecoli: AlertTriangle,
};

export default function StationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const stationId = params.id as string;
  const [station, setStation] = useState<MonitoringStation | null>(null);
  const [historical, setHistorical] = useState<HistoricalData | null>(null);
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [latestMeasurements, setLatestMeasurements] = useState<MeasurementRecord[]>([]);
  const [allParamDefs, setAllParamDefs] = useState<ParameterDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchData = useCallback(async () => {
    const staticStation = monitoringStations.find((s) => s.id === stationId);
    if (!staticStation) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Fetch station data, history, EAV measurements, and parameter defs in parallel
    const [stationsRes, histRes, measRes, paramsRes] = await Promise.allSettled([
      fetch("/api/stations"),
      fetch(`/api/stations/${stationId}/history`),
      fetch(`/api/measurements?stations=${stationId}&limit=100`),
      fetch("/api/parameters"),
    ]);

    // Station
    if (stationsRes.status === "fulfilled" && stationsRes.value.ok) {
      const allStations: MonitoringStation[] = await stationsRes.value.json();
      const apiStation = allStations.find((s) => s.id === stationId);
      setStation(apiStation || staticStation);
    } else {
      setStation(staticStation);
    }

    // Parameter definitions
    if (paramsRes.status === "fulfilled" && paramsRes.value.ok) {
      setAllParamDefs(await paramsRes.value.json());
    }

    // EAV measurements — get latest value per parameter
    if (measRes.status === "fulfilled" && measRes.value.ok) {
      const measData = await measRes.value.json();
      if (measData.data && measData.data.length > 0) {
        // Group by parameterId, take most recent
        const latestByParam: Record<string, MeasurementRecord> = {};
        for (const m of measData.data) {
          if (!latestByParam[m.parameterId] || m.timestamp > latestByParam[m.parameterId].timestamp) {
            latestByParam[m.parameterId] = m;
          }
        }
        setLatestMeasurements(Object.values(latestByParam));
      }
    }

    // Historical data
    if (histRes.status === "fulfilled" && histRes.value.ok) {
      const histData = await histRes.value.json();
      if (histData.data && histData.data.length > 0) {
        const sources = [...new Set(histData.data.map((r: { source?: string }) => r.source).filter(Boolean))] as string[];
        setDataSources(sources);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthAccum: Record<string, { count: number; do: number; temp: number; ph: number; turb: number; ecoli: number }> = {};

        for (const r of histData.data) {
          const date = new Date(r.timestamp);
          const monthName = months[date.getMonth()];
          if (!monthAccum[monthName]) {
            monthAccum[monthName] = { count: 0, do: 0, temp: 0, ph: 0, turb: 0, ecoli: 0 };
          }
          const acc = monthAccum[monthName];
          acc.count++;
          if (r.dissolvedOxygen != null) acc.do += r.dissolvedOxygen;
          if (r.temperature != null) acc.temp += r.temperature;
          if (r.pH != null) acc.ph += r.pH;
          if (r.turbidity != null) acc.turb += r.turbidity;
          if (r.eColiCount != null) acc.ecoli += r.eColiCount;
        }

        const chartData = months
          .filter((m) => monthAccum[m])
          .map((m) => {
            const a = monthAccum[m];
            const n = a.count || 1;
            return {
              month: m,
              dissolvedOxygen: Math.round((a.do / n) * 100) / 100,
              temperature: Math.round((a.temp / n) * 100) / 100,
              pH: Math.round((a.ph / n) * 100) / 100,
              turbidity: Math.round((a.turb / n) * 100) / 100,
              eColiCount: Math.round(a.ecoli / n),
            };
          });

        if (chartData.length > 0) {
          const staticHist = getStationHistoricalData(stationId);
          setHistorical({ description: staticHist?.description || "", data: chartData });
        } else {
          setHistorical(getStationHistoricalData(stationId));
          setDataSources(["seed"]);
        }
      } else {
        setHistorical(getStationHistoricalData(stationId));
        setDataSources(["seed"]);
      }
    } else {
      setHistorical(getStationHistoricalData(stationId));
      setDataSources(["seed"]);
    }

    setLoading(false);
  }, [stationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = () => {
    window.open(`/api/export?format=csv&station=${stationId}`, "_blank");
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen ${isDark ? "bg-udc-dark" : "bg-slate-50"}`}>
        <Sidebar />
        <main id="main-content" className="flex-1 lg:ml-[240px] min-w-0 overflow-x-hidden">
          <Header />
          <div className="p-6 flex items-center justify-center h-[60vh]">
            <div className="w-8 h-8 border-2 border-water-blue border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !station) {
    return (
      <div className={`flex min-h-screen ${isDark ? "bg-udc-dark" : "bg-slate-50"}`}>
        <Sidebar />
        <main id="main-content" className="flex-1 lg:ml-[240px] min-w-0 overflow-x-hidden">
          <Header />
          <div className="p-6 flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Station Not Found</h2>
              <p className={`text-sm mb-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}>No station with ID &quot;{stationId}&quot; exists.</p>
              <button onClick={() => router.push("/")} className="px-4 py-2 bg-water-blue text-white rounded-lg text-sm">
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const reading = station.lastReading;
  const gridColor = isDark ? "#1E3A5F" : "#E2E8F0";
  const tickColor = isDark ? "#64748B" : "#94A3B8";
  const tooltipStyle = {
    backgroundColor: isDark ? "rgba(15, 29, 50, 0.95)" : "rgba(255, 255, 255, 0.98)",
    border: isDark ? "1px solid rgba(30, 58, 95, 0.5)" : "1px solid #E2E8F0",
    borderRadius: "8px", padding: "10px", fontSize: "12px",
    color: isDark ? "#F8FAFC" : "#1E293B",
  };

  const isGI = station.type === "green-infrastructure";
  const typeLabel = isGI ? "Green Infrastructure BMP" : station.type.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const epaLimits = {
    dissolvedOxygen: { min: 5, label: "EPA Minimum (5 mg/L)" },
    eColiCount: { max: 410, label: "EPA Recreational Limit (410 CFU/100mL)" },
  };

  // Group EAV measurements by category for display
  const measurementsByCategory: Record<string, MeasurementRecord[]> = {};
  for (const m of latestMeasurements) {
    const cat = m.category || "physical";
    if (!measurementsByCategory[cat]) measurementsByCategory[cat] = [];
    measurementsByCategory[cat].push(m);
  }
  const categoryOrder = ["physical", "nutrients", "biological", "metals", "organic"];
  const hasEAVData = latestMeasurements.length > 0;

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? "bg-udc-dark" : "bg-slate-50"}`}>
      <Sidebar />
      <main className="flex-1 lg:ml-[240px] min-w-0 overflow-x-hidden">
        <Header />
        <div className="p-3 sm:p-4 md:p-6 space-y-6">
          {/* Back + Title */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => router.push("/")}
                aria-label="Back to dashboard"
                className={`p-2 rounded-lg border transition-colors flex-shrink-0 ${
                  isDark ? "border-panel-border hover:bg-panel-hover" : "border-slate-200 hover:bg-slate-100"
                }`}
              >
                <ArrowLeft className={`w-5 h-5 ${isDark ? "text-slate-300" : "text-slate-600"}`} aria-hidden="true" />
              </button>
              <h1 className={`text-lg sm:text-2xl font-bold flex-1 min-w-0 ${isDark ? "text-white" : "text-slate-900"}`}>{station.name}</h1>
              <StatusBadge status={station.status} isDark={isDark} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className={`text-xs sm:text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                {station.position[0].toFixed(4)}°N, {Math.abs(station.position[1]).toFixed(4)}°W
              </span>
              <span className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>ID: {station.id}</span>
              <span className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Type: {typeLabel}</span>
            </div>
            {historical && (
              <p className={`text-xs max-w-2xl ${isDark ? "text-slate-400" : "text-slate-600"}`}>{historical.description}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                aria-label={`Export CSV data for ${station.name}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                  isDark ? "border-panel-border text-slate-400 hover:bg-panel-hover" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" /> <span className="hidden sm:inline">Export</span> CSV
              </button>
              <button
                aria-label={`Share ${station.name} data`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                isDark ? "border-panel-border text-slate-400 hover:bg-panel-hover" : "border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}>
                <Share2 className="w-3.5 h-3.5" aria-hidden="true" /> Share
              </button>
            </div>
          </div>

          {/* Current Readings — legacy 6-card grid */}
          {reading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Temperature", value: reading.temperature != null ? `${reading.temperature}°C` : "—", icon: Thermometer, color: "text-cyan-400", bgDark: "bg-cyan-500/10 border-cyan-500/20", bgLight: "bg-cyan-50 border-cyan-200" },
                { label: "Dissolved Oxygen", value: reading.dissolvedOxygen != null ? `${reading.dissolvedOxygen} mg/L` : "—", icon: Droplets, color: "text-blue-400", bgDark: "bg-blue-500/10 border-blue-500/20", bgLight: "bg-blue-50 border-blue-200",
                  alert: !isGI && (reading.dissolvedOxygen ?? Infinity) < 5 },
                { label: "pH Level", value: reading.pH != null ? `${reading.pH}` : "—", icon: Activity, color: "text-emerald-400", bgDark: "bg-emerald-500/10 border-emerald-500/20", bgLight: "bg-emerald-50 border-emerald-200" },
                { label: "Turbidity", value: reading.turbidity != null ? `${reading.turbidity} NTU` : "—", icon: Waves, color: "text-amber-400", bgDark: "bg-amber-500/10 border-amber-500/20", bgLight: "bg-amber-50 border-amber-200" },
                { label: "E. coli", value: reading.eColiCount != null ? `${reading.eColiCount.toLocaleString()}` : "—", unit: "CFU/100mL", icon: AlertTriangle,
                  color: (reading.eColiCount ?? 0) > 410 ? "text-red-400" : "text-green-400",
                  bgDark: (reading.eColiCount ?? 0) > 410 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20",
                  bgLight: (reading.eColiCount ?? 0) > 410 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200",
                  alert: (reading.eColiCount ?? 0) > 410 },
                { label: "Conductivity", value: reading.conductivity != null ? `${reading.conductivity}` : "—", unit: "µS/cm", icon: Activity, color: "text-purple-400", bgDark: "bg-purple-500/10 border-purple-500/20", bgLight: "bg-purple-50 border-purple-200" },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className={`rounded-xl border p-3 sm:p-4 ${isDark ? metric.bgDark : metric.bgLight}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-4 h-4 ${metric.color}`} />
                      {metric.alert && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    </div>
                    <div className={`text-lg sm:text-xl font-bold ${metric.color}`}>{metric.value}</div>
                    {metric.unit && <div className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>{metric.unit}</div>}
                    <div className={`text-xs mt-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{metric.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          {reading && (
            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              <span>Last updated: {reading.timestamp
                ? dataSources.length === 1 && dataSources[0] === "seed"
                  ? "Baseline (modeled)"
                  : new Date(reading.timestamp).toLocaleString()
                : "—"}</span>
              {dataSources.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span>Sources:</span>
                  {dataSources.map((src) => (
                    <SourceBadge key={src} source={src} isDark={isDark} />
                  ))}
                </span>
              )}
              {dataSources.length === 1 && dataSources[0] === "seed" && (
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                  isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700"
                }`}>
                  <AlertTriangle className="w-3 h-3" />
                  Baseline data — modeled from published watershed averages, not live sensor readings
                </span>
              )}
              {isGI && (
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                  isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-700"
                }`}>
                  <AlertTriangle className="w-3 h-3" />
                  BMP site — measures stormwater retention and infiltration performance, not ambient water quality
                </span>
              )}
            </div>
          )}

          {/* All Available Parameters (EAV) — grouped by category with threshold indicators */}
          {hasEAVData && (
            <div className="space-y-3">
              <div>
                <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                  <FlaskConical className="w-4 h-4 inline mr-1.5" />
                  All Measured Parameters
                </h2>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Latest readings from all available data sources with EPA threshold compliance
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryOrder.map((cat) => {
                  const measurements = measurementsByCategory[cat];
                  if (!measurements || measurements.length === 0) return null;

                  const catColor = CATEGORY_COLORS[cat] || "text-slate-400";
                  const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);

                  return (
                    <div key={cat} className={`glass-panel rounded-xl overflow-hidden`}>
                      <div className={`px-3 py-2 border-b ${isDark ? "border-panel-border bg-panel-bg/50" : "border-slate-100 bg-slate-50"}`}>
                        <h3 className={`text-xs font-semibold uppercase tracking-wider ${catColor}`}>
                          {catLabel}
                        </h3>
                      </div>
                      <div className="divide-y divide-panel-border/30">
                        {measurements.map((m) => {
                          const level = getThresholdLevel(m.value, m.epaMin, m.epaMax);
                          const Icon = PARAM_ICONS[m.parameterId] || Activity;
                          const paramDef = allParamDefs.find((p) => p.id === m.parameterId);
                          const levelTextColor = {
                            good: "text-green-400",
                            warning: "text-amber-400",
                            violation: "text-red-400",
                            unknown: "text-slate-400",
                          }[level];

                          return (
                            <div key={m.parameterId} className={`px-3 py-2 flex items-center gap-3 ${
                              isDark ? "hover:bg-panel-hover/50" : "hover:bg-slate-50"
                            }`}>
                              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${catColor}`} />
                              <div className="flex-1 min-w-0">
                                <div className={`text-xs font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                  {m.parameterName}
                                </div>
                                {paramDef?.description && (
                                  <div className={`text-[10px] truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                    {paramDef.description}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <ThresholdDot value={m.value} epaMin={m.epaMin} epaMax={m.epaMax} />
                                <span className={`text-sm font-medium ${levelTextColor}`}>
                                  {m.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                                <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                  {m.unit}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Historical Charts */}
          {historical && (
            <>
              <div>
                <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Historical Trends
                  {dataSources.length === 1 && dataSources[0] === "seed" ? " (Baseline)" : ""}
                </h2>
                <p className={`text-xs mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Monthly averages with EPA compliance thresholds</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Dissolved Oxygen */}
                {!isGI && (
                  <div className="glass-panel rounded-xl p-3 sm:p-4" role="img" aria-label="Dissolved oxygen trend chart showing monthly averages with EPA minimum threshold of 5 mg/L">
                    <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Dissolved Oxygen</h3>
                    <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Monthly average (mg/L) with EPA minimum threshold</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={historical.data}>
                        <defs>
                          <linearGradient id={`do-grad-${stationId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} />
                        <YAxis tick={{ fontSize: 11, fill: tickColor }} domain={[0, 14]} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="dissolvedOxygen" stroke="#3B82F6" fill={`url(#do-grad-${stationId})`} strokeWidth={2} name="DO (mg/L)" />
                        <Line type="monotone" dataKey={() => epaLimits.dissolvedOxygen.min} stroke="#EF4444" strokeWidth={1} strokeDasharray="5 5" name={epaLimits.dissolvedOxygen.label} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Temperature */}
                <div className="glass-panel rounded-xl p-3 sm:p-4" role="img" aria-label="Water temperature trend chart showing monthly averages in degrees Celsius">
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Water Temperature</h3>
                  <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Monthly average (°C)</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={historical.data}>
                      <defs>
                        <linearGradient id={`temp-grad-${stationId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} />
                      <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="temperature" stroke="#22D3EE" fill={`url(#temp-grad-${stationId})`} strokeWidth={2} name="Temperature (°C)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* E. coli */}
                <div className="glass-panel rounded-xl p-3 sm:p-4" role="img" aria-label="E. coli levels bar chart showing monthly averages with EPA recreational limit of 410 CFU per 100mL">
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>E. coli Levels</h3>
                  <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Monthly average (CFU/100mL) with EPA recreational limit</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={historical.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} />
                      <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="eColiCount" name="E. coli (CFU/100mL)" radius={[4, 4, 0, 0]} fill="#EF4444" fillOpacity={0.7} />
                      <Line type="monotone" dataKey={() => epaLimits.eColiCount.max} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 5" name={epaLimits.eColiCount.label} dot={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Turbidity */}
                <div className="glass-panel rounded-xl p-3 sm:p-4" role="img" aria-label="Turbidity trend chart showing monthly averages in NTU">
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Turbidity</h3>
                  <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Monthly average (NTU)</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={historical.data}>
                      <defs>
                        <linearGradient id={`turb-grad-${stationId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} />
                      <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="turbidity" stroke="#F59E0B" fill={`url(#turb-grad-${stationId})`} strokeWidth={2} name="Turbidity (NTU)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Multi-parameter overlay */}
              {!isGI && (
                <div className="glass-panel rounded-xl p-3 sm:p-4">
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Multi-Parameter Comparison</h3>
                  <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>All parameters overlaid for correlation analysis</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={historical.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: tickColor }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: tickColor }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B" }} />
                      <Line yAxisId="left" type="monotone" dataKey="dissolvedOxygen" stroke="#3B82F6" strokeWidth={2} name="DO (mg/L)" dot={{ r: 2 }} />
                      <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#22D3EE" strokeWidth={2} name="Temp (°C)" dot={{ r: 2 }} />
                      <Line yAxisId="left" type="monotone" dataKey="pH" stroke="#4ADE80" strokeWidth={2} name="pH" dot={{ r: 2 }} />
                      <Line yAxisId="right" type="monotone" dataKey="turbidity" stroke="#F59E0B" strokeWidth={2} name="Turbidity (NTU)" dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Parameters monitored */}
              <div className="glass-panel rounded-xl p-3 sm:p-4">
                <h3 className={`text-sm font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>Parameters Monitored</h3>
                <div className="flex flex-wrap gap-2">
                  {station.parameters.map((param) => (
                    <span key={param} className={`px-3 py-1.5 rounded-full text-xs border ${
                      isDark ? "bg-udc-blue/10 border-udc-blue/30 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-700"
                    }`}>
                      {param}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
