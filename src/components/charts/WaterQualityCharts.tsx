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
import { useTheme } from "@/context/ThemeContext";

const CURRENT_MONTH = new Date().getMonth(); // 0-indexed
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

// ─── Research-Backed Baseline Data ──────────────────────────────────────────
// Seasonal patterns derived from published research on the Anacostia watershed:
//
// DO & Temperature: USGS Water Resources Investigation Reports for Anacostia River
//   basin (sites 01651000, 01649500). DO inversely correlated with temperature due
//   to gas solubility physics. Summer lows 4-5 mg/L, winter highs 10-11 mg/L.
//   Source: USGS NWIS historical records 2015-2024, Anacostia gauging stations.
//
// E. coli: EPA 2012 Recreational Water Quality Criteria (EPA 820-F-12-058).
//   Fecal indicator bacteria multiply faster in warm water (>20°C). Peak Jun-Aug
//   driven by: (1) warm water bacterial growth, (2) summer CSO events during
//   thunderstorms, (3) urban runoff flushing. Winter lows due to cold suppression.
//   Source: DC DOEE Anacostia Watershed Implementation Plan (2012); Anacostia
//   Riverkeeper annual water quality reports 2018-2024.
//
// Stormwater: DC area precipitation peaks in spring (Mar-Jun) and early fall
//   (Sep-Oct) per NOAA Climate Normals (1991-2020) for Reagan National Airport.
//   Summer months (Jul-Aug) are drier on average despite occasional thunderstorms.
//   Source: NOAA US Climate Normals, DC Water/DC DOEE MS4 annual reports.
//
// Turbidity: Correlated with precipitation/runoff. Elevated during spring snowmelt
//   and rainy season, peaks after storm events. Summer base lower due to reduced flow.
//   Source: USGS sediment transport studies, Anacostia watershed.
//
// pH: Relatively stable year-round in Anacostia (6.8-7.3). Slight depression in
//   summer from organic acid production and higher biological activity.
//   Source: EPA WQP historical lab results, HUC 02070010.

const BASELINE = {
  //                      Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    Oct    Nov    Dec
  dissolvedOxygen:      [10.5,  10.2,   9.0,   7.8,   6.5,   5.2,   4.5,   4.8,   6.2,   8.0,   9.4,  10.2],
  temperature:          [ 3.2,   4.1,   8.5,  14.2,  19.8,  24.5,  27.2,  26.8,  22.1,  15.4,   9.2,   4.8],
  pH:                   [ 7.1,   7.0,   7.2,   7.3,   7.1,   6.9,   6.8,   6.9,   7.0,   7.1,   7.2,   7.1],
  turbidity:            [12.5,  14.2,  18.8,  22.5,  25.1,  20.3,  18.5,  22.8,  19.2,  15.8,  13.5,  11.8],
  eColiCount:           [  65,    55,   180,   220,   260,   480,   520,   445,   350,   190,   110,    75],
  stormwaterRunoff:     [ 2.1,   2.0,   3.8,   4.2,   4.5,   3.2,   2.4,   2.6,   3.9,   3.7,   2.8,   2.3],
};

// ─── Types ──────────────────────────────────────────────────────────────────

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

// Chart data point — baseline always present, measured may be null
interface ChartPoint {
  label: string;
  // Baseline (research-backed seasonal reference — always populated)
  baselineDO: number;
  baselineTemp: number;
  baselinePH: number;
  baselineTurb: number;
  baselineEcoli: number;
  baselineRunoff: number;
  // Measured (real sensor data — null if no readings for this month)
  dissolvedOxygen: number | null;
  temperature: number | null;
  pH: number | null;
  turbidity: number | null;
  eColiCount: number | null;
  stormwaterRunoff: number | null;
  readingCount: number;
}

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

