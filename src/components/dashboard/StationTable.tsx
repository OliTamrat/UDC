"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, AlertCircle, CheckCircle2, Wrench, ExternalLink } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import type { MonitoringStation } from "@/data/dc-waterways";

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
  seed:   { abbr: "Model",  color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
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

function WaterQualityIndicator({ value, thresholds }: { value: number; thresholds: { good: number; moderate: number } }) {
  if (value == null) return <span className="text-sm text-slate-500">—</span>;
  let color = "bg-green-400";
  if (value > thresholds.moderate) color = "bg-red-400";
  else if (value > thresholds.good) color = "bg-amber-400";

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-sm">{value.toLocaleString()}</span>
    </div>
  );
}

export default function StationTable({ onStationClick }: { onStationClick?: (stationId: string) => void }) {
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStations = useCallback(async () => {
    try {
      const res = await fetch("/api/stations");
      if (res.ok) {
        setStations(await res.json());
      }
    } catch {
      // Fall back to static data if API unavailable
      const { monitoringStations } = await import("@/data/dc-waterways");
      setStations(monitoringStations);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

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
              <th scope="col" className={`text-left py-2 px-4 text-xs font-medium uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t("table.do")}</th>
              <th scope="col" className={`text-left py-2 px-4 text-xs font-medium uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t("table.ph")}</th>
              <th scope="col" className={`text-left py-2 px-4 text-xs font-medium uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t("table.turbidity")}</th>
              <th scope="col" className={`text-left py-2 px-4 text-xs font-medium uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t("table.ecoli")}</th>
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
                  <td className="py-2.5 px-4 text-xs text-blue-400">
                    {r?.dissolvedOxygen || "—"}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-green-400">
                    {r?.pH || "—"}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-amber-400">
                    {r?.turbidity || "—"}
                  </td>
                  <td className="py-2.5 px-4">
                    {r?.eColiCount != null ? (
                      <WaterQualityIndicator value={r.eColiCount} thresholds={{ good: 400, moderate: 1000 }} />
                    ) : (
                      <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>—</span>
                    )}
                  </td>
                  <td className={`py-2.5 px-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]">{r ? new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
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
