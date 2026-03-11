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
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import type { MonitoringStation } from "@/data/dc-waterways";

function computeMetrics(stations: MonitoringStation[]) {
  const active = stations.filter((s) => s.status === "active" && s.lastReading && s.type !== "green-infrastructure");
  const avg = (key: string) => {
    if (active.length === 0) return 0;
    const sum = active.reduce((acc, s) => {
      const reading = s.lastReading as unknown as Record<string, number>;
      return acc + (reading[key] || 0);
    }, 0);
    return Math.round((sum / active.length) * 10) / 10;
  };

  return [
    {
      label: "Active Stations",
      value: stations.filter((s) => s.status === "active").length.toString(),
      total: stations.length.toString(),
      icon: Radio, color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/20",
      lightBorderColor: "border-green-200", lightBgColor: "bg-green-50",
      trend: "+2 this month", trendUp: true,
    },
    {
      label: "Avg. Dissolved Oxygen",
      value: avg("dissolvedOxygen").toString(), unit: "mg/L",
      icon: Droplets, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20",
      lightBorderColor: "border-blue-200", lightBgColor: "bg-blue-50",
      trend: "Within EPA standards", trendUp: true,
    },
    {
      label: "Avg. Temperature",
      value: avg("temperature").toString(), unit: "°C",
      icon: Thermometer, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20",
      lightBorderColor: "border-cyan-200", lightBgColor: "bg-cyan-50",
      trend: "Seasonal normal", trendUp: true,
    },
    {
      label: "Avg. pH Level",
      value: avg("pH").toString(),
      icon: Activity, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20",
      lightBorderColor: "border-emerald-200", lightBgColor: "bg-emerald-50",
      trend: "Neutral range", trendUp: true,
    },
    {
      label: "Avg. Turbidity",
      value: avg("turbidity").toString(), unit: "NTU",
      icon: Waves, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20",
      lightBorderColor: "border-amber-200", lightBgColor: "bg-amber-50",
      trend: "Above baseline", trendUp: false,
    },
    {
      label: "E. coli Alerts",
      value: stations.filter((s) => s.lastReading && s.lastReading.eColiCount != null && s.lastReading.eColiCount > 400).length.toString(),
      icon: AlertTriangle, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20",
      lightBorderColor: "border-red-200", lightBgColor: "bg-red-50",
      trend: "Stations above EPA limit", trendUp: false,
    },
    {
      label: "Green Infrastructure",
      value: stations.filter((s) => s.type === "green-infrastructure").length.toString(),
      icon: TreePine, color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/20",
      lightBorderColor: "border-green-200", lightBgColor: "bg-green-50",
      trend: "Active UDC sites", trendUp: true,
    },
    {
      label: "Active Research",
      value: "6",
      icon: FlaskConical, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20",
      lightBorderColor: "border-purple-200", lightBgColor: "bg-purple-50",
      trend: "WRRI/CAUSES projects", trendUp: true,
    },
  ];
}

export default function MetricCards() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [metrics, setMetrics] = useState<ReturnType<typeof computeMetrics>>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-xl border p-4 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className={`metric-card rounded-xl border p-4 ${
              isDark
                ? `${metric.borderColor} ${metric.bgColor}`
                : `${metric.lightBorderColor} ${metric.lightBgColor}`
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${isDark ? metric.bgColor : metric.lightBgColor}`}>
                <Icon className={`w-4 h-4 ${metric.color}`} />
              </div>
              {metric.total && (
                <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>/ {metric.total}</span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${metric.color}`}>{metric.value}</span>
              {metric.unit && <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{metric.unit}</span>}
            </div>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{metric.label}</p>
            <p className={`text-[10px] mt-2 ${metric.trendUp ? "text-green-500" : "text-amber-500"}`}>
              {metric.trend}
            </p>
          </div>
        );
      })}
    </div>
  );
}
