"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MetricCards from "@/components/dashboard/MetricCards";
import StationTable from "@/components/dashboard/StationTable";
import EnvironmentalJustice from "@/components/dashboard/EnvironmentalJustice";
import {
  DOTrendChart,
  TemperatureTrendChart,
  EColiChart,
  StormwaterChart,
  MultiParameterChart,
  TempUnitProvider,
} from "@/components/charts/WaterQualityCharts";
import Footer from "@/components/layout/Footer";
import { WqisInsightsPanel } from "@/components/ai/WqisInsightsPanel";
import ParameterExplorer from "@/components/dashboard/ParameterExplorer";
import TimeSlider, { type MonthlySnapshot } from "@/components/map/TimeSlider";
import { Droplets, MapPin, TrendingUp, Shield, SlidersHorizontal, Radio, Activity } from "lucide-react";
import { useState, useCallback } from "react";
import type { MonitoringStation } from "@/data/dc-waterways";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSidebarClass } from "@/hooks/useSidebarMargin";
import RadialGauge from "@/components/dashboard/RadialGauge";

const DCMap = dynamic(() => import("@/components/map/DCMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl glass-panel flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-env-teal border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#D1D5DB]">Loading DC Map...</span>
      </div>
    </div>
  ),
});

export default function Dashboard() {
  const [selectedStation, setSelectedStation] = useState<MonitoringStation | null>(null);
  const [monthSnapshot, setMonthSnapshot] = useState<MonthlySnapshot | null>(null);
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";
  const router = useRouter();
  const sidebarClass = useSidebarClass();

  const handleStationNavigate = useCallback((stationId: string) => {
    router.push(`/station/${stationId}`);
  }, [router]);

  const handleMonthChange = useCallback((snapshot: MonthlySnapshot) => {
    setMonthSnapshot(snapshot);
  }, []);

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? "bg-udc-dark" : "bg-[#F0F1F3]"}`}>
      <Sidebar />
      <main id="main-content" className={`flex-1 ${sidebarClass} min-w-0 overflow-x-hidden`}>
        <Header />
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
          {/* Condensed Hero Strip */}
          <section className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${
            isDark
              ? "border-white/[0.06] bg-gradient-to-br from-[#13161F] via-[#0C0F17] to-[#0C0F17]"
              : "border-[#D1D5DB] bg-gradient-to-br from-white via-teal-50/20 to-[#F9FAFB]"
          }`}>
            <div className={`absolute inset-0 ${
              isDark ? "bg-gradient-to-r from-teal-600/5 via-transparent to-cyan-600/5" : "bg-gradient-to-r from-teal-100/20 via-transparent to-cyan-100/20"
            }`} />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-[10px] shadow-lg shadow-udc-gold/20">
                  UDC
                </div>
                <div>
                  <h1 className={`text-base sm:text-lg font-bold leading-tight ${isDark ? "text-white" : "text-[#111827]"}`}>
                    {t("hero.title")}{" "}
                    <span className="gradient-text">{t("hero.title_highlight")}</span>
                  </h1>
                  <span className="text-[10px] font-medium text-env-teal uppercase tracking-wider">
                    {t("hero.badge")}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Droplets, labelKey: "hero.stations" as const, color: "text-env-teal" },
                  { icon: MapPin, labelKey: "hero.watershed" as const, color: "text-green-400" },
                  { icon: TrendingUp, labelKey: "hero.usgs" as const, color: "text-cyan-400" },
                  { icon: Shield, labelKey: "hero.epa" as const, color: "text-amber-400" },
                ].map((item) => (
                  <div
                    key={item.labelKey}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border ${
                      isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-[#D1D5DB]"
                    }`}
                  >
                    <item.icon className={`w-3 h-3 ${item.color}`} />
                    <span className={isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}>{t(item.labelKey)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Data Source Notice — compact single line */}
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] ${
            isDark
              ? "border-env-teal/20 bg-teal-950/20 text-teal-300"
              : "border-teal-300 bg-teal-50 text-teal-800"
          }`}>
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span><span className="font-semibold">{t("notice.title")}</span> {t("notice.text")}</span>
          </div>

          {/* ═══ MAP HERO ═══ */}
          <section id="map">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>{t("section.map_title")}</h2>
                <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`}>
                  {t("section.map_desc")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-env-teal animate-pulse" />
                <span className={`text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>{t("section.map_network")}</span>
              </div>
            </div>
            <div className="relative">
              <div className="h-[300px] sm:h-[420px] md:h-[600px] overflow-hidden rounded-2xl clip-contents glass-panel-hero" aria-label="Interactive watershed map">
                <DCMap
                  onStationSelect={setSelectedStation}
                  selectedStation={selectedStation}
                  onStationNavigate={handleStationNavigate}
                  monthSnapshot={monthSnapshot}
                />
                {/* Gradient overlay — top and bottom fade */}
                <div className={`absolute inset-0 pointer-events-none rounded-2xl ${
                  isDark
                    ? "bg-gradient-to-b from-[#070A12]/50 via-transparent to-[#070A12]/40"
                    : "bg-gradient-to-b from-white/30 via-transparent to-white/20"
                }`} />
                {/* Stat overlay pills — bottom-left */}
                <div className="absolute bottom-3 left-3 z-[500] flex flex-wrap gap-2 pointer-events-none">
                  {[
                    { icon: Radio, label: "12 Stations", color: "text-env-teal" },
                    { icon: Activity, label: "Real-time USGS", color: "text-cyan-400" },
                    { icon: Shield, label: "EPA Monitored", color: "text-amber-400" },
                  ].map((pill) => (
                    <div
                      key={pill.label}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium backdrop-blur-md ${
                        isDark
                          ? "bg-[#070A12]/70 border border-white/[0.08] text-[#E5E7EB]"
                          : "bg-white/80 border border-[#D1D5DB] text-[#374151]"
                      }`}
                    >
                      <pill.icon className={`w-3 h-3 ${pill.color}`} />
                      {pill.label}
                    </div>
                  ))}
                </div>
              </div>
              {/* Time Slider */}
              <div className="mt-3">
                <TimeSlider onMonthChange={handleMonthChange} />
              </div>
            </div>
          </section>

          {/* Water Quality Gauges */}
          <section>
            <div className={`rounded-2xl border p-4 ${
              isDark
                ? "bg-[#13161F]/90 border-white/[0.06] shadow-lg shadow-black/20 backdrop-blur-sm"
                : "bg-white border-[#D1D5DB] shadow-md shadow-black/[0.08]"
            }`}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-env-teal inline-block" />
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
                  Compliance Overview
                </h3>
              </div>
              <div className="flex items-center justify-around gap-4 flex-wrap">
                <RadialGauge value={78} max={100} label="Water Quality Index" unit="WQI" color="#14B8A6" />
                <RadialGauge value={85} max={100} label="DO Compliance" unit="EPA 5mg/L" color="#3B82F6" />
                <RadialGauge value={92} max={100} label="pH Compliance" unit="EPA 6.5-9" color="#10B981" />
                <RadialGauge value={67} max={100} label="E. coli Safety" unit="EPA 410" color="#EF4444" />
              </div>
            </div>
          </section>

          {/* Metric Cards */}
          <section>
            <MetricCards />
          </section>

          {/* Water Quality Charts */}
          <TempUnitProvider>
          <section id="water-quality">
            <div className="mb-3">
              <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>{t("section.wq_title")}</h2>
              <p className={`text-xs max-w-3xl ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                {t("section.wq_desc")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 clip-contents">
              <DOTrendChart />
              <TemperatureTrendChart />
              <EColiChart />
              <StormwaterChart />
            </div>
          </section>

          {/* Multi-parameter overview */}
          <section id="analytics">
            <div className="mb-3">
              <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>{t("section.multi_title")}</h2>
              <p className={`text-xs max-w-3xl ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                {t("section.multi_desc")}
              </p>
            </div>
            <div className="clip-contents">
              <MultiParameterChart />
            </div>
          </section>
          </TempUnitProvider>

          {/* AI Insights — moved below charts */}
          <section id="ai-insights">
            <WqisInsightsPanel />
          </section>

          {/* Environmental Justice */}
          <section>
            <div className="mb-3">
              <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>{t("section.ej_title")}</h2>
              <p className={`text-xs max-w-3xl ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                {t("section.ej_desc")}
              </p>
            </div>
            <div className="clip-contents">
              <EnvironmentalJustice />
            </div>
          </section>

          {/* Station Table */}
          <section id="stormwater">
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>{t("section.stations_title")}</h2>
                <p className={`text-xs max-w-3xl ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                  {t("section.stations_desc")}
                </p>
              </div>
              <button
                onClick={() => setExplorerOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  isDark
                    ? "border-white/[0.06] bg-[#13161F] hover:bg-white/[0.04] text-[#E5E7EB] hover:border-env-teal/50"
                    : "border-[#D1D5DB] bg-white hover:bg-[#E5E7EB] text-[#111827] hover:border-teal-400"
                } ${selectedParams.length > 0 ? (isDark ? "border-env-teal/50" : "border-teal-400") : ""}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Explore Parameters
                {selectedParams.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isDark ? "bg-env-teal/20 text-teal-300" : "bg-teal-100 text-teal-700"
                  }`}>
                    {selectedParams.length}
                  </span>
                )}
              </button>
            </div>
            <StationTable onStationClick={handleStationNavigate} selectedParams={selectedParams} />
          </section>

          {/* Footer */}
          <Footer />
        </div>
      </main>
      {/* Parameter Explorer Slide-out */}
      <ParameterExplorer
        open={explorerOpen}
        onClose={() => setExplorerOpen(false)}
        selectedParams={selectedParams}
        onParamsChange={setSelectedParams}
      />
    </div>
  );
}
