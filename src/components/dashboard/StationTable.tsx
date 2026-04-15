"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, AlertCircle, CheckCircle2, Wrench, ExternalLink } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { ThresholdDot, getThresholdLevel } from "./ThresholdIndicator";
import type { MonitoringStation } from "@/data/dc-waterways";

interface ParameterDef {
  id: string;
  name: string;
  unit: string;
  category: string;
  epaMin: number | null;
  epaMax: number | null;
}

// Map parameter IDs to legacy reading fields (for the /api/stations lastReading data)
const PARAM_TO_READING_FIELD: Record<string, string> = {
  temperature: "temperature",
  dissolved_oxygen: "dissolvedOxygen",
  ph: "pH",
  turbidity: "turbidity",
  conductivity: "conductivity",
  ecoli: "eColiCount",
  nitrate_n: "nitrateN",
  phosphorus_total: "phosphorus",
};

// Default columns — aligned with what USGS sensors actually provide
const DEFAULT_PARAMS = ["temperature", "dissolved_oxygen", "ph", "turbidity", "conductivity"];

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { color: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle2, label: "Active" },
    maintenance: { color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Wrench, label: "Maintenance" },
    offline: { color: "text-gray-400 bg-gray-500/10 border-gray-500/20", icon: AlertCircle, label: "Offline" },
  }[status] || { color: "text-gray-400", icon: AlertCircle, label: status };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

