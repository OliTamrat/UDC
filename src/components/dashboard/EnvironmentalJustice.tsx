"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { environmentalJusticeData } from "@/data/dc-waterways";
import { useTheme } from "@/context/ThemeContext";

const riskColors: Record<string, string> = {
  Low: "#22C55E",
  Medium: "#F59E0B",
  High: "#EF4444",
};

const wardData = environmentalJusticeData.map((d) => ({
  name: `Ward ${d.ward}`,
  ...d,
}));

export default function EnvironmentalJustice() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const tooltipStyle = {
    backgroundColor: isDark ? "rgba(15, 29, 50, 0.95)" : "rgba(255, 255, 255, 0.98)",
    border: isDark ? "1px solid rgba(30, 58, 95, 0.5)" : "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "10px",
    fontSize: "12px",
    color: isDark ? "#F8FAFC" : "#1E293B",
  };

  const gridColor = isDark ? "#1E3A5F" : "#E2E8F0";
  const tickColor = isDark ? "#64748B" : "#94A3B8";

  return (
    <div className="glass-panel rounded-xl p-4">
      <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Ward-Level Environmental Justice Analysis</h3>
      <p className={`text-xs mb-4 max-w-2xl ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        Combined sewer overflow frequency, impervious surface coverage, and green space access
        by DC ward. Wards 7 and 8 — home to much of the Anacostia watershed — consistently
        experience higher CSO event counts and lower green space access, reflecting longstanding
        environmental inequities that UDC research aims to address.
      </p>

      {/* Ward risk indicators */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
        {environmentalJusticeData.map((ward) => (
          <div
            key={ward.ward}
            className={`rounded-lg border p-2 text-center ${
              isDark ? "border-panel-border" : "border-slate-200 bg-white"
            }`}
          >
            <div className={`text-[10px] uppercase ${isDark ? "text-slate-500" : "text-slate-400"}`}>Ward {ward.ward}</div>
            <div
              className="text-xs font-semibold mt-1"
              style={{ color: riskColors[ward.floodRisk] }}
            >
              {ward.floodRisk}
            </div>
            <div className={`text-[10px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{ward.csoEvents} CSOs</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className={`text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Combined Sewer Overflow Events (Annual)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wardData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="csoEvents" name="CSO Events" radius={[4, 4, 0, 0]}>
                {wardData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={riskColors[entry.floodRisk]} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className={`text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Green Space Access (%)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wardData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="greenSpaceAccess" name="Green Space %" radius={[4, 4, 0, 0]} fill="#22C55E" fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insight summary */}
      <div className={`mt-4 rounded-lg border px-4 py-3 text-xs ${
        isDark
          ? "border-amber-500/20 bg-amber-950/20 text-amber-200/80"
          : "border-amber-200 bg-amber-50 text-amber-900"
      }`}>
        <span className="font-semibold">Key finding:</span>{" "}
        Wards with the highest impervious surface coverage tend to have more CSO events and
        less green space, contributing to degraded water quality in nearby waterways. Green
        infrastructure investments — bioretention, permeable pavement, and rain gardens — are
        a primary strategy tracked by UDC WRRI to reduce runoff and improve equity outcomes.
      </div>
    </div>
  );
}
