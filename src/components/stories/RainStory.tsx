"use client";

import { useState } from "react";
import { CloudRain, Droplets, AlertTriangle, Waves } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { StoryCard, FadeIn } from "./ScrollySection";

/**
 * "When It Rains in DC" — Interactive story showing rainfall → turbidity correlation.
 * Features animated rain, rising water level, and turbidity bar chart.
 */

// Simulated rainfall event data (based on real DC storm patterns)
const RAIN_EVENTS = [
  { date: "Aug 2025", rainfall: 1.2, turbidity: 45, waterLevel: 3.2, label: "Light rain" },
  { date: "Sep 2025", rainfall: 2.8, turbidity: 120, waterLevel: 5.8, label: "Moderate storm" },
  { date: "Oct 2025", rainfall: 0.3, turbidity: 15, waterLevel: 2.4, label: "Drizzle" },
  { date: "Nov 2025", rainfall: 3.5, turbidity: 180, waterLevel: 7.1, label: "Heavy storm" },
  { date: "Dec 2025", rainfall: 1.8, turbidity: 65, waterLevel: 4.0, label: "Winter rain" },
  { date: "Jan 2026", rainfall: 0.5, turbidity: 20, waterLevel: 2.6, label: "Light snow" },
  { date: "Feb 2026", rainfall: 4.2, turbidity: 250, waterLevel: 9.2, label: "Major storm" },
  { date: "Mar 2026", rainfall: 2.1, turbidity: 95, waterLevel: 5.1, label: "Spring rain" },
];

const MAX_TURBIDITY = 300;
const MAX_RAINFALL = 5;
const MAX_WATER_LEVEL = 10; // feet

