"use client";

import { useState, useEffect, useCallback } from "react";
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
  ReferenceLine,
} from "recharts";
import { historicalData } from "@/data/dc-waterways";
import { useTheme } from "@/context/ThemeContext";

const CURRENT_YEAR = new Date().getFullYear();

// Static fallback data from dc-waterways
const staticTrendData = historicalData.months.map((month, i) => ({
  month,
  dissolvedOxygen: historicalData.dissolvedOxygen[i],
  temperature: historicalData.temperature[i],
  pH: historicalData.pH[i],
  turbidity: historicalData.turbidity[i],
  eColiCount: historicalData.eColiCount[i],
  stormwaterRunoff: historicalData.stormwaterRunoff[i],
}));

interface ReadingRecord {
  timestamp: string;
  dissolvedOxygen: number | null;
  temperature: number | null;
  pH: number | null;
  turbidity: number | null;
  eColiCount: number | null;
  source: string;
}

interface StationHistory {
  stationId: string;
  count: number;
  data: ReadingRecord[];
}

// Stations to aggregate for dashboard-level charts (main river stations)
const DASHBOARD_STATIONS = ["ANA-001", "ANA-002", "ANA-003", "ANA-004", "WB-001", "HR-001", "PB-001"];

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
    subtitleColor: isDark ? "text-slate-400" : "text-slate-600",
  };
}

// Hook to fetch real-time data from the API and aggregate by date
function useRealTimeData() {
  const [data, setData] = useState<typeof staticTrendData | null>(null);
  const [source, setSource] = useState<"loading" | "api" | "static">("loading");
  const [readingCount, setReadingCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      // Fetch recent readings from all main stations
      const promises = DASHBOARD_STATIONS.map((id) =>
        fetch(`/api/stations/${id}/history?limit=500`)
          .then((r) => (r.ok ? r.json() as Promise<StationHistory> : null))
          .catch(() => null)
      );
      const results = await Promise.all(promises);

      // Collect all non-seed readings
      const allReadings: ReadingRecord[] = [];
      for (const r of results) {
        if (!r?.data) continue;
        for (const reading of r.data) {
          if (reading.source !== "seed") allReadings.push(reading);
        }
      }

      if (allReadings.length < 10) {
        // Not enough real data, use static
        setData(staticTrendData);
        setSource("static");
        setReadingCount(0);
        return;
      }

      setReadingCount(allReadings.length);

      // Group by month and compute averages
      const monthBuckets: Record<string, {
        do_sum: number; do_n: number;
        temp_sum: number; temp_n: number;
        ph_sum: number; ph_n: number;
        turb_sum: number; turb_n: number;
        ecoli_sum: number; ecoli_n: number;
      }> = {};

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      for (const r of allReadings) {
        const d = new Date(r.timestamp);
        const monthKey = monthNames[d.getMonth()];
        if (!monthKey) continue;

        if (!monthBuckets[monthKey]) {
          monthBuckets[monthKey] = {
            do_sum: 0, do_n: 0, temp_sum: 0, temp_n: 0,
            ph_sum: 0, ph_n: 0, turb_sum: 0, turb_n: 0,
            ecoli_sum: 0, ecoli_n: 0,
          };
        }
        const b = monthBuckets[monthKey];
        if (r.dissolvedOxygen != null) { b.do_sum += r.dissolvedOxygen; b.do_n++; }
        if (r.temperature != null) { b.temp_sum += r.temperature; b.temp_n++; }
        if (r.pH != null) { b.ph_sum += r.pH; b.ph_n++; }
        if (r.turbidity != null) { b.turb_sum += r.turbidity; b.turb_n++; }
        if (r.eColiCount != null) { b.ecoli_sum += r.eColiCount; b.ecoli_n++; }
      }

      // Build chart data — use API averages where available, fall back to static for months with no data
      const chartData = monthNames.map((month, i) => {
        const b = monthBuckets[month];
        return {
          month,
          dissolvedOxygen: b?.do_n ? Math.round((b.do_sum / b.do_n) * 10) / 10 : staticTrendData[i].dissolvedOxygen,
          temperature: b?.temp_n ? Math.round((b.temp_sum / b.temp_n) * 10) / 10 : staticTrendData[i].temperature,
          pH: b?.ph_n ? Math.round((b.ph_sum / b.ph_n) * 10) / 10 : staticTrendData[i].pH,
          turbidity: b?.turb_n ? Math.round((b.turb_sum / b.turb_n) * 10) / 10 : staticTrendData[i].turbidity,
          eColiCount: b?.ecoli_n ? Math.round(b.ecoli_sum / b.ecoli_n) : staticTrendData[i].eColiCount,
          stormwaterRunoff: staticTrendData[i].stormwaterRunoff, // No API source for this
        };
      });

      setData(chartData);
      setSource("api");
    } catch {
      setData(staticTrendData);
      setSource("static");
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data: data || staticTrendData, source, readingCount };
}

