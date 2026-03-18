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

// Map parameter IDs to legacy reading fields
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

// Default columns when no filter is active
const DEFAULT_PARAMS = ["dissolved_oxygen", "ph", "turbidity", "ecoli"];

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
  seed:   { abbr: "Seed",   color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
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
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [stationsRes, paramsRes] = await Promise.all([
        fetch("/api/stations"),
        fetch("/api/parameters"),
      ]);
      if (stationsRes.ok) setStations(await stationsRes.json());
      if (paramsRes.ok) setParamDefs(await paramsRes.json());
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

  // Only show params that have a mapping to reading fields
  const visibleParams = activeParams
    .filter((id) => PARAM_TO_READING_FIELD[id])
    .map((id) => {
      const def = paramDefs.find((p) => p.id === id);
      return {
        id,
        name: def?.name || id,
        unit: def?.unit || "",
        epaMin: def?.epaMin ?? null,
        epaMax: def?.epaMax ?? null,
        readingField: PARAM_TO_READING_FIELD[id],
      };
    });

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-water-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className={`p-4 border-b ${isDark ? "border-panel-border" : "border-slate-200"}`}>
        <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{t("table.title")}</h3>
        <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t("table.subtitle")}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]" aria-label="Monitoring stations with latest water quality readings">
          <thead>
            <tr className={`border-b ${isDark ? "border-panel-border bg-udc-dark/30" : "border-slate-200 bg-slate-50"}`}>
              <th scope="col" className={`text-left py-2 px-4 text-xs font-medium uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t("table.station")}</th>
              <th scope="col" className={`text-left py-2 px-4 text-xs font-medium uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t("table.type")}</th>
              <th scope="col" className={`text-left py-2 px-4 text-xs font-medium uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t("table.status")}</th>
              {visibleParams.map((p) => (
                <th key={p.id} scope="col" className={`text-left py-2 px-4 text-xs font-medium uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  <span title={`${p.name} (${p.unit})`}>
                    {p.name.length > 18 ? p.name.slice(0, 16) + "…" : p.name}
                  </span>
                </th>
              ))}
              <th scope="col" className={`text-left py-2 px-4 text-xs font-medium uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t("table.updated")}</th>
              <th scope="col" className={`text-left py-2 px-4 text-xs font-medium uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}><span className="sr-only">{t("table.details")}</span></th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station) => {
              const r = station.lastReading;
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
                      ? "border-panel-border/50 hover:bg-panel-hover focus:bg-panel-hover focus:outline-none focus:ring-1 focus:ring-water-blue"
                      : "border-slate-100 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  }`}
                >
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-water-blue flex-shrink-0" />
                      <div>
                        <div className={`text-xs font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{station.name}</div>
                        <div className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>{station.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`text-xs capitalize ${isDark ? "text-slate-300" : "text-slate-600"}`}>{station.type.replace("-", " ")}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={station.status} />
                  </td>
                  {visibleParams.map((p) => {
                    const val = r ? (r as unknown as Record<string, number | undefined>)[p.readingField] : undefined;
                    const level = getThresholdLevel(val ?? null, p.epaMin, p.epaMax);
                    const levelColor = {
                      good: isDark ? "text-green-400" : "text-green-600",
                      warning: isDark ? "text-amber-400" : "text-amber-600",
                      violation: isDark ? "text-red-400" : "text-red-600",
                      unknown: isDark ? "text-slate-500" : "text-slate-400",
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
                          <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className={`py-2.5 px-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]">{r
                        ? (r as unknown as Record<string, unknown>).source === "seed"
                          ? "Baseline"
                          : new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "—"}</span>
                      {r && <SourceBadge source={(r as unknown as Record<string, unknown>).source as string | undefined} />}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <ExternalLink className={`w-3.5 h-3.5 ${isDark ? "text-slate-600 hover:text-blue-400" : "text-slate-300 hover:text-blue-500"} transition-colors`} />
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
