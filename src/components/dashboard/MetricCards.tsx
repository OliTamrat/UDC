"use client";

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
import { monitoringStations } from "@/data/dc-waterways";

function getAverageReading(key: string): number {
  const activeStations = monitoringStations.filter(
    (s) => s.status === "active" && s.lastReading && s.type !== "green-infrastructure"
  );
  if (activeStations.length === 0) return 0;
  const sum = activeStations.reduce((acc, s) => {
    const reading = s.lastReading as unknown as Record<string, number>;
    return acc + (reading[key] || 0);
  }, 0);
  return Math.round((sum / activeStations.length) * 10) / 10;
}

const metrics = [
  {
    label: "Active Stations",
    value: monitoringStations.filter((s) => s.status === "active").length.toString(),
    total: monitoringStations.length.toString(),
    icon: Radio,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    trend: "+2 this month",
    trendUp: true,
  },
  {
    label: "Avg. Dissolved Oxygen",
    value: getAverageReading("dissolvedOxygen").toString(),
    unit: "mg/L",
    icon: Droplets,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    trend: "Within EPA standards",
    trendUp: true,
  },
  {
    label: "Avg. Temperature",
    value: getAverageReading("temperature").toString(),
    unit: "°C",
    icon: Thermometer,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    trend: "Seasonal normal",
    trendUp: true,
  },
  {
    label: "Avg. pH Level",
    value: getAverageReading("pH").toString(),
    icon: Activity,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    trend: "Neutral range",
    trendUp: true,
  },
  {
    label: "Avg. Turbidity",
    value: getAverageReading("turbidity").toString(),
    unit: "NTU",
    icon: Waves,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    trend: "Above baseline",
    trendUp: false,
  },
  {
    label: "E. coli Alerts",
    value: monitoringStations.filter(
      (s) => s.lastReading && s.lastReading.eColiCount > 400
    ).length.toString(),
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    trend: "Stations above EPA limit",
    trendUp: false,
  },
  {
    label: "Green Infrastructure",
    value: monitoringStations.filter((s) => s.type === "green-infrastructure").length.toString(),
    icon: TreePine,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    trend: "Active UDC sites",
    trendUp: true,
  },
  {
    label: "Active Research",
    value: "6",
    icon: FlaskConical,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    trend: "WRRI/CAUSES projects",
    trendUp: true,
  },
];

export default function MetricCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className={`metric-card rounded-xl border ${metric.borderColor} ${metric.bgColor} p-4`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon className={`w-4 h-4 ${metric.color}`} />
              </div>
              {metric.total && (
                <span className="text-xs text-slate-500">/ {metric.total}</span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${metric.color}`}>{metric.value}</span>
              {metric.unit && <span className="text-xs text-slate-500">{metric.unit}</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1">{metric.label}</p>
            <p
              className={`text-[10px] mt-2 ${
                metric.trendUp ? "text-green-500" : "text-amber-500"
              }`}
            >
              {metric.trend}
            </p>
          </div>
        );
      })}
    </div>
  );
}