function RainAnimation({ intensity }: { intensity: number }) {
  const count = Math.round(intensity * 40);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 bg-blue-400/50 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * -20}%`,
            height: `${6 + Math.random() * 14}px`,
            animation: `rain-fall ${0.3 + Math.random() * 0.5}s linear infinite`,
            animationDelay: `${Math.random() * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Animated river cross-section showing water rising */
function RiverCrossSection({
  waterLevel,
  turbidity,
  rainfall,
  isDark,
}: {
  waterLevel: number;
  turbidity: number;
  rainfall: number;
  isDark: boolean;
}) {
  const levelPct = Math.min(85, (waterLevel / MAX_WATER_LEVEL) * 85);
  // Water color shifts from clear blue to muddy brown based on turbidity
  const turbidityRatio = turbidity / MAX_TURBIDITY;
  const waterColor = turbidity > 150
    ? "rgba(139, 90, 43, 0.7)"   // muddy brown
    : turbidity > 80
      ? "rgba(180, 140, 60, 0.6)" // murky amber
      : turbidity > 30
        ? "rgba(100, 160, 180, 0.5)" // slightly cloudy
        : "rgba(59, 130, 246, 0.4)"; // clear blue

  const surfaceColor = turbidity > 150
    ? "rgba(139, 90, 43, 0.9)"
    : turbidity > 80
      ? "rgba(180, 140, 60, 0.8)"
      : turbidity > 30
        ? "rgba(100, 160, 180, 0.7)"
        : "rgba(59, 130, 246, 0.6)";

  return (
    <div className={`relative rounded-xl overflow-hidden border ${
      isDark ? "border-white/[0.06]" : "border-[#D1D5DB]"
    }`} style={{ height: "200px" }}>
      {/* Sky / background */}
      <div className={`absolute inset-0 ${
        isDark
          ? "bg-gradient-to-b from-[#1F2937] via-[#111827] to-[#0C0F17]"
          : "bg-gradient-to-b from-blue-100 via-blue-50 to-[#F3F4F6]"
      }`} />

      {/* Rain */}
      {rainfall > 0.5 && <RainAnimation intensity={rainfall / MAX_RAINFALL} />}

      {/* Riverbanks — V-shaped channel */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        {/* Left bank */}
        <polygon
          points="0,60 80,180 0,200 0,60"
          fill={isDark ? "#1a2940" : "#92855a"}
          opacity="0.8"
        />
        {/* Right bank */}
        <polygon
          points="400,60 320,180 400,200 400,60"
          fill={isDark ? "#1a2940" : "#92855a"}
          opacity="0.8"
        />
        {/* River bottom */}
        <polygon
          points="80,180 320,180 340,200 60,200"
          fill={isDark ? "#0a1628" : "#6b7280"}
          opacity="0.5"
        />
        {/* Grass/vegetation on banks */}
        <rect x="0" y="55" width="90" height="8" rx="2"
          fill={isDark ? "#166534" : "#4ade80"} opacity="0.4" />
        <rect x="310" y="55" width="90" height="8" rx="2"
          fill={isDark ? "#166534" : "#4ade80"} opacity="0.4" />
      </svg>

      {/* Rising water — animated fill */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
        style={{ height: `${levelPct}%` }}
      >
        {/* Water surface wave */}
        <div className="absolute top-0 left-0 right-0 h-3 overflow-hidden">
          <svg className="w-[200%] h-full" viewBox="0 0 800 12" preserveAspectRatio="none"
            style={{ animation: "water-surface-move 3s linear infinite" }}>
            <path
              d={`M0,6 Q50,0 100,6 Q150,12 200,6 Q250,0 300,6 Q350,12 400,6 Q450,0 500,6 Q550,12 600,6 Q650,0 700,6 Q750,12 800,6 L800,12 L0,12 Z`}
              fill={surfaceColor}
            />
          </svg>
        </div>
        {/* Water body */}
        <div
          className="absolute top-3 left-0 right-0 bottom-0 transition-colors duration-1000"
          style={{ backgroundColor: waterColor }}
        />
        {/* Sediment particles for high turbidity */}
        {turbidity > 80 && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: Math.round(turbidityRatio * 20) }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${20 + Math.random() * 70}%`,
                  width: `${2 + Math.random() * 3}px`,
                  height: `${2 + Math.random() * 3}px`,
                  backgroundColor: turbidity > 150 ? "rgba(120, 80, 30, 0.6)" : "rgba(160, 130, 60, 0.4)",
                  animation: `sediment-drift ${2 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Water level marker */}
      <div
        className="absolute right-3 transition-all duration-1000 ease-out flex items-center gap-1.5"
        style={{ bottom: `${levelPct}%` }}
      >
        <div className={`h-px w-6 ${turbidity > 150 ? "bg-red-400" : "bg-blue-400"}`} />
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
          turbidity > 150
            ? "bg-red-500/20 text-red-300"
            : "bg-blue-500/20 text-blue-300"
        }`}>
          {waterLevel} ft
        </span>
      </div>

      {/* Flood warning line */}
      <div
        className="absolute left-0 right-0 border-t border-dashed border-red-400/40"
        style={{ bottom: "72%" }}
      >
        <span className={`absolute right-2 -top-4 text-[8px] font-medium ${
          isDark ? "text-red-400/60" : "text-red-500/60"
        }`}>
          Flood stage
        </span>
      </div>

      {/* Normal level line */}
      <div
        className="absolute left-0 right-0 border-t border-dashed border-green-400/30"
        style={{ bottom: "28%" }}
      >
        <span className={`absolute left-2 -top-4 text-[8px] font-medium ${
          isDark ? "text-green-400/50" : "text-green-500/50"
        }`}>
          Normal
        </span>
      </div>
    </div>
  );
}

function TurbidityBar({
  value,
  maxValue,
  date,
  rainfall,
  isActive,
  isDark,
  onClick,
}: {
  value: number;
  maxValue: number;
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
      className={`flex-1 flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
        isActive
          ? isDark
            ? "bg-white/5 ring-1 ring-water-blue"
            : "bg-blue-100 ring-1 ring-blue-300"
          : isDark
            ? "hover:bg-white/5"
            : "hover:bg-[#F0F1F3]"
      }`}
    >
      {/* Rainfall drops */}
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
          isDark ? "bg-[#374151]" : "bg-[#E5E7EB]"
        }`}
        style={{ height: "80px" }}
      >
        <div
          className={`absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-700 ${color}`}
          style={{ height: `${pct}%` }}
        />
      </div>
      <span
        className={`text-[9px] font-medium ${
          isDark ? "text-[#E5E7EB]" : "text-[#374151]"
        }`}
      >
        {value}
      </span>
      <span
        className={`text-[8px] ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}
      >
        {date}
      </span>
    </button>
  );
}

export default function RainStory() {
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";
  const [activeEvent, setActiveEvent] = useState(6); // Feb major storm
  const event = RAIN_EVENTS[activeEvent];

  return (
    <StoryCard
      title={t("stories.rain_title")}
      subtitle={t("stories.rain_subtitle")}
      icon={<CloudRain className="w-5 h-5 text-blue-400" />}
      accentColor={isDark ? "bg-blue-500/10" : "bg-blue-100"}
    >
      {/* Narrative */}
      <FadeIn>
        <div
          className={`rounded-xl p-4 mb-6 border ${
            isDark
              ? "bg-blue-950/30 border-blue-500/20"
              : "bg-blue-100 border-blue-300"
          }`}
        >
          <p
            className={`text-sm leading-relaxed ${
              isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"
            }`}
          >
            {t("stories.rain_narrative")}
          </p>
        </div>
      </FadeIn>

      {/* River Cross Section — Water Level Visual */}
      <FadeIn delay={150}>
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Waves className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-500"}`} />
            <h4
              className={`text-sm font-semibold ${
                isDark ? "text-white" : "text-[#1F2937]"
              }`}
            >
              {t("stories.rain_river_level")}
            </h4>
          </div>
          <RiverCrossSection
            waterLevel={event.waterLevel}
            turbidity={event.turbidity}
            rainfall={event.rainfall}
            isDark={isDark}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-1.5 rounded-sm bg-blue-400/50" />
                <span className={`text-[9px] ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>
                  {t("stories.rain_clear")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-1.5 rounded-sm bg-amber-500/50" />
                <span className={`text-[9px] ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>
                  {t("stories.rain_murky")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: "rgba(139,90,43,0.7)" }} />
                <span className={`text-[9px] ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>
                  {t("stories.rain_muddy")}
                </span>
              </div>
            </div>
            <span className={`text-[9px] ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>
              {t("stories.rain_click_bar")}
            </span>
          </div>
        </div>
      </FadeIn>

      {/* Turbidity Bar Chart */}
      <FadeIn delay={300}>
        <div className="mb-4">
          <h4
            className={`text-xs font-semibold mb-2 ${
              isDark ? "text-[#E5E7EB]" : "text-[#374151]"
            }`}
          >
            {t("stories.rain_turbidity_chart")}
          </h4>
          <div className="flex gap-0.5">
            {RAIN_EVENTS.map((evt, i) => (
              <TurbidityBar
                key={i}
                value={evt.turbidity}
                maxValue={MAX_TURBIDITY}
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
      <FadeIn delay={450}>
        <div
          className={`rounded-xl border p-4 ${
            isDark ? "bg-[#13161F] border-white/[0.06]" : "bg-[#F0F1F3] border-[#D1D5DB]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-semibold ${
                isDark ? "text-[#E5E7EB]" : "text-[#374151]"
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
                ? t("stories.rain_dangerous")
                : event.turbidity > 80
                  ? t("stories.rain_elevated")
                  : t("stories.rain_normal")}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className={`text-[10px] uppercase ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>
                {t("stories.rain_rainfall")}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                  {event.rainfall}
                </span>
                <span className={`text-[10px] ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>in</span>
              </div>
            </div>
            <div>
              <span className={`text-[10px] uppercase ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>
                {t("stories.rain_water_level")}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-bold ${
                  event.waterLevel > 8 ? "text-red-400" : event.waterLevel > 5 ? "text-amber-400" : "text-green-400"
                }`}>
                  {event.waterLevel}
                </span>
                <span className={`text-[10px] ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>ft</span>
              </div>
            </div>
            <div>
              <span className={`text-[10px] uppercase ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>
                {t("stories.rain_turbidity")}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-bold ${
                  event.turbidity > 150 ? "text-red-400" : event.turbidity > 80 ? "text-amber-400" : "text-green-400"
                }`}>
                  {event.turbidity}
                </span>
                <span className={`text-[10px] ${isDark ? "text-[#374151]" : "text-[#D1D5DB]"}`}>NTU</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Takeaway */}
      <FadeIn delay={600}>
        <div className="mt-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p
            className={`text-sm ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}
          >
            {t("stories.rain_insight")}
          </p>
        </div>
      </FadeIn>
    </StoryCard>
  );
}
