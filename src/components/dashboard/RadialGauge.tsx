"use client";

import { useTheme } from "@/context/ThemeContext";

interface RadialGaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  size?: number;
}

export default function RadialGauge({ value, max, label, unit, color, size = 88 }: RadialGaugeProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="radial-gauge-track"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-sm font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>
            {Math.round(pct * 100)}%
          </span>
          <span className={`text-[8px] ${isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}>{unit}</span>
        </div>
      </div>
      <span className={`text-[10px] font-medium text-center leading-tight ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
        {label}
      </span>
    </div>
  );
}