function DataSourceBadge({ source, count, isDark }: { source: "loading" | "api" | "static"; count: number; isDark: boolean }) {
  if (source === "loading") return null;
  const isApi = source === "api";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border ${
      isApi
        ? "text-blue-400 bg-blue-500/10 border-blue-500/30"
        : isDark
          ? "text-slate-400 bg-slate-500/10 border-slate-500/30"
          : "text-slate-500 bg-slate-100 border-slate-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isApi ? "bg-blue-400" : "bg-slate-400"}`} />
      {isApi ? `USGS/EPA (${count.toLocaleString()} readings)` : "Seed Data"}
    </span>
  );
}

export function DOTrendChart() {
  const t = useChartTheme();
  const { data, source, readingCount } = useRealTimeData();
  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>Dissolved Oxygen Trends</h3>
        <DataSourceBadge source={source} count={readingCount} isDark={t.isDark} />
      </div>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly average (mg/L) — {CURRENT_YEAR}</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
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
          <ReferenceLine y={5} stroke="#EF4444" strokeWidth={1} strokeDasharray="5 5" label={{ value: "EPA Min (5 mg/L)", fill: "#EF4444", fontSize: 10, position: "right" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TemperatureTrendChart() {
  const t = useChartTheme();
  const { data, source, readingCount } = useRealTimeData();
  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>Water Temperature</h3>
        <DataSourceBadge source={source} count={readingCount} isDark={t.isDark} />
      </div>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly average (°C) — {CURRENT_YEAR}</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
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
  const { data, source, readingCount } = useRealTimeData();
  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>E. coli Levels</h3>
        <DataSourceBadge source={source} count={readingCount} isDark={t.isDark} />
      </div>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly average (CFU/100mL) — {CURRENT_YEAR}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tickColor }} />
          <YAxis tick={{ fontSize: 11, fill: t.tickColor }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Bar dataKey="eColiCount" name="E. coli (CFU/100mL)" radius={[4, 4, 0, 0]} fill="#EF4444" fillOpacity={0.7} />
          <ReferenceLine y={410} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 5" label={{ value: "EPA Limit (410)", fill: "#F59E0B", fontSize: 10, position: "right" }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StormwaterChart() {
  const t = useChartTheme();
  const { data } = useRealTimeData();
  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <h3 className={`text-sm font-semibold mb-1 ${t.titleColor}`}>Stormwater Runoff Volume</h3>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly totals (million gallons) — {CURRENT_YEAR}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
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
  const { data, source, readingCount } = useRealTimeData();
  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>Multi-Parameter Overview</h3>
        <DataSourceBadge source={source} count={readingCount} isDark={t.isDark} />
      </div>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Normalized water quality trends — {CURRENT_YEAR}</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
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

// Real-time station chart for individual station detail views
export function RealTimeStationChart({ stationId }: { stationId: string }) {
  const t = useChartTheme();
  const [data, setData] = useState<ReadingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stations/${stationId}/history?limit=100`)
      .then((r) => r.ok ? r.json() as Promise<StationHistory> : null)
      .then((result) => {
        if (result?.data) {
          // Filter out seed data, prefer real readings
          const realData = result.data.filter((r) => r.source !== "seed");
          setData(realData.length > 0 ? realData : result.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stationId]);

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-4 flex items-center justify-center h-[300px]">
        <div className="w-6 h-6 border-2 border-water-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className={`glass-panel rounded-xl p-4 flex items-center justify-center h-[300px] text-sm ${t.isDark ? "text-slate-400" : "text-slate-500"}`}>
        Insufficient data for chart — awaiting more readings from ingestion
      </div>
    );
  }

  const chartData = data.map((r) => ({
    time: new Date(r.timestamp).toLocaleDateString([], { month: "short", day: "numeric" }),
    dissolvedOxygen: r.dissolvedOxygen,
    temperature: r.temperature,
    pH: r.pH,
    turbidity: r.turbidity,
  }));

  const sourceLabel = data[0]?.source === "usgs" ? "USGS NWIS" : data[0]?.source === "epa" ? "EPA WQP" : data[0]?.source;

  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>Recent Readings</h3>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border text-blue-400 bg-blue-500/10 border-blue-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          {sourceLabel} — {data.length} readings
        </span>
      </div>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Time series from most recent ingestion runs</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: t.tickColor }} />
          <YAxis tick={{ fontSize: 11, fill: t.tickColor }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, color: t.isDark ? "#94A3B8" : "#64748B" }} />
          <Line type="monotone" dataKey="dissolvedOxygen" stroke="#3B82F6" strokeWidth={2} name="DO (mg/L)" dot={{ r: 1.5 }} connectNulls />
          <Line type="monotone" dataKey="temperature" stroke="#22D3EE" strokeWidth={2} name="Temp (°C)" dot={{ r: 1.5 }} connectNulls />
          <Line type="monotone" dataKey="turbidity" stroke="#F59E0B" strokeWidth={2} name="Turbidity (NTU)" dot={{ r: 1.5 }} connectNulls />
          <ReferenceLine y={5} stroke="#EF4444" strokeWidth={1} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
