"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface TimelinePlaybackProps {
  totalSteps: number;
  currentStep: number;
  onStepChange: (step: number) => void;
  playing: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  getStepLabel?: (step: number) => string;
  getStepColor?: (step: number) => string;
  className?: string;
}

const SPEEDS = [0.5, 1, 2, 4];

export default function TimelinePlayback({
  totalSteps,
  currentStep,
  onStepChange,
  playing,
  onPlayPause,
  onReset,
  speed,
  onSpeedChange,
  getStepLabel,
  getStepColor,
  className = "",
}: TimelinePlaybackProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onStepChange(Math.round(pct * totalSteps));
    },
    [totalSteps, onStepChange]
  );

  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onStepChange(Math.round(pct * totalSteps));
    },
    [totalSteps, onStepChange]
  );

  useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, handleDrag]);

  const stepBack = () => onStepChange(Math.max(0, currentStep - 1));
  const stepForward = () => onStepChange(Math.min(totalSteps, currentStep + 1));
  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    onSpeedChange(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const label = getStepLabel ? getStepLabel(currentStep) : `Hour ${currentStep}`;

  return (
    <div className={className}>
      <div
        className={`rounded-xl border p-4 ${
          isDark
            ? "bg-[#13161F]/90 border-white/[0.06] backdrop-blur-md"
            : "bg-white/90 border-[#D1D5DB] backdrop-blur-md shadow-sm"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className={`text-xs font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>
              Scenario Timeline
            </h4>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                playing
                  ? "bg-green-500/20 text-green-400"
                  : isDark
                    ? "bg-[#374151] text-[#D1D5DB]"
                    : "bg-[#E5E7EB] text-[#374151]"
              }`}
            >
              {playing ? "Playing" : currentStep === 0 ? "Ready" : "Paused"}
            </span>
          </div>
          <div
            className={`px-3 py-1 rounded-lg text-sm font-bold ${
              isDark ? "bg-water-blue/20 text-blue-300" : "bg-blue-100 text-blue-700"
            }`}
          >
            {label}
          </div>
        </div>

        {/* Controls + Timeline */}
        <div className="flex items-center gap-3">
          {/* Playback controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={onReset}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? "hover:bg-white/[0.04] text-[#D1D5DB]" : "hover:bg-[#E5E7EB] text-[#1F2937]"
              }`}
              aria-label="Reset timeline"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={stepBack}
              disabled={currentStep === 0}
              aria-label="Step back"
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                isDark ? "hover:bg-white/[0.04] text-[#D1D5DB]" : "hover:bg-[#E5E7EB] text-[#1F2937]"
              }`}
            >
              <SkipBack className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={onPlayPause}
              aria-label={playing ? "Pause" : "Play"}
              className={`p-2 rounded-lg transition-colors ${
                playing
                  ? "bg-water-blue text-white"
                  : isDark
                    ? "bg-water-blue/20 text-blue-300 hover:bg-water-blue/30"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-100"
              }`}
            >
              {playing ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
            </button>
            <button
              onClick={stepForward}
              disabled={currentStep >= totalSteps}
              aria-label="Step forward"
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                isDark ? "hover:bg-white/[0.04] text-[#D1D5DB]" : "hover:bg-[#E5E7EB] text-[#1F2937]"
              }`}
            >
              <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Timeline track */}
          <div
            ref={trackRef}
            role="slider"
            aria-label="Timeline position"
            aria-valuemin={0}
            aria-valuemax={totalSteps}
            aria-valuenow={currentStep}
            tabIndex={0}
            className="flex-1 relative h-3 cursor-pointer group"
            onClick={handleTrackClick}
            onMouseDown={() => setDragging(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") { e.preventDefault(); stepForward(); }
              if (e.key === "ArrowLeft") { e.preventDefault(); stepBack(); }
            }}
          >
            {/* Background track */}
            <div
              className={`absolute inset-0 rounded-full overflow-hidden ${
                isDark ? "bg-[#374151]" : "bg-[#E5E7EB]"
              }`}
            >
              {/* Color segments based on severity */}
              {totalSteps > 0 &&
                Array.from({ length: Math.min(totalSteps, 100) }, (_, i) => {
                  const stepIdx = Math.round((i / 100) * totalSteps);
                  const color = getStepColor ? getStepColor(stepIdx) : "#3B82F6";
                  return (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 transition-opacity"
                      style={{
                        left: `${(i / 100) * 100}%`,
                        width: `${100 / 100}%`,
                        backgroundColor: color,
                        opacity: stepIdx <= currentStep ? 0.8 : 0.15,
                      }}
                    />
                  );
                })}
            </div>

            {/* Progress overlay */}
            <div
              className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-100 pointer-events-none"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, rgba(59,130,246,0.3), rgba(59,130,246,0.1))",
              }}
            />

            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-water-blue shadow-lg transition-all duration-100 pointer-events-none group-hover:scale-110"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>

          {/* Speed control */}
          <button
            onClick={cycleSpeed}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
              isDark ? "bg-[#374151] text-[#E5E7EB] hover:bg-[#4B5563]" : "bg-[#E5E7EB] text-[#1F2937] hover:bg-[#E5E7EB]"
            }`}
            aria-label={`Playback speed: ${speed}x. Click to change.`}
          >
            <Gauge className="w-3 h-3" />
            {speed}x
          </button>
        </div>

        {/* Bottom info */}
        <div className="flex items-center justify-between mt-2">
          <span className={`text-[10px] ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>
            0h
          </span>
          <span className={`text-[10px] ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
            Step {currentStep} of {totalSteps} ({Math.round(progress)}%)
          </span>
          <span className={`text-[10px] ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>
            {totalSteps}h
          </span>
        </div>
      </div>
    </div>
  );
}
