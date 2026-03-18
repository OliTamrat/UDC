"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
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

const CURRENT_MONTH = new Date().getMonth(); // 0-indexed (0=Jan, 2=Mar)
const CURRENT_YEAR = new Date().getFullYear();
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Temperature Unit Context ───────────────────────────────────────────────
type TempUnit = "C" | "F";
const TempUnitContext = createContext<{ unit: TempUnit; toggle: () => void }>({
  unit: "F",
  toggle: () => {},
});

export function TempUnitProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnit] = useState<TempUnit>("F");
  const toggle = useCallback(() => setUnit((u) => (u === "C" ? "F" : "C")), []);
  return (
    <TempUnitContext.Provider value={{ unit, toggle }}>
      {children}
    </TempUnitContext.Provider>
  );
}

export function useTempUnit() {
  return useContext(TempUnitContext);
}

function toF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

export function TempUnitToggle() {
  const { unit, toggle } = useTempUnit();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
        isDark
          ? "border-panel-border text-slate-300 hover:border-blue-500/40 hover:text-blue-300"
          : "border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
      }`}
      title="Toggle temperature unit"
    >
      {unit === "C" ? "°C → °F" : "°F → °C"}
    </button>
  );
}

// ─── Corrected Static Fallback Data ─────────────────────────────────────────
// Scientifically accurate seasonal patterns for Anacostia watershed:
// - E. coli: peaks Jun-Aug (warm water = bacterial growth) + elevated Mar-Apr (spring rain/CSO)
// - Stormwater: peaks Mar-May (spring rains) and Sep-Oct (fall storms), lower in summer/winter
const correctedHistorical = {
  ...historicalData,
  //                      Jan  Feb  Mar   Apr   May   Jun   Jul   Aug   Sep   Oct  Nov  Dec
  eColiCount:           [ 65,  55, 180,  220,  260,  480,  520,  445,  350,  190, 110,  75],
  stormwaterRunoff:     [2.1, 2.0, 3.8,  4.2,  4.5,  3.2,  2.4,  2.6,  3.9,  3.7, 2.8, 2.3],
};

const staticTrendData = correctedHistorical.months.map((month, i) => ({
  month,
  dissolvedOxygen: correctedHistorical.dissolvedOxygen[i],
  temperature: correctedHistorical.temperature[i],
  pH: correctedHistorical.pH[i],
  turbidity: correctedHistorical.turbidity[i],
  eColiCount: correctedHistorical.eColiCount[i],
  stormwaterRunoff: correctedHistorical.stormwaterRunoff[i],
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

// Chart data point with year-month label
interface ChartPoint {
  month: string;
  label: string; // e.g. "Jan '25", "Mar '26"
  dissolvedOxygen: number;
  temperature: number;
  pH: number;
  turbidity: number;
  eColiCount: number;
  stormwaterRunoff: number;
  hasRealData: boolean;
}

// Stations to aggregate for dashboard-level charts
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

// Build the month range: from Jan 2025 up to current month (Mar 2026)
function buildMonthRange(): { year: number; month: number; label: string; shortLabel: string }[] {
  const range: { year: number; month: number; label: string; shortLabel: string }[] = [];
  let y = CURRENT_YEAR - 1; // start from previous year
  let m = 0; // January

  while (y < CURRENT_YEAR || (y === CURRENT_YEAR && m <= CURRENT_MONTH)) {
    const shortYear = String(y).slice(2);
    range.push({
      year: y,
      month: m,
      label: `${MONTH_NAMES[m]} ${y}`,
      shortLabel: `${MONTH_NAMES[m]} '${shortYear}`,
    });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return range;
}

