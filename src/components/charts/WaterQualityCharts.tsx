"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { historicalData } from "@/data/dc-waterways";
import { useTheme } from "@/context/ThemeContext";

const trendData = historicalData.months.map((month, i) => ({
  month,
  dissolvedOxygen: historicalData.dissolvedOxygen[i],
  temperature: historicalData.temperature[i],
  pH: historicalData.pH[i],
  turbidity: historicalData.turbidity[i],
  eColiCount: historicalData.eColiCount[i],
  stormwaterRunoff: historicalData.stormwaterRunoff[i],
}));

function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return {
    isDark,
    gridColor: isDark ? "#1E3A5F" : "#E2E8F0",
    tickColor: isDark ? "#64748B" : "#94A3B8",
    tooltipStyle: {
      backgroundColor: isDark ? "rgba(15, 29, 50, 0.95)" : "rgba(255, 255, 255, 0.98)",
      border: isDark ? "1px solid rgba(30, 58, 95, 0.5)" : "1px solid #E2E8F0",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "12px",
      color: isDark ? "#F8FAFC" : "#1E293B",
      boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.08)",
    },
    titleColor: isDark ? "text-white" : "text-slate-900",
    subtitleColor: isDark ? "text-slate-500" : "text-slate-500",
  };
}

export function DOTrendChart() {
  const t = useChartTheme();
  return (
    <div className="glass-panel rounded-xl p-4">
      <h3 className={`text-sm font-semibold mb-1 ${t.titleColor}`}>Dissolved Oxygen Trends</h3>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly average (mg/L) - 2025</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={trendData}>
          <defs>
            <linearGradient id="doGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tickColor }} />
          <YAxis tick={{ fontSize: 11, fill: t.tickColor }} domain={[0, 14]} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Area type="monotone" dataKey="dissolvedOxygen" stroke="#3B82F6" fill="url(#doGradient)" strokeWidth={2} name="DO (mg/L)" />
          <Line type="monotone" dataKey={() => 5} stroke="#EF4444" strokeWidth={1} strokeDasharray="5 5" name="EPA Min (5 mg/L)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TemperatureTrendChart() {
  const t = useChartTheme();
  return (
    <div className="glass-panel rounded-xl p-4">
      <h3 className={`text-sm font-semibold mb-1 ${t.titleColor}`}>Water Temperature</h3>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly average (°C) - 2025</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={trendData}>
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tickColor }} />
          <YAxis tick={{ fontSize: 11, fill: t.tickColor }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Area type="monotone" dataKey="temperature" stroke="#22D3EE" fill="url(#tempGradient)" strokeWidth={2} name="Temperature (°C)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EColiChart() {
  const t = useChartTheme();
  return (
    <div className="glass-panel rounded-xl p-4">
      <h3 className={`text-sm font-semibold mb-1 ${t.titleColor}`}>E. coli Levels</h3>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly average (CFU/100mL) - 2025</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tickColor }} />
          <YAxis tick={{ fontSize: 11, fill: t.tickColor }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Bar dataKey="eColiCount" name="E. coli (CFU/100mL)" radius={[4, 4, 0, 0]} fill="#EF4444" fillOpacity={0.7} />
          <Line type="monotone" dataKey={() => 410} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 5" name="EPA Rec. Limit (410)" dot={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StormwaterChart() {
  const t = useChartTheme();
  return (
    <div className="glass-panel rounded-xl p-4">
      <h3 className={`text-sm font-semibold mb-1 ${t.titleColor}`}>Stormwater Runoff Volume</h3>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly totals (million gallons) - 2025</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tickColor }} />
          <YAxis tick={{ fontSize: 11, fill: t.tickColor }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Bar dataKey="stormwaterRunoff" name="Runoff (M gal)" radius={[4, 4, 0, 0]} fill="#8B5CF6" fillOpacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultiParameterChart() {
  const t = useChartTheme();
  return (
    <div className="glass-panel rounded-xl p-4">
      <h3 className={`text-sm font-semibold mb-1 ${t.titleColor}`}>Multi-Parameter Overview</h3>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Normalized water quality trends - 2025</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tickColor }} />
          <YAxis tick={{ fontSize: 11, fill: t.tickColor }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, color: t.isDark ? "#94A3B8" : "#64748B" }} />
          <Line type="monotone" dataKey="dissolvedOxygen" stroke="#3B82F6" strokeWidth={2} name="DO (mg/L)" dot={{ r: 2 }} />
          <Line type="monotone" dataKey="temperature" stroke="#22D3EE" strokeWidth={2} name="Temp (°C)" dot={{ r: 2 }} />
          <Line type="monotone" dataKey="turbidity" stroke="#F59E0B" strokeWidth={2} name="Turbidity (NTU)" dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
