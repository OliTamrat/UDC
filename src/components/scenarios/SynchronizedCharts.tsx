"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";
import type { ScenarioFrame, StationSnapshot } from "@/data/scenarios";

interface SynchronizedChartsProps {
  frames: ScenarioFrame[];
  currentStep: number;
  selectedStations: string[];
  className?: string;
}

const STATION_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

function getChartTheme(isDark: boolean) {
  return {
    grid: isDark ? "#1E3A5F30" : "#E2E8F030",
    axis: isDark ? "#64748B" : "#94A3B8",
    tooltip: isDark ? "#1E293B" : "#FFFFFF",
    tooltipBorder: isDark ? "#334155" : "#E2E8F0",
    text: isDark ? "#CBD5E1" : "#475569",
  };
}

export default function SynchronizedCharts({
  frames,
  currentStep,
  selectedStations,
  className = "",
}: SynchronizedChartsProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

  // Build chart data: one point per frame, one series per station
  const chartData = useMemo(() => {
    if (!frames.length || !selectedStations.length) return { do: [], turb: [], ecoli: [], temp: [] };

    // Sample every N frames for performance (max 100 data points)
    const sampleRate = Math.max(1, Math.floor(frames.length / 100));

    const doData: Record<string, number | string>[] = [];
    const turbData: Record<string, number | string>[] = [];
    const ecoliData: Record<string, number | string>[] = [];
    const tempData: Record<string, number | string>[] = [];

    for (let i = 0; i < frames.length; i += sampleRate) {
      const frame = frames[i];
      const doPoint: Record<string, number | string> = { hour: `${frame.hour}h` };
      const turbPoint: Record<string, number | string> = { hour: `${frame.hour}h` };
      const ecoliPoint: Record<string, number | string> = { hour: `${frame.hour}h` };
      const tempPoint: Record<string, number | string> = { hour: `${frame.hour}h` };

      for (const stId of selectedStations) {
        const snap = frame.stations.find((s) => s.stationId === stId);
        if (snap) {
          doPoint[stId] = snap.values.dissolvedOxygen;
          turbPoint[stId] = snap.values.turbidity;
          ecoliPoint[stId] = snap.values.eColiCount;
          tempPoint[stId] = snap.values.temperature;
        }
      }

      doData.push(doPoint);
      turbData.push(turbPoint);
      ecoliData.push(ecoliPoint);
      tempData.push(tempPoint);
    }

    return { do: doData, turb: turbData, ecoli: ecoliData, temp: tempData };
  }, [frames, selectedStations]);

  // Current step position as percentage for reference line
  const currentHourLabel = `${currentStep}h`;

  const charts = [
    {
      title: "Dissolved Oxygen (mg/L)",
      data: chartData.do,
      epaLine: 5,
      epaLabel: "EPA Min",
      yDomain: [0, 12] as [number, number],
    },
    {
      title: "Turbidity (NTU)",
      data: chartData.turb,
      epaLine: 50,
      epaLabel: "EPA Advisory",
      yDomain: undefined,
    },
    {
      title: "E. coli (CFU/100mL)",
      data: chartData.ecoli,
      epaLine: 410,
      epaLabel: "EPA Limit",
      yDomain: undefined,
    },
    {
      title: "Temperature (°C)",
      data: chartData.temp,
      epaLine: undefined,
      epaLabel: undefined,
      yDomain: undefined,
    },
  ];

  if (!selectedStations.length) {
    return (
      <div className={className}>
        <div
          className={`rounded-xl border p-8 text-center ${
            isDark ? "bg-[#13161F]/90 border-white/[0.06]" : "bg-white/90 border-[#E5E7EB]"
          }`}
        >
          <p className={`text-sm ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
            Select stations above to view synchronized charts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {charts.map((chart) => (
          <div
            key={chart.title}
            className={`rounded-xl border p-4 ${
              isDark ? "bg-[#13161F]/90 border-white/[0.06]" : "bg-white/90 border-[#E5E7EB] shadow-sm"
            }`}
          >
            <h5 className={`text-xs font-semibold mb-3 ${isDark ? "text-white" : "text-[#111827]"}`}>
              {chart.title}
            </h5>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chart.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  {selectedStations.map((stId, i) => (
                    <linearGradient key={stId} id={`grad-${stId}-${chart.title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={STATION_COLORS[i % STATION_COLORS.length]} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={STATION_COLORS[i % STATION_COLORS.length]} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: theme.axis, fontSize: 9 }}
                  axisLine={{ stroke: theme.grid }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={chart.yDomain}
                  tick={{ fill: theme.axis, fontSize: 9 }}
                  axisLine={{ stroke: theme.grid }}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.tooltip,
                    border: `1px solid ${theme.tooltipBorder}`,
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                  labelStyle={{ color: theme.text, fontWeight: "bold" }}
                />
                {chart.epaLine !== undefined && (
                  <ReferenceLine
                    y={chart.epaLine}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: chart.epaLabel,
                      fill: "#EF4444",
                      fontSize: 9,
                      position: "right",
                    }}
                  />
                )}
                {/* Current time reference */}
                <ReferenceLine
                  x={currentHourLabel}
                  stroke={isDark ? "#60A5FA" : "#3B82F6"}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
                {selectedStations.map((stId, i) => (
                  <Area
                    key={stId}
                    type="monotone"
                    dataKey={stId}
                    stroke={STATION_COLORS[i % STATION_COLORS.length]}
                    fill={`url(#grad-${stId}-${chart.title})`}
                    strokeWidth={2}
                    dot={false}
                    name={stId}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Station legend */}
      <div className="flex flex-wrap gap-3 mt-3 px-1">
        {selectedStations.map((stId, i) => {
          const snap = frames[currentStep]?.stations.find((s) => s.stationId === stId);
          return (
            <div key={stId} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: STATION_COLORS[i % STATION_COLORS.length] }}
              />
              <span className={`text-[10px] font-medium ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                {stId}
              </span>
              {snap && (
                <span className={`text-[9px] ${isDark ? "text-[#6B7280]" : "text-[#D1D5DB]"}`}>
                  ({snap.stationName})
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