const SOURCE_STYLES: Record<string, { abbr: string; color: string }> = {
  usgs:   { abbr: "USGS",   color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  epa:    { abbr: "EPA",    color: "text-green-400 bg-green-500/10 border-green-500/30" },
  wqp:    { abbr: "WQP",    color: "text-teal-400 bg-teal-500/10 border-teal-500/30" },
  seed:   { abbr: "Seed",   color: "text-[#D1D5DB] bg-[#6B7280]/10 border-[#6B7280]/30" },
  manual: { abbr: "Manual", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
};

function SourceBadge({ source }: { source?: string }) {
  const cfg = SOURCE_STYLES[source || "seed"] || SOURCE_STYLES.seed;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${cfg.color}`}>
      {cfg.abbr}
    </span>
  );
}

// Sparkline SVG for mini trend charts in the table
function Sparkline({ data, color, height = 24, width = 80 }: { data: number[]; color: string; height?: number; width?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} className="inline-block" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <circle cx={String((data.length - 1) / (data.length - 1) * width)} cy={String(height - ((data[data.length - 1] - min) / range) * (height - 4) - 2)} r="2" fill={color} />
    </svg>
  );
}

interface HistoryData {
  stationId: string;
  data: Array<{
    timestamp: string;
    dissolvedOxygen: number | null;
    pH: number | null;
    turbidity: number | null;
    eColiCount: number | null;
    temperature: number | null;
    source: string;
  }>;
}

// Latest EAV measurement value per station per parameter
interface MeasurementLatest {
  stationId: string;
  parameterId: string;
  value: number;
  source: string;
  timestamp: string;
}

interface StationTableProps {
  onStationClick?: (stationId: string) => void;
  selectedParams?: string[];
}

export default function StationTable({ onStationClick, selectedParams }: StationTableProps) {
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [paramDefs, setParamDefs] = useState<ParameterDef[]>([]);
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryData>>({});
  // EAV measurements: stationId -> parameterId -> { value, source, timestamp }
  const [eavData, setEavData] = useState<Record<string, Record<string, MeasurementLatest>>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [stationsRes, paramsRes] = await Promise.all([
        fetch("/api/stations"),
        fetch("/api/parameters"),
      ]);
      let stationList: MonitoringStation[] = [];
      if (stationsRes.ok) {
        stationList = await stationsRes.json();
        setStations(stationList);
      }
      if (paramsRes.ok) setParamDefs(await paramsRes.json());

      // Fetch recent history for sparklines (last 20 readings per station)
      if (stationList.length > 0) {
        const historyPromises = stationList.map(async (s) => {
          try {
            const res = await fetch(`/api/stations/${s.id}/history?limit=20`);
            if (res.ok) {
              const data: HistoryData = await res.json();
              return { stationId: s.id, data };
            }
          } catch { /* ignore */ }
          return null;
        });
        const results = await Promise.all(historyPromises);
        const map: Record<string, HistoryData> = {};
        for (const r of results) {
          if (r) map[r.stationId] = r.data as unknown as HistoryData;
        }
        setHistoryMap(map);
      }
    } catch {
      const { monitoringStations } = await import("@/data/dc-waterways");
      setStations(monitoringStations);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Determine which param columns to show
  const activeParams = selectedParams && selectedParams.length > 0 ? selectedParams : DEFAULT_PARAMS;

  // Identify which params need EAV data (not in legacy reading fields)
  const eavParamIds = activeParams.filter((id) => !PARAM_TO_READING_FIELD[id]);

  // Fetch EAV measurement data for non-legacy parameters
  useEffect(() => {
    if (eavParamIds.length === 0 || stations.length === 0) {
      if (eavParamIds.length === 0) setEavData({});
      return;
    }

    const fetchEav = async () => {
      try {
        const params = new URLSearchParams({
          params: eavParamIds.join(","),
          limit: "5000",
        });
        const res = await fetch(`/api/measurements?${params}`);
        if (!res.ok) return;
        const json = await res.json();
        const data: MeasurementLatest[] = json.data || [];

        // Group by station + param, keeping only the latest measurement per combo
        const grouped: Record<string, Record<string, MeasurementLatest>> = {};
        for (const m of data) {
          if (!grouped[m.stationId]) grouped[m.stationId] = {};
          const existing = grouped[m.stationId][m.parameterId];
          if (!existing || m.timestamp > existing.timestamp) {
            grouped[m.stationId][m.parameterId] = m;
          }
        }
        setEavData(grouped);
      } catch { /* ignore */ }
    };
    fetchEav();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eavParamIds.join(","), stations.length]);

  // Build visible params with metadata — now supports ALL 25 parameters
  const visibleParams = activeParams.map((id) => {
    const def = paramDefs.find((p) => p.id === id);
    return {
      id,
      name: def?.name || id,
      unit: def?.unit || "",
      epaMin: def?.epaMin ?? null,
      epaMax: def?.epaMax ?? null,
      readingField: PARAM_TO_READING_FIELD[id] || null, // null = use EAV data
    };
  });

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-water-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden ${
      isDark
        ? "bg-[#13161F]/90 border border-white/[0.06] border-t-2 border-t-env-teal/20 shadow-lg shadow-black/20 backdrop-blur-sm"
        : "bg-white border border-[#D1D5DB] border-t-2 border-t-teal-400/20 shadow-md shadow-black/[0.08] backdrop-blur-sm"
    }`}>
      <div className={`px-5 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-[#D1D5DB]"}`}>
        <h3 className={`text-sm font-semibold flex items-center gap-1.5 ${isDark ? "text-[#F3F4F6]" : "text-[#1F2937]"}`}><span className="w-1.5 h-1.5 rounded-full bg-env-teal inline-block" />{t("table.title")}</h3>
        <p className={`text-xs mt-0.5 ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>{t("table.subtitle")}</p>
      </div>
      <div className="station-table-wrap">
        <table className="w-full text-sm min-w-[700px]" aria-label="Monitoring stations with latest water quality readings">
          <thead>
            <tr className={`border-b sticky top-0 z-10 backdrop-blur-md ${isDark ? "border-white/[0.06] bg-[#13161F]/95" : "border-[#D1D5DB] bg-[#F0F1F3]/95"}`}>
              <th scope="col" className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>{t("table.station")}</th>
              <th scope="col" className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>{t("table.type")}</th>
              <th scope="col" className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>{t("table.status")}</th>
              {visibleParams.map((p) => (
                <th key={p.id} scope="col" className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
                  <span title={`${p.name} (${p.unit})`}>
                    {p.name.length > 18 ? p.name.slice(0, 16) + "…" : p.name}
                  </span>
                </th>
              ))}
              <th scope="col" className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>Trend</th>
              <th scope="col" className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>{t("table.updated")}</th>
              <th scope="col" className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}><span className="sr-only">{t("table.details")}</span></th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station) => {
              const r = station.lastReading;
              const stationEav = eavData[station.id] || {};
              return (
                <tr
                  key={station.id}
                  onClick={() => onStationClick?.(station.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onStationClick?.(station.id); } }}
                  tabIndex={0}
                  role="link"
                  aria-label={`View details for ${station.name}`}
                  className={`border-b transition-colors cursor-pointer ${
                    isDark
                      ? "border-white/[0.04] hover:bg-white/[0.03] focus:bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-water-blue"
                      : "border-[#E5E7EB] hover:bg-[#F0F1F3] focus:bg-[#F0F1F3] focus:outline-none focus:ring-1 focus:ring-blue-400"
                  }`}
                >
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-water-blue flex-shrink-0" />
                      <div>
                        <div className={`text-xs font-medium ${isDark ? "text-white" : "text-[#111827]"}`}>{station.name}</div>
                        <div className={`text-[10px] ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`}>{station.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`text-xs capitalize ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>{station.type.replace("-", " ")}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={station.status} />
                  </td>
                  {visibleParams.map((p) => {
                    // Try legacy reading field first, then EAV measurement data
                    let val: number | undefined;
                    if (p.readingField && r) {
                      val = (r as unknown as Record<string, number | undefined>)[p.readingField];
                    }
                    if (val == null && stationEav[p.id]) {
                      val = stationEav[p.id].value;
                    }

                    const level = getThresholdLevel(val ?? null, p.epaMin, p.epaMax);
                    const levelColor = {
                      good: isDark ? "text-green-400" : "text-green-600",
                      warning: isDark ? "text-amber-400" : "text-amber-600",
                      violation: isDark ? "text-red-400" : "text-red-600",
                      unknown: isDark ? "text-[#6B7280]" : "text-[#6B7280]",
                    }[level];

                    return (
                      <td key={p.id} className="py-2.5 px-4">
                        {val != null ? (
                          <div className="flex items-center gap-1.5">
                            <ThresholdDot value={val} epaMin={p.epaMin} epaMax={p.epaMax} />
                            <span className={`text-xs ${levelColor}`}>
                              {val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-xs ${isDark ? "text-[#6B7280]" : "text-[#6B7280]"}`}>—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-4">
                    {(() => {
                      const hist = historyMap[station.id] as unknown as { data?: Array<Record<string, number | null>> } | undefined;
                      const histData = hist?.data;
                      if (!histData || histData.length < 2) return <span className={`text-xs ${isDark ? "text-[#6B7280]" : "text-[#6B7280]"}`}>—</span>;
                      const doValues = histData.map((d) => d.dissolvedOxygen).filter((v): v is number => v != null);
                      if (doValues.length < 2) return <span className={`text-xs ${isDark ? "text-[#6B7280]" : "text-[#6B7280]"}`}>—</span>;
                      return <Sparkline data={doValues} color="#14B8A6" />;
                    })()}
                  </td>
                  <td className={`py-2.5 px-4 ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]">{r
                        ? new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "—"}</span>
                      {r && <SourceBadge source={(r as unknown as Record<string, unknown>).source as string | undefined} />}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <ExternalLink className={`w-3.5 h-3.5 ${isDark ? "text-[#6B7280] hover:text-blue-400" : "text-[#6B7280] hover:text-blue-500"} transition-colors`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
