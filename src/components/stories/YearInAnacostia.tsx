"use client";

import { useState } from "react";
import { Calendar, Sun, CloudRain, Snowflake, Flower2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { StoryCard, FadeIn } from "./ScrollySection";

/**
 * "A Year in the Anacostia" — Seasonal heatmap showing how water quality
 * parameters change throughout the year. Interactive month-by-month view.
 */

interface MonthData {
  month: string;
  short: string;
  season: "winter" | "spring" | "summer" | "fall";
  temperature: number;
  dissolvedOxygen: number;
  turbidity: number;
  ecoli: number;
  narrative: string;
}

const MONTHLY_DATA: MonthData[] = [
  {
    month: "January",
    short: "Jan",
    season: "winter",
    temperature: 4,
    dissolvedOxygen: 11.5,
    turbidity: 18,
    ecoli: 45,
    narrative:
      "Cold water holds more oxygen — great for fish. But road salt runoff from winter storms spikes conductivity. The river looks clean but carries hidden pollutants.",
  },
  {
    month: "February",
    short: "Feb",
    season: "winter",
    temperature: 5,
    dissolvedOxygen: 11.0,
    turbidity: 22,
    ecoli: 55,
    narrative:
      "Late winter freeze-thaw cycles erode stream banks. Snow melt carries months of accumulated pollutants from roads and parking lots into the watershed.",
  },
  {
    month: "March",
    short: "Mar",
    season: "spring",
    temperature: 8,
    dissolvedOxygen: 10.0,
    turbidity: 35,
    ecoli: 90,
    narrative:
      "Spring rains begin in earnest. Turbidity rises as construction season resumes. The first algae blooms appear in slow-moving tributaries.",
  },
  {
    month: "April",
    short: "Apr",
    season: "spring",
    temperature: 13,
    dissolvedOxygen: 9.0,
    turbidity: 40,
    ecoli: 120,
    narrative:
      "Cherry blossom season! But April showers bring more than flowers — heavy rains trigger Combined Sewer Overflows. E. coli climbs as temperatures warm.",
  },
  {
    month: "May",
    short: "May",
    season: "spring",
    temperature: 18,
    dissolvedOxygen: 8.0,
    turbidity: 30,
    ecoli: 150,
    narrative:
      "Lawns get fertilized. Warm rain washes nitrogen and phosphorus into streams. Algae growth accelerates. Dissolved oxygen starts its summer decline.",
  },
  {
    month: "June",
    short: "Jun",
    season: "summer",
    temperature: 24,
    dissolvedOxygen: 6.5,
    turbidity: 25,
    ecoli: 200,
    narrative:
      "Summer heat arrives. Warmer water holds less oxygen. E. coli counts approach unsafe swimming levels. Green infrastructure projects work overtime.",
  },
  {
    month: "July",
    short: "Jul",
    season: "summer",
    temperature: 27,
    dissolvedOxygen: 5.5,
    turbidity: 20,
    ecoli: 280,
    narrative:
      "Peak stress for the river. Water temperature and E. coli hit their highs. Dissolved oxygen dips near the 5 mg/L danger zone. Algae blooms visible on the surface.",
  },
  {
    month: "August",
    short: "Aug",
    season: "summer",
    temperature: 26,
    dissolvedOxygen: 5.0,
    turbidity: 28,
    ecoli: 310,
    narrative:
      "The most critical month. Dissolved oxygen drops to EPA minimums. Heavy afternoon thunderstorms cause rapid turbidity spikes and sewer overflows.",
  },
  {
    month: "September",
    short: "Sep",
    season: "fall",
    temperature: 22,
    dissolvedOxygen: 6.5,
    turbidity: 35,
    ecoli: 180,
    narrative:
      "Relief begins. Cooler nights help the river recover. Hurricane season can bring massive rain events that reset conditions — for better or worse.",
  },
  {
    month: "October",
    short: "Oct",
    season: "fall",
    temperature: 15,
    dissolvedOxygen: 8.5,
    turbidity: 22,
    ecoli: 100,
    narrative:
      "Fall colors line the riverbanks. Leaf litter adds organic matter but oxygen recovers steadily. Water clarity improves as construction season winds down.",
  },
  {
    month: "November",
    short: "Nov",
    season: "fall",
    temperature: 9,
    dissolvedOxygen: 10.0,
    turbidity: 15,
    ecoli: 60,
    narrative:
      "The river enters recovery mode. Cold water absorbs more oxygen. E. coli drops to safe levels. Researchers begin compiling the year's data.",
  },
  {
    month: "December",
    short: "Dec",
    season: "winter",
    temperature: 5,
    dissolvedOxygen: 11.0,
    turbidity: 12,
    ecoli: 40,
    narrative:
      "Winter quiet. The cleanest water of the year by most measures. But early road salt applications begin a new cycle of chemical contamination.",
  },
];

const SEASON_ICONS = {
  winter: Snowflake,
  spring: Flower2,
  summer: Sun,
  fall: CloudRain,
};

const SEASON_COLORS = {
  winter: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  spring: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  summer: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  fall: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
};

// Normalize to 0-1 for heatmap coloring
function heatColor(value: number, min: number, max: number, invert = false): string {
  let pct = (value - min) / (max - min);
  if (invert) pct = 1 - pct;
  if (pct < 0.33) return "bg-green-500";
  if (pct < 0.66) return "bg-amber-500";
  return "bg-red-500";
}

export default function YearInAnacostia() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [activeMonth, setActiveMonth] = useState(6); // July
  const data = MONTHLY_DATA[activeMonth];
  const SeasonIcon = SEASON_ICONS[data.season];
  const seasonColor = SEASON_COLORS[data.season];

  const params = [
    {
      label: "Temperature",
      key: "temperature" as const,
      unit: "°C",
      min: 4,
      max: 27,
      invert: false,
    },
    {
      label: "Dissolved O₂",
      key: "dissolvedOxygen" as const,
      unit: "mg/L",
      min: 5,
      max: 12,
      invert: true,
    },
    {
      label: "Turbidity",
      key: "turbidity" as const,
      unit: "NTU",
      min: 10,
      max: 45,
      invert: false,
    },
    {
      label: "E. coli",
      key: "ecoli" as const,
      unit: "CFU",
      min: 40,
      max: 310,
      invert: false,
    },
  ];

  return (
    <StoryCard
      title="A Year in the Anacostia"
      subtitle="How seasons shape the health of DC's river"
      icon={<Calendar className="w-5 h-5 text-amber-400" />}
      accentColor={isDark ? "bg-amber-500/10" : "bg-amber-50"}
    >
      {/* Heatmap Grid */}
      <FadeIn>
        <div className="mb-6">
          <h4
            className={`text-sm font-semibold mb-3 ${
              isDark ? "text-white" : "text-[#1F2937]"
            }`}
          >
            Seasonal Water Quality Heatmap
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th
                    className={`text-left py-1 pr-3 ${
                      isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"
                    }`}
                  >
                    Parameter
                  </th>
                  {MONTHLY_DATA.map((m, i) => (
                    <th
                      key={m.short}
                      className={`px-1 py-1 cursor-pointer text-center transition-colors ${
                        activeMonth === i
                          ? isDark
                            ? "text-white"
                            : "text-[#111827]"
                          : isDark
                            ? "text-[#6B7280]"
                            : "text-[#D1D5DB]"
                      }`}
                      onClick={() => setActiveMonth(i)}
                    >
                      {m.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {params.map((p) => (
                  <tr key={p.key}>
                    <td
                      className={`py-1 pr-3 font-medium whitespace-nowrap ${
                        isDark ? "text-[#E5E7EB]" : "text-[#374151]"
                      }`}
                    >
                      {p.label}
                    </td>
                    {MONTHLY_DATA.map((m, i) => {
                      const val = m[p.key];
                      const color = heatColor(val, p.min, p.max, p.invert);
                      return (
                        <td
                          key={m.short}
                          className="px-1 py-1"
                          onClick={() => setActiveMonth(i)}
                        >
                          <div
                            className={`w-full h-6 rounded-sm cursor-pointer transition-all ${color} ${
                              activeMonth === i
                                ? "ring-2 ring-white/50 scale-110"
                                : "opacity-70 hover:opacity-100"
                            }`}
                            title={`${m.month}: ${val} ${p.unit}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 mt-2 justify-end">
            <span
              className={`text-[10px] ${
                isDark ? "text-[#6B7280]" : "text-[#D1D5DB]"
              }`}
            >
              Healthy
            </span>
            <div className="flex gap-0.5">
              <div className="w-4 h-2 rounded-sm bg-green-500" />
              <div className="w-4 h-2 rounded-sm bg-amber-500" />
              <div className="w-4 h-2 rounded-sm bg-red-500" />
            </div>
            <span
              className={`text-[10px] ${
                isDark ? "text-[#6B7280]" : "text-[#D1D5DB]"
              }`}
            >
              Stressed
            </span>
          </div>
        </div>
      </FadeIn>

      {/* Active month detail */}
      <FadeIn delay={200}>
        <div
          className={`rounded-xl border p-4 ${
            isDark ? "bg-[#13161F] border-white/[0.06]" : "bg-[#F9FAFB] border-[#E5E7EB]"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg ${seasonColor.bg}`}>
              <SeasonIcon className={`w-4 h-4 ${seasonColor.text}`} />
            </div>
            <div>
              <h4
                className={`text-sm font-bold ${
                  isDark ? "text-white" : "text-[#111827]"
                }`}
              >
                {data.month}
              </h4>
              <span
                className={`text-[10px] capitalize ${seasonColor.text}`}
              >
                {data.season}
              </span>
            </div>
          </div>

          {/* Metric grid */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            {params.map((p) => {
              const val = data[p.key];
              const color = heatColor(val, p.min, p.max, p.invert);
              return (
                <div key={p.key} className="text-center">
                  <div
                    className={`text-lg font-bold ${
                      color === "bg-green-500"
                        ? "text-green-400"
                        : color === "bg-amber-500"
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {val}
                  </div>
                  <div
                    className={`text-[10px] ${
                      isDark ? "text-[#6B7280]" : "text-[#D1D5DB]"
                    }`}
                  >
                    {p.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Narrative */}
          <p
            className={`text-sm leading-relaxed ${
              isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"
            }`}
          >
            {data.narrative}
          </p>
        </div>
      </FadeIn>

      {/* Season navigation */}
      <FadeIn delay={400}>
        <div className="flex gap-2 mt-4">
          {(["winter", "spring", "summer", "fall"] as const).map(
            (season) => {
              const Icon = SEASON_ICONS[season];
              const sc = SEASON_COLORS[season];
              const monthIndices = MONTHLY_DATA.map((m, i) => ({
                season: m.season,
                i,
              }))
                .filter((m) => m.season === season)
                .map((m) => m.i);
              const isActive = monthIndices.includes(activeMonth);

              return (
                <button
                  key={season}
                  onClick={() => setActiveMonth(monthIndices[1] ?? monthIndices[0])}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium capitalize transition-colors border ${
                    isActive
                      ? `${sc.bg} ${sc.border} ${sc.text}`
                      : isDark
                        ? "border-white/[0.06] text-[#6B7280] hover:text-[#E5E7EB]"
                        : "border-[#E5E7EB] text-[#D1D5DB] hover:text-[#4B5563]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {season}
                </button>
              );
            }
          )}
        </div>
      </FadeIn>
    </StoryCard>
  );
}
