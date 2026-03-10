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

const customTooltipStyle = {
  backgroundColor: "rgba(15, 29, 50, 0.95)",
  border: "1px solid rgba(30, 58, 95, 0.5)",
  borderRadius: "8px",
  padding: "10px",
  fontSize: "12px",
  color: "#F8FAFC",
};

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
  return (
    <div className="glass-panel rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-1">Environmental Justice - Ward Analysis</h3>
      <p className="text-xs text-slate-500 mb-4">
        CSO events, impervious surfaces, and green space access by DC ward
      </p>

      {/* Ward risk indicators */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
        {environmentalJusticeData.map((ward) => (
          <div
            key={ward.ward}
            className="rounded-lg border border-panel-border p-2 text-center"
          >
            <div className="text-[10px] text-slate-500 uppercase">Ward {ward.ward}</div>
            <div
              className="text-xs font-semibold mt-1"
              style={{ color: riskColors[ward.floodRisk] }}
            >
              {ward.floodRisk}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{ward.csoEvents} CSOs</div>
          </div>
        ))}
      </div>

      {/* CSO Events bar chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-2">Combined Sewer Overflow Events (Annual)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wardData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="csoEvents" name="CSO Events" radius={[4, 4, 0, 0]}>
                {wardData.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={riskColors[entry.floodRisk]}
                    fillOpacity={0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-2">Green Space Access (%)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wardData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} domain={[0, 100]} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="greenSpaceAccess" name="Green Space %" radius={[4, 4, 0, 0]} fill="#22C55E" fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