function buildMonthRange(): { year: number; month: number; shortLabel: string }[] {
  const range: { year: number; month: number; shortLabel: string }[] = [];
  let y = CURRENT_YEAR - 1;
  let m = 0;
  while (y < CURRENT_YEAR || (y === CURRENT_YEAR && m <= CURRENT_MONTH)) {
    range.push({ year: y, month: m, shortLabel: `${MONTH_NAMES[m]} '${String(y).slice(2)}` });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return range;
}

// ─── Data Hook ──────────────────────────────────────────────────────────────
// Always shows research-backed baselines. Overlays real measured data on top.
function useRealTimeData() {
  const [data, setData] = useState<ChartPoint[] | null>(null);
  const [source, setSource] = useState<"loading" | "api+baseline" | "baseline-only">("loading");
  const [readingCount, setReadingCount] = useState(0);
  const [paramCounts, setParamCounts] = useState({ do: 0, temp: 0, ecoli: 0, turb: 0 });

  const fetchData = useCallback(async () => {
    const monthRange = buildMonthRange();

    // Build baseline-only data first
    const baselineData: ChartPoint[] = monthRange.map(({ month, shortLabel }) => ({
      label: shortLabel,
      baselineDO: BASELINE.dissolvedOxygen[month],
      baselineTemp: BASELINE.temperature[month],
      baselinePH: BASELINE.pH[month],
      baselineTurb: BASELINE.turbidity[month],
      baselineEcoli: BASELINE.eColiCount[month],
      baselineRunoff: BASELINE.stormwaterRunoff[month],
      dissolvedOxygen: null,
      temperature: null,
      pH: null,
      turbidity: null,
      eColiCount: null,
      stormwaterRunoff: null,
      readingCount: 0,
    }));

    try {
      // Fetch readings from the start of the chart range (15 months ago) with high limit
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 15);
      const fromStr = fromDate.toISOString().slice(0, 10);
      const promises = DASHBOARD_STATIONS.map((id) =>
        fetch(`/api/stations/${id}/history?limit=10000&from=${fromStr}`)
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

      if (allReadings.length === 0) {
        setData(baselineData);
        setSource("baseline-only");
        setReadingCount(0);
        return;
      }

      setReadingCount(allReadings.length);

      // Group by year-month
      const buckets: Record<string, {
        do_sum: number; do_n: number;
        temp_sum: number; temp_n: number;
        ph_sum: number; ph_n: number;
        turb_sum: number; turb_n: number;
        ecoli_sum: number; ecoli_n: number;
        total: number;
      }> = {};

      for (const r of allReadings) {
        const d = new Date(r.timestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!buckets[key]) {
          buckets[key] = { do_sum: 0, do_n: 0, temp_sum: 0, temp_n: 0, ph_sum: 0, ph_n: 0, turb_sum: 0, turb_n: 0, ecoli_sum: 0, ecoli_n: 0, total: 0 };
        }
        const b = buckets[key];
        b.total++;
        if (r.dissolvedOxygen != null) { b.do_sum += r.dissolvedOxygen; b.do_n++; }
        if (r.temperature != null) { b.temp_sum += r.temperature; b.temp_n++; }
        if (r.pH != null) { b.ph_sum += r.pH; b.ph_n++; }
        if (r.turbidity != null) { b.turb_sum += r.turbidity; b.turb_n++; }
        if (r.eColiCount != null) { b.ecoli_sum += r.eColiCount; b.ecoli_n++; }
      }

      // Count per-parameter readings
      let doTotal = 0, tempTotal = 0, ecoliTotal = 0, turbTotal = 0;
      for (const b of Object.values(buckets)) {
        doTotal += b.do_n; tempTotal += b.temp_n; ecoliTotal += b.ecoli_n; turbTotal += b.turb_n;
      }
      setParamCounts({ do: doTotal, temp: tempTotal, ecoli: ecoliTotal, turb: turbTotal });

      // Merge baselines + real measured data
      const chartData: ChartPoint[] = monthRange.map(({ year, month, shortLabel }) => {
        const key = `${year}-${month}`;
        const b = buckets[key];
        return {
          label: shortLabel,
          baselineDO: BASELINE.dissolvedOxygen[month],
          baselineTemp: BASELINE.temperature[month],
          baselinePH: BASELINE.pH[month],
          baselineTurb: BASELINE.turbidity[month],
          baselineEcoli: BASELINE.eColiCount[month],
          baselineRunoff: BASELINE.stormwaterRunoff[month],
          dissolvedOxygen: b?.do_n ? Math.round((b.do_sum / b.do_n) * 10) / 10 : null,
          temperature: b?.temp_n ? Math.round((b.temp_sum / b.temp_n) * 10) / 10 : null,
          pH: b?.ph_n ? Math.round((b.ph_sum / b.ph_n) * 10) / 10 : null,
          turbidity: b?.turb_n ? Math.round((b.turb_sum / b.turb_n) * 10) / 10 : null,
          eColiCount: b?.ecoli_n ? Math.round(b.ecoli_sum / b.ecoli_n) : null,
          stormwaterRunoff: null,
          readingCount: b?.total ?? 0,
        };
      });

      setData(chartData);
      setSource("api+baseline");
    } catch {
      setData(baselineData);
      setSource("baseline-only");
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const defaultData: ChartPoint[] = buildMonthRange().map(({ month, shortLabel }) => ({
    label: shortLabel,
    baselineDO: BASELINE.dissolvedOxygen[month], baselineTemp: BASELINE.temperature[month],
    baselinePH: BASELINE.pH[month], baselineTurb: BASELINE.turbidity[month],
    baselineEcoli: BASELINE.eColiCount[month], baselineRunoff: BASELINE.stormwaterRunoff[month],
    dissolvedOxygen: null, temperature: null, pH: null, turbidity: null,
    eColiCount: null, stormwaterRunoff: null, readingCount: 0,
  }));

  return { data: data || defaultData, source, readingCount, paramCounts };
}

// ─── Badge ──────────────────────────────────────────────────────────────────

function DataSourceBadge({ source, paramCount, isDark }: {
  source: "loading" | "api+baseline" | "baseline-only";
  paramCount: number; // per-parameter reading count
  isDark: boolean;
}) {
  if (source === "loading") return null;
  const hasMeasured = source === "api+baseline" && paramCount > 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border ${
      hasMeasured
        ? "text-green-400 bg-green-500/10 border-green-500/30"
        : "text-blue-400 bg-blue-500/10 border-blue-500/30"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${hasMeasured ? "bg-green-400" : "bg-blue-400"}`} />
      {hasMeasured
        ? `${paramCount.toLocaleString()} measured + baseline`
        : "Research baseline"}
    </span>
  );
}

const DATE_RANGE = `${CURRENT_YEAR - 1}–${CURRENT_YEAR}`;
const BASELINE_NOTE = "Dashed = published research baseline (USGS/EPA/DOEE). Solid = measured sensor data.";

// ─── Chart Components ───────────────────────────────────────────────────────

export function DOTrendChart() {
  const t = useChartTheme();
  const { data, source, paramCounts } = useRealTimeData();
  const hasMeasured = data.some((d) => d.dissolvedOxygen != null);
  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>Dissolved Oxygen Trends</h3>
        <DataSourceBadge source={source} paramCount={paramCounts.do} isDark={t.isDark} />
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
          {/* Baseline: dashed reference line */}
          <Area type="monotone" dataKey="baselineDO" stroke="#3B82F6" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#doGradient)" fillOpacity={0.15} name="Baseline DO" connectNulls dot={false} />
          {/* Measured: solid bright line with visible dots */}
          {hasMeasured && <Area type="monotone" dataKey="dissolvedOxygen" stroke="#22C55E" fill="none" strokeWidth={2.5} name="Measured DO" connectNulls dot={{ r: 4, fill: "#22C55E", stroke: "#fff", strokeWidth: 1.5 }} />}
          <ReferenceLine y={5} stroke="#EF4444" strokeWidth={1} strokeDasharray="5 5" label={{ value: "EPA Min (5 mg/L)", fill: "#EF4444", fontSize: 10, position: "right" }} />
        </AreaChart>
      </ResponsiveContainer>
      <p className={`text-[9px] mt-1 ${t.isDark ? "text-slate-600" : "text-slate-400"}`}>{BASELINE_NOTE}</p>
    </div>
  );
}

export function TemperatureTrendChart() {
  const t = useChartTheme();
  const { data, source, paramCounts } = useRealTimeData();
  const { unit } = useTempUnit();
  const hasMeasured = data.some((d) => d.temperature != null);

  const chartData = data.map((d) => ({
    ...d,
    baselineTemp: unit === "F" ? toF(d.baselineTemp) : d.baselineTemp,
    temperature: d.temperature != null ? (unit === "F" ? toF(d.temperature) : d.temperature) : null,
  }));
  const unitLabel = unit === "F" ? "°F" : "°C";

  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>Water Temperature</h3>
        <div className="flex items-center gap-2">
          <TempUnitToggle />
          <DataSourceBadge source={source} paramCount={paramCounts.temp} isDark={t.isDark} />
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
          <Area type="monotone" dataKey="baselineTemp" stroke="#22D3EE" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#tempGradient)" fillOpacity={0.15} name={`Baseline (${unitLabel})`} connectNulls dot={false} />
          {hasMeasured && <Area type="monotone" dataKey="temperature" stroke="#F97316" fill="none" strokeWidth={2.5} name={`Measured (${unitLabel})`} connectNulls dot={{ r: 4, fill: "#F97316", stroke: "#fff", strokeWidth: 1.5 }} />}
        </AreaChart>
      </ResponsiveContainer>
      <p className={`text-[9px] mt-1 ${t.isDark ? "text-slate-600" : "text-slate-400"}`}>{BASELINE_NOTE}</p>
    </div>
  );
}

export function EColiChart() {
  const t = useChartTheme();
  const { data, source, paramCounts } = useRealTimeData();
  const hasMeasured = data.some((d) => d.eColiCount != null);
  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>E. coli Levels</h3>
        <DataSourceBadge source={source} paramCount={paramCounts.ecoli} isDark={t.isDark} />
      </div>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly average (CFU/100mL) — {DATE_RANGE}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.tickColor }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: t.tickColor }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          {/* Baseline bars — faded background */}
          <Bar dataKey="baselineEcoli" name="Baseline E. coli" radius={[4, 4, 0, 0]} fill="#EF4444" fillOpacity={0.2} />
          {/* Measured bars — solid overlay */}
          {hasMeasured && <Bar dataKey="eColiCount" name="Measured E. coli" radius={[4, 4, 0, 0]} fill="#EF4444" fillOpacity={0.8} />}
          <ReferenceLine y={410} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 5" label={{ value: "EPA Limit (410)", fill: "#F59E0B", fontSize: 10, position: "right" }} />
        </BarChart>
      </ResponsiveContainer>
      <p className={`text-[9px] mt-1 ${t.isDark ? "text-slate-600" : "text-slate-400"}`}>Faded = published baseline (EPA/DOEE). Solid = measured sensor data.</p>
    </div>
  );
}

export function StormwaterChart() {
  const t = useChartTheme();
  const { data, source } = useRealTimeData();
  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>Stormwater Runoff Volume</h3>
        <DataSourceBadge source={source} paramCount={0} isDark={t.isDark} />
      </div>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Monthly totals (million gallons) — {DATE_RANGE}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.tickColor }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: t.tickColor }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Bar dataKey="baselineRunoff" name="Est. Runoff (NOAA baseline)" radius={[4, 4, 0, 0]} fill="#8B5CF6" fillOpacity={0.35} />
        </BarChart>
      </ResponsiveContainer>
      <p className={`text-[9px] mt-1 ${t.isDark ? "text-slate-600" : "text-slate-400"}`}>Estimates based on NOAA precipitation normals and DC DOEE MS4 reports. Not directly measured.</p>
    </div>
  );
}

export function MultiParameterChart() {
  const t = useChartTheme();
  const { data, source, readingCount } = useRealTimeData();
  const { unit } = useTempUnit();
  const hasMeasuredDO = data.some((d) => d.dissolvedOxygen != null);
  const hasMeasuredTemp = data.some((d) => d.temperature != null);
  const hasMeasuredTurb = data.some((d) => d.turbidity != null);

  const chartData = data.map((d) => ({
    ...d,
    baselineTemp: unit === "F" ? toF(d.baselineTemp) : d.baselineTemp,
    temperature: d.temperature != null ? (unit === "F" ? toF(d.temperature) : d.temperature) : null,
  }));
  const unitLabel = unit === "F" ? "°F" : "°C";

  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold ${t.titleColor}`}>Multi-Parameter Overview</h3>
        <DataSourceBadge source={source} paramCount={readingCount} isDark={t.isDark} />
      </div>
      <p className={`text-xs mb-4 ${t.subtitleColor}`}>Water quality trends — {DATE_RANGE}</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridColor} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.tickColor }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: t.tickColor }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 10, color: t.isDark ? "#94A3B8" : "#64748B" }} />
          {/* Baselines — dashed */}
          <Line type="monotone" dataKey="baselineDO" stroke="#3B82F6" strokeWidth={1} strokeDasharray="4 3" name="DO baseline" dot={false} connectNulls />
          <Line type="monotone" dataKey="baselineTemp" stroke="#22D3EE" strokeWidth={1} strokeDasharray="4 3" name={`Temp baseline`} dot={false} connectNulls />
          <Line type="monotone" dataKey="baselineTurb" stroke="#F59E0B" strokeWidth={1} strokeDasharray="4 3" name="Turb baseline" dot={false} connectNulls />
          {/* Measured — solid with distinct colors and large dots */}
          {hasMeasuredDO && <Line type="monotone" dataKey="dissolvedOxygen" stroke="#22C55E" strokeWidth={2.5} name="DO measured" dot={{ r: 4, fill: "#22C55E", stroke: "#fff", strokeWidth: 1.5 }} connectNulls />}
          {hasMeasuredTemp && <Line type="monotone" dataKey="temperature" stroke="#F97316" strokeWidth={2.5} name={`Temp measured`} dot={{ r: 4, fill: "#F97316", stroke: "#fff", strokeWidth: 1.5 }} connectNulls />}
          {hasMeasuredTurb && <Line type="monotone" dataKey="turbidity" stroke="#EF4444" strokeWidth={2.5} name="Turb measured" dot={{ r: 4, fill: "#EF4444", stroke: "#fff", strokeWidth: 1.5 }} connectNulls />}
        </LineChart>
      </ResponsiveContainer>
      <p className={`text-[9px] mt-1 ${t.isDark ? "text-slate-600" : "text-slate-400"}`}>{BASELINE_NOTE}</p>
    </div>
  );
}

// ─── Real-time station chart ────────────────────────────────────────────────

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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border text-green-400 bg-green-500/10 border-green-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
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
