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
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";

  const tooltipStyle = {
    backgroundColor: isDark ? "rgba(19, 22, 31, 0.95)" : "rgba(255, 255, 255, 0.98)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "10px",
    fontSize: "12px",
    color: isDark ? "#F3F4F6" : "#111827",
  };

  const gridColor = isDark ? "#23262F" : "#E2E8F0";
  const tickColor = isDark ? "#9CA3AF" : "#94A3B8";

  return (
    <div className={`rounded-2xl p-4 ${isDark ? "bg-[#13161F]/90 border border-white/[0.06] shadow-lg shadow-black/20" : "bg-white border border-[#E5E7EB] shadow-sm shadow-black/[0.03]"}`}>
      <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>{t("ej.chart_title")}</h3>
      <p className={`text-xs mb-4 max-w-2xl ${isDark ? "text-[#E5E7EB]" : "text-[#6B7280]"}`}>
        {t("ej.chart_desc")}
      </p>

      {/* Ward risk indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-4">
        {environmentalJusticeData.map((ward) => (
          <div
            key={ward.ward}
            className={`rounded-lg border p-2 text-center ${
              isDark ? "border-white/[0.06]" : "border-[#E5E7EB] bg-white"
            }`}
          >
            <div className={`text-[10px] uppercase ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>Ward {ward.ward}</div>
            <div
              className="text-xs font-semibold mt-1"
              style={{ color: riskColors[ward.floodRisk] }}
            >
              {ward.floodRisk}
            </div>
            <div className={`text-[10px] mt-0.5 ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>{ward.csoEvents} CSOs</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className={`text-xs font-medium mb-2 ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>{t("ej.cso_chart")}</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wardData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: isDark ? "#F3F4F6" : "#111827" }} itemStyle={{ color: isDark ? "#D1D5DB" : "#374151" }} />
              <Bar dataKey="csoEvents" name="CSO Events" radius={[4, 4, 0, 0]}>
                {wardData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={riskColors[entry.floodRisk]} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className={`text-xs font-medium mb-2 ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>{t("ej.green_chart")}</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wardData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: isDark ? "#F3F4F6" : "#111827" }} itemStyle={{ color: isDark ? "#D1D5DB" : "#374151" }} />
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
        <span className="font-semibold">{t("ej.key_finding")}</span>{" "}
        {t("ej.finding_text")}
      </div>
    </div>
  );
}
