"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_YEAR = new Date().getFullYear();

// Seasonal E.coli multipliers — rainfall/CSO-driven pattern
// Peaks in spring (Mar-May) from CSO activations and first-flush runoff,
// secondary peak in fall (Sep) from fall storms. NOT temperature-driven.
// Source: DC DOEE CSO monitoring data, Anacostia Riverkeeper reports
const SEASONAL_ECOLI_MULTIPLIER = [0.15, 0.18, 1.6, 2.2, 1.9, 1.1, 0.75, 0.85, 1.5, 0.80, 0.30, 0.18];
// DO inversely correlated with temperature
const SEASONAL_DO_MULTIPLIER = [1.35, 1.3, 1.15, 1.0, 0.85, 0.7, 0.6, 0.63, 0.82, 1.02, 1.18, 1.32];

export interface MonthlySnapshot {
  monthIndex: number;
  month: string;
  ecoliMultiplier: number;
  doMultiplier: number;
}

interface TimeSliderProps {
  onMonthChange: (snapshot: MonthlySnapshot) => void;
  className?: string;
}

export default function TimeSlider({ onMonthChange, className = "" }: TimeSliderProps) {
  const [monthIndex, setMonthIndex] = useState(2); // Start at March (current)
  const [playing, setPlaying] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const emitChange = useCallback((idx: number) => {
    onMonthChange({
      monthIndex: idx,
      month: MONTHS[idx],
      ecoliMultiplier: SEASONAL_ECOLI_MULTIPLIER[idx],
      doMultiplier: SEASONAL_DO_MULTIPLIER[idx],
    });
  }, [onMonthChange]);

  useEffect(() => {
    emitChange(monthIndex);
  }, [monthIndex, emitChange]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setMonthIndex((prev) => {
        const next = (prev + 1) % 12;
        if (next === 0 && prev === 11) {
          setPlaying(false);
        }
        return next;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [playing]);

  const goBack = () => setMonthIndex((prev) => Math.max(0, prev - 1));
  const goForward = () => setMonthIndex((prev) => Math.min(11, prev + 1));

  // Color for slider segments based on water quality
  const getSegmentColor = (idx: number) => {
    const ecoli = SEASONAL_ECOLI_MULTIPLIER[idx];
    if (ecoli < 0.5) return isDark ? "#22C55E" : "#16A34A";
    if (ecoli < 1.0) return isDark ? "#F59E0B" : "#D97706";
    return isDark ? "#EF4444" : "#DC2626";
  };

  return (
    <div className={`${className}`}>
      <div className={`rounded-xl border p-4 ${
        isDark ? "bg-panel-bg/90 border-panel-border backdrop-blur-md" : "bg-white/90 border-slate-200 backdrop-blur-md shadow-sm"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
              Water Quality Timeline — {CURRENT_YEAR}
            </h4>
            <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Seasonal variation in water quality parameters
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
              isDark ? "bg-water-blue/20 text-blue-300" : "bg-blue-50 text-blue-700"
            }`}>
              {MONTHS[monthIndex]} {CURRENT_YEAR}
            </div>
          </div>
        </div>

        {/* Playback Controls + Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={goBack}
              disabled={monthIndex === 0}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                isDark ? "hover:bg-panel-hover text-slate-400" : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPlaying(!playing)}
              className={`p-2 rounded-lg transition-colors ${
                playing
                  ? "bg-water-blue text-white"
                  : isDark ? "bg-water-blue/20 text-blue-300 hover:bg-water-blue/30" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              }`}
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={goForward}
              disabled={monthIndex === 11}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                isDark ? "hover:bg-panel-hover text-slate-400" : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Custom slider track */}
          <div className="flex-1 relative">
            <div className="flex gap-[2px] h-2 rounded-full overflow-hidden">
              {MONTHS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setMonthIndex(idx); setPlaying(false); }}
                  className="flex-1 transition-all duration-200 relative"
                  style={{
                    backgroundColor: getSegmentColor(idx),
                    opacity: idx <= monthIndex ? 1 : 0.2,
                  }}
                  title={MONTHS[idx]}
                />
              ))}
            </div>
            {/* Active marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-water-blue shadow-md transition-all duration-300 pointer-events-none"
              style={{ left: `calc(${(monthIndex / 11) * 100}% - 7px)` }}
            />
          </div>

          {/* Month labels */}
          <div className={`text-[10px] font-medium min-w-[30px] text-right ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {MONTHS[monthIndex]}
          </div>
        </div>

        {/* Month labels below */}
        <div className="flex mt-1.5 px-[52px]">
          {MONTHS.map((m, idx) => (
            <div
              key={m}
              className={`flex-1 text-center text-[8px] transition-colors ${
                idx === monthIndex
                  ? isDark ? "text-white font-semibold" : "text-slate-900 font-semibold"
                  : isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {m}
            </div>
          ))}
        </div>

        {/* Quality indicators */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: isDark ? "#1E3A5F" : "#E2E8F0" }}>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isDark ? "#22C55E" : "#16A34A" }} />
            <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>Good quality</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isDark ? "#F59E0B" : "#D97706" }} />
            <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isDark ? "#EF4444" : "#DC2626" }} />
            <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>Poor quality</span>
          </div>
          <div className={`ml-auto text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            E. coli severity: {(SEASONAL_ECOLI_MULTIPLIER[monthIndex] * 100).toFixed(0)}% of peak
          </div>
        </div>
      </div>
    </div>
  );
}