// Hook to fetch real-time data from API and aggregate by year-month
function useRealTimeData() {
  const [data, setData] = useState<ChartPoint[] | null>(null);
  const [source, setSource] = useState<"loading" | "api" | "static">("loading");
  const [readingCount, setReadingCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const promises = DASHBOARD_STATIONS.map((id) =>
        fetch(`/api/stations/${id}/history?limit=2000`)
          .then((r) => (r.ok ? r.json() as Promise<StationHistory> : null))
          .catch(() => null)
      );
      const results = await Promise.all(promises);

      const allReadings: ReadingRecord[] = [];
      for (const r of results) {
        if (!r?.data) continue;
        for (const reading of r.data) {
          if (reading.source !== "seed") allReadings.push(reading);
        }
      }

      const monthRange = buildMonthRange();

      if (allReadings.length < 10) {
        // Not enough real data — use corrected static, truncated to current month
        const fallback = monthRange.map(({ month, shortLabel }) => ({
          ...staticTrendData[month],
          month: MONTH_NAMES[month],
          label: shortLabel,
          hasRealData: false,
        }));
        setData(fallback);
        setSource("static");
        setReadingCount(0);
        return;
      }

      setReadingCount(allReadings.length);

      // Group by year-month key
      const buckets: Record<string, {
        do_sum: number; do_n: number;
        temp_sum: number; temp_n: number;
        ph_sum: number; ph_n: number;
        turb_sum: number; turb_n: number;
        ecoli_sum: number; ecoli_n: number;
      }> = {};

      for (const r of allReadings) {
        const d = new Date(r.timestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!buckets[key]) {
          buckets[key] = {
            do_sum: 0, do_n: 0, temp_sum: 0, temp_n: 0,
            ph_sum: 0, ph_n: 0, turb_sum: 0, turb_n: 0,
            ecoli_sum: 0, ecoli_n: 0,
          };
        }
        const b = buckets[key];
        if (r.dissolvedOxygen != null) { b.do_sum += r.dissolvedOxygen; b.do_n++; }
        if (r.temperature != null) { b.temp_sum += r.temperature; b.temp_n++; }
        if (r.pH != null) { b.ph_sum += r.pH; b.ph_n++; }
        if (r.turbidity != null) { b.turb_sum += r.turbidity; b.turb_n++; }
        if (r.eColiCount != null) { b.ecoli_sum += r.eColiCount; b.ecoli_n++; }
      }

      // Build chart data — real data where available, corrected seasonal fallback otherwise
      const chartData: ChartPoint[] = monthRange.map(({ year, month, shortLabel }) => {
        const key = `${year}-${month}`;
        const b = buckets[key];
        const fallback = staticTrendData[month];
        const hasReal = !!b && (b.do_n > 0 || b.temp_n > 0 || b.turb_n > 0);
        return {
          month: MONTH_NAMES[month],
          label: shortLabel,
          dissolvedOxygen: b?.do_n ? Math.round((b.do_sum / b.do_n) * 10) / 10 : fallback.dissolvedOxygen,
          temperature: b?.temp_n ? Math.round((b.temp_sum / b.temp_n) * 10) / 10 : fallback.temperature,
          pH: b?.ph_n ? Math.round((b.ph_sum / b.ph_n) * 10) / 10 : fallback.pH,
          turbidity: b?.turb_n ? Math.round((b.turb_sum / b.turb_n) * 10) / 10 : fallback.turbidity,
          eColiCount: b?.ecoli_n ? Math.round(b.ecoli_sum / b.ecoli_n) : fallback.eColiCount,
          stormwaterRunoff: fallback.stormwaterRunoff,
          hasRealData: hasReal,
        };
      });

      setData(chartData);
      setSource("api");
    } catch {
      const monthRange = buildMonthRange();
      const fallback = monthRange.map(({ month, shortLabel }) => ({
        ...staticTrendData[month],
        month: MONTH_NAMES[month],
        label: shortLabel,
        hasRealData: false,
      }));
      setData(fallback);
      setSource("static");
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Default fallback truncated to current month
  const defaultData: ChartPoint[] = buildMonthRange().map(({ month, shortLabel }) => ({
    ...staticTrendData[month],
    month: MONTH_NAMES[month],
    label: shortLabel,
    hasRealData: false,
  }));

  return { data: data || defaultData, source, readingCount };
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

const DATE_RANGE = `${CURRENT_YEAR - 1}–${CURRENT_YEAR}`;

export function DOTrendChart() {
  const t = useChartTheme();
  const { data, source, readingCount } = useRealTimeData();
  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>Dissolved Oxygen Trends</h3>
        <DataSourceBadge source={source} count={readingCount} isDark={t.isDark} />
      </div>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly average (mg/L) — {DATE_RANGE}</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="doGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.tickColor }} interval="preserveStartEnd" />
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
  const { unit } = useTempUnit();

  const chartData = unit === "F"
    ? data.map((d) => ({ ...d, temperature: toF(d.temperature) }))
    : data;
  const unitLabel = unit === "F" ? "°F" : "°C";

  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>Water Temperature</h3>
        <div className="flex items-center gap-2">
          <TempUnitToggle />
          <DataSourceBadge source={source} count={readingCount} isDark={t.isDark} />
        </div>
      </div>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly average ({unitLabel}) — {DATE_RANGE}</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.tickColor }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: t.tickColor }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Area type="monotone" dataKey="temperature" stroke="#22D3EE" fill="url(#tempGradient)" strokeWidth={2} name={`Temperature (${unitLabel})`} />
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
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly average (CFU/100mL) — {DATE_RANGE}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.tickColor }} interval="preserveStartEnd" />
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
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly totals (million gallons) — {DATE_RANGE}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.tickColor }} interval="preserveStartEnd" />
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
  const { unit } = useTempUnit();

  const chartData = unit === "F"
    ? data.map((d) => ({ ...d, temperature: toF(d.temperature) }))
    : data;
  const unitLabel = unit === "F" ? "°F" : "°C";

  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>Multi-Parameter Overview</h3>
        <DataSourceBadge source={source} count={readingCount} isDark={t.isDark} />
      </div>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Normalized water quality trends — {DATE_RANGE}</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.tickColor }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: t.tickColor }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, color: t.isDark ? "#94A3B8" : "#64748B" }} />
          <Line type="monotone" dataKey="dissolvedOxygen" stroke="#3B82F6" strokeWidth={2} name="DO (mg/L)" dot={{ r: 2 }} />
          <Line type="monotone" dataKey="temperature" stroke="#22D3EE" strokeWidth={2} name={`Temp (${unitLabel})`} dot={{ r: 2 }} />
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
  const { unit } = useTempUnit();

  useEffect(() => {
    fetch(`/api/stations/${stationId}/history?limit=100`)
      .then((r) => r.ok ? r.json() as Promise<StationHistory> : null)
      .then((result) => {
        if (result?.data) {
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

  const unitLabel = unit === "F" ? "°F" : "°C";
  const chartData = data.map((r) => ({
    time: new Date(r.timestamp).toLocaleDateString([], { month: "short", day: "numeric" }),
    dissolvedOxygen: r.dissolvedOxygen,
    temperature: r.temperature != null ? (unit === "F" ? toF(r.temperature) : r.temperature) : null,
    pH: r.pH,
    turbidity: r.turbidity,
  }));

  const sourceLabel = data[0]?.source === "usgs" ? "USGS NWIS" : data[0]?.source === "epa" ? "EPA WQP" : data[0]?.source;

  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>Recent Readings</h3>
        <div className="flex items-center gap-2">
          <TempUnitToggle />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border text-blue-400 bg-blue-500/10 border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            {sourceLabel} — {data.length} readings
          </span>
        </div>
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
          <Line type="monotone" dataKey="temperature" stroke="#22D3EE" strokeWidth={2} name={`Temp (${unitLabel})`} dot={{ r: 1.5 }} connectNulls />
          <Line type="monotone" dataKey="turbidity" stroke="#F59E0B" strokeWidth={2} name="Turbidity (NTU)" dot={{ r: 1.5 }} connectNulls />
          <ReferenceLine y={5} stroke="#EF4444" strokeWidth={1} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
