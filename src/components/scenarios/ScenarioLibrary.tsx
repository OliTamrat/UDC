"use client";

import {
  CloudRain,
  AlertTriangle,
  Construction,
  Thermometer,
  Droplets,
  Clock,
  Activity,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import type { ScenarioDefinition, SpikeSummary } from "@/data/scenarios";

interface ScenarioLibraryProps {
  scenarios: ScenarioDefinition[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  spikeSummary?: SpikeSummary | null;
  className?: string;
}

const ICON_MAP: Record<string, typeof CloudRain> = {
  CloudRain,
  AlertTriangle,
  Construction,
  Thermometer,
  Droplets,
};

const CATEGORY_LABELS: Record<string, string> = {
  storm: "Weather Event",
  cso: "Infrastructure",
  construction: "Land Use",
  seasonal: "Climate",
  industrial: "Industrial",
};

export default function ScenarioLibrary({
  scenarios,
  selectedId,
  onSelect,
  spikeSummary,
  className = "",
}: ScenarioLibraryProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={className}>
      {/* Scenario Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {scenarios.map((scenario) => {
          const Icon = ICON_MAP[scenario.icon] || Droplets;
          const isSelected = selectedId === scenario.id;

          return (
            <button
              key={scenario.id}
              onClick={() => onSelect(scenario.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? isDark
                    ? "border-water-blue bg-water-blue/10 ring-1 ring-water-blue/30"
                    : "border-blue-400 bg-blue-50 ring-1 ring-blue-300"
                  : isDark
                    ? "border-white/[0.06] bg-[#13161F]/60 hover:bg-white/[0.04] hover:border-[#4B5563]"
                    : "border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] hover:border-[#D1D5DB]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${scenario.accentHex}20`,
                    color: scenario.accentHex,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-xs font-semibold leading-tight ${
                      isDark ? "text-white" : "text-[#111827]"
                    }`}
                  >
                    {scenario.name}
                  </h4>
                  <span
                    className={`text-[9px] uppercase tracking-wider font-medium ${
                      isDark ? "text-[#6B7280]" : "text-[#D1D5DB]"
                    }`}
                  >
                    {CATEGORY_LABELS[scenario.category]} · {scenario.duration}h
                  </span>
                </div>
              </div>
              <p
                className={`text-[10px] mt-2 line-clamp-2 leading-relaxed ${
                  isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"
                }`}
              >
                {scenario.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {scenario.affectedParams.map((p) => (
                  <span
                    key={p}
                    className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      isDark ? "bg-[#374151] text-[#D1D5DB]" : "bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {p === "eColiCount" ? "E. coli" : p === "dissolvedOxygen" ? "DO" : p}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Spike Summary Panel */}
      {spikeSummary && selectedId && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            isDark ? "bg-[#13161F]/90 border-white/[0.06]" : "bg-white/90 border-[#E5E7EB] shadow-sm"
          }`}
        >
          <h4 className={`text-xs font-semibold mb-3 flex items-center gap-2 ${isDark ? "text-white" : "text-[#111827]"}`}>
            <Activity className="w-3.5 h-3.5" />
            Spike Detection Summary
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <p className={`text-[10px] ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>Total Spikes</p>
              <p className={`text-lg font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>
                {spikeSummary.totalSpikes}
              </p>
            </div>
            <div>
              <p className={`text-[10px] flex items-center gap-1 ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
                <AlertCircle className="w-3 h-3 text-red-400" />
                Critical
              </p>
              <p className="text-lg font-bold text-red-400">{spikeSummary.criticalSpikes}</p>
            </div>
            <div>
              <p className={`text-[10px] flex items-center gap-1 ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Warnings
              </p>
              <p className="text-lg font-bold text-amber-400">{spikeSummary.warningSpikes}</p>
            </div>
            <div>
              <p className={`text-[10px] ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>Peak Hour</p>
              <p className={`text-lg font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>
                <Clock className="w-3.5 h-3.5 inline mr-1 opacity-50" />
                {spikeSummary.peakHour}h
              </p>
            </div>
            <div>
              <p className={`text-[10px] ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>Most Affected</p>
              <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-[#111827]"}`}>
                {spikeSummary.mostAffectedStation}
              </p>
            </div>
            <div>
              <p className={`text-[10px] ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>Parameters</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {spikeSummary.parameters.slice(0, 3).map((p) => (
                  <span
                    key={p.name}
                    className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      isDark ? "bg-red-500/20 text-red-300" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {p.name}: {p.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
