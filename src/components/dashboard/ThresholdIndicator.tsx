"use client";

import { useTheme } from "@/context/ThemeContext";

interface ThresholdIndicatorProps {
  value: number | null | undefined;
  epaMin?: number | null;
  epaMax?: number | null;
  unit?: string;
  compact?: boolean;
}

export type ThresholdLevel = "good" | "warning" | "violation" | "unknown";

export function getThresholdLevel(
  value: number | null | undefined,
  epaMin?: number | null,
  epaMax?: number | null,
): ThresholdLevel {
  if (value == null) return "unknown";

  const belowMin = epaMin != null && value < epaMin;
  const aboveMax = epaMax != null && value > epaMax;

  if (belowMin || aboveMax) return "violation";

  // Warning zone: within 20% of threshold
  if (epaMin != null) {
    const warningThreshold = epaMin * 1.2;
    if (value < warningThreshold) return "warning";
  }
  if (epaMax != null) {
    const warningThreshold = epaMax * 0.8;
    if (value > warningThreshold) return "warning";
  }

  return "good";
}

const LEVEL_CONFIG = {
  good: {
    dot: "bg-green-400",
    ring: "ring-green-400/30",
    text: "text-green-400",
    bgDark: "bg-green-500/10 border-green-500/20",
    bgLight: "bg-green-100 border-green-300",
    label: "Within limits",
  },
  warning: {
    dot: "bg-amber-400",
    ring: "ring-amber-400/30",
    text: "text-amber-400",
    bgDark: "bg-amber-500/10 border-amber-500/20",
    bgLight: "bg-amber-100 border-amber-300",
    label: "Near threshold",
  },
  violation: {
    dot: "bg-red-500",
    ring: "ring-red-500/30",
    text: "text-red-400",
    bgDark: "bg-red-500/10 border-red-500/20",
    bgLight: "bg-red-100 border-red-300",
    label: "Exceeds limit",
  },
  unknown: {
    dot: "bg-[#9CA3AF]",
    ring: "ring-[#9CA3AF]/30",
    text: "text-[#D1D5DB]",
    bgDark: "bg-[#6B7280]/10 border-[#6B7280]/20",
    bgLight: "bg-[#F0F1F3] border-[#D1D5DB]",
    label: "No data",
  },
};

export function ThresholdDot({ value, epaMin, epaMax }: ThresholdIndicatorProps) {
  const level = getThresholdLevel(value, epaMin, epaMax);
  const config = LEVEL_CONFIG[level];

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${config.dot} ring-2 ${config.ring}`}
      title={config.label}
    />
  );
}

export default function ThresholdIndicator({ value, epaMin, epaMax, unit, compact }: ThresholdIndicatorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const level = getThresholdLevel(value, epaMin, epaMax);
  const config = LEVEL_CONFIG[level];

  if (value == null) {
    return <span className={`text-sm ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>—</span>;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <ThresholdDot value={value} epaMin={epaMin} epaMax={epaMax} />
        <span className={`text-sm ${config.text}`}>
          {typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
        </span>
        {unit && <span className={`text-[10px] ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>{unit}</span>}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border px-2 py-1 ${isDark ? config.bgDark : config.bgLight}`}>
      <div className="flex items-center gap-1.5">
        <ThresholdDot value={value} epaMin={epaMin} epaMax={epaMax} />
        <span className={`text-sm font-medium ${config.text}`}>
          {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        {unit && <span className={`text-[10px] ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>{unit}</span>}
      </div>
      <div className={`text-[9px] mt-0.5 ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>
        {config.label}
        {epaMax != null && ` (max: ${epaMax})`}
        {epaMin != null && epaMax == null && ` (min: ${epaMin})`}
      </div>
    </div>
  );
}
