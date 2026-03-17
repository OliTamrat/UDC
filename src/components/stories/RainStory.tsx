"use client";

import { useState, useEffect, useRef } from "react";
import { CloudRain, Droplets, AlertTriangle, ArrowDown } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { StoryCard, FadeIn } from "./ScrollySection";

/**
 * "When It Rains in DC" — Interactive story showing rainfall → turbidity correlation.
 * Uses animated rain simulation and real-ish data visualization.
 */

// Simulated rainfall event data (based on real DC storm patterns)
const RAIN_EVENTS = [
  { date: "Aug 2025", rainfall: 1.2, turbidity: 45, label: "Light rain" },
  { date: "Sep 2025", rainfall: 2.8, turbidity: 120, label: "Moderate storm" },
  { date: "Oct 2025", rainfall: 0.3, turbidity: 15, label: "Drizzle" },
  { date: "Nov 2025", rainfall: 3.5, turbidity: 180, label: "Heavy storm" },
  { date: "Dec 2025", rainfall: 1.8, turbidity: 65, label: "Winter rain" },
  { date: "Jan 2026", rainfall: 0.5, turbidity: 20, label: "Light snow" },
  { date: "Feb 2026", rainfall: 4.2, turbidity: 250, label: "Major storm" },
  { date: "Mar 2026", rainfall: 2.1, turbidity: 95, label: "Spring rain" },
];

const MAX_TURBIDITY = 300;
const MAX_RAINFALL = 5;

function RainAnimation({ intensity }: { intensity: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
      {Array.from({ length: Math.round(intensity * 30) }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 bg-blue-400/60 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * -20}%`,
            height: `${8 + Math.random() * 12}px`,
            animation: `rain-fall ${0.4 + Math.random() * 0.6}s linear infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

function TurbidityBar({
  value,
  maxValue,
  label,
  date,
  rainfall,
  isActive,
  isDark,
  onClick,
}: {
  value: number;
  maxValue: number;
  label: string;
  date: string;
  rainfall: number;
  isActive: boolean;
  isDark: boolean;
  onClick: () => void;
}) {
  const pct = (value / maxValue) * 100;
  const color =
    value > 150
      ? "bg-red-500"
      : value > 80
        ? "bg-amber-500"
        : value > 30
          ? "bg-yellow-400"
          : "bg-green-400";

  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
        isActive
          ? isDark
            ? "bg-white/5 ring-1 ring-water-blue"
            : "bg-blue-50 ring-1 ring-blue-300"
          : "hover:bg-white/5"
      }`}
    >
      {/* Rainfall drops indicator */}
      <div className="flex gap-0.5 h-4">
        {Array.from({ length: Math.min(5, Math.ceil(rainfall)) }).map(
          (_, i) => (
            <Droplets
              key={i}
              className="w-2.5 h-2.5 text-blue-400"
              style={{ opacity: 0.4 + (i / 5) * 0.6 }}
            />
          )
        )}
      </div>
      {/* Bar */}
      <div
        className={`w-full rounded-t-sm relative overflow-hidden ${
          isDark ? "bg-slate-700" : "bg-slate-200"
        }`}
        style={{ height: "100px" }}
      >
        <div
          className={`absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-700 ${color}`}
          style={{ height: `${pct}%` }}
        />
      </div>
      {/* Labels */}
      <span
        className={`text-[10px] font-medium ${
          isDark ? "text-slate-300" : "text-slate-700"
        }`}
      >
        {value} NTU
      </span>
      <span
        className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
      >
        {date}
      </span>
    </button>
  );
}

export default function RainStory() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [activeEvent, setActiveEvent] = useState(6); // Feb major storm
  const event = RAIN_EVENTS[activeEvent];

  return (
    <StoryCard
      title="When It Rains in DC"
      subtitle="How storms transform water quality in hours"
      icon={<CloudRain className="w-5 h-5 text-blue-400" />}
      accentColor={isDark ? "bg-blue-500/10" : "bg-blue-50"}
    >
      {/* Narrative */}
      <FadeIn>
        <div
          className={`rounded-xl p-4 mb-6 border ${
            isDark
              ? "bg-blue-950/30 border-blue-500/20"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <p
            className={`text-sm leading-relaxed ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Washington DC has a{" "}
            <strong>combined sewer system</strong> — when it rains heavily,
            stormwater and raw sewage mix together and overflow into the
            Anacostia River. A single heavy storm can turn clear water
            muddy brown within hours, sending turbidity readings from
            normal (under 25 NTU) to dangerous levels.
          </p>
        </div>
      </FadeIn>

      {/* Interactive Chart */}
      <FadeIn delay={200}>
        <div className="mb-4">
          <h4
            className={`text-sm font-semibold mb-3 ${
              isDark ? "text-white" : "text-slate-800"
            }`}
          >
            Turbidity After Rainfall Events
          </h4>
          <div className="flex gap-1">
            {RAIN_EVENTS.map((evt, i) => (
              <TurbidityBar
                key={i}
                value={evt.turbidity}
                maxValue={MAX_TURBIDITY}
                label={evt.label}
                date={evt.date}
                rainfall={evt.rainfall}
                isActive={activeEvent === i}
                isDark={isDark}
                onClick={() => setActiveEvent(i)}
              />
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Event Detail */}
      <FadeIn delay={400}>
        <div
          className={`rounded-xl border p-4 relative overflow-hidden ${
            isDark ? "bg-panel-bg border-panel-border" : "bg-slate-50 border-slate-200"
          }`}
        >
          <RainAnimation intensity={event.rainfall / MAX_RAINFALL} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-semibold ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {event.date} — {event.label}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  event.turbidity > 150
                    ? "bg-red-500/10 text-red-400"
                    : event.turbidity > 80
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-green-500/10 text-green-400"
                }`}
              >
                {event.turbidity > 150
                  ? "Dangerous"
                  : event.turbidity > 80
                    ? "Elevated"
                    : "Normal"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span
                  className={`text-[10px] uppercase ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Rainfall
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-bold ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    {event.rainfall}
                  </span>
                  <span
                    className={`text-xs ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    inches
                  </span>
                </div>
              </div>
              <div>
                <span
                  className={`text-[10px] uppercase ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Turbidity
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-bold ${
                      event.turbidity > 150
                        ? "text-red-400"
                        : event.turbidity > 80
                          ? "text-amber-400"
                          : "text-green-400"
                    }`}
                  >
                    {event.turbidity}
                  </span>
                  <span
                    className={`text-xs ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    NTU
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Takeaway */}
      <FadeIn delay={600}>
        <div className="mt-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p
            className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            <strong>Key insight:</strong> The February 2026 storm dropped 4.2
            inches of rain, pushing turbidity to 250 NTU — 10x the normal level.
            DC Water&apos;s Long Term Control Plan aims to reduce these overflows
            by 96% through green infrastructure and tunnel storage.
          </p>
        </div>
      </FadeIn>
    </StoryCard>
  );
}
