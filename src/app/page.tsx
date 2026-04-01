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
import { Droplets, MapPin, TrendingUp, Shield, SlidersHorizontal } from "lucide-react";
import { useState, useCallback } from "react";
import type { MonitoringStation } from "@/data/dc-waterways";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSidebarClass } from "@/hooks/useSidebarMargin";

const DCMap = dynamic(() => import("@/components/map/DCMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-xl glass-panel flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-water-blue border-t-transparent rounded-full animate-spin" />
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
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* Hero Section */}
          <section className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-4 sm:p-6 md:p-8 ${
            isDark
              ? "border-white/[0.06] bg-gradient-to-br from-[#13161F] via-[#0C0F17] to-[#0C0F17]"
              : "border-[#D1D5DB] bg-gradient-to-br from-white via-blue-50/30 to-[#F9FAFB]"
          }`}>
            <div className={`absolute inset-0 ${
              isDark ? "bg-gradient-to-r from-blue-600/5 via-transparent to-cyan-600/5" : "bg-gradient-to-r from-blue-100/30 via-transparent to-cyan-100/30"
            }`} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-[10px]">
                  UDC
                </div>
                <span className="text-xs font-medium text-udc-gold uppercase tracking-wider">
                  {t("hero.badge")}
                </span>
              </div>
              <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-[#111827]"}`}>
                {t("hero.title")}{" "}
                <span className="gradient-text">{t("hero.title_highlight")}</span>
              </h1>
              <p className={`text-sm max-w-2xl mb-4 ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>
                {t("hero.description")}
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Droplets, labelKey: "hero.stations" as const, color: "text-blue-400" },
                  { icon: MapPin, labelKey: "hero.watershed" as const, color: "text-green-400" },
                  { icon: TrendingUp, labelKey: "hero.usgs" as const, color: "text-cyan-400" },
                  { icon: Shield, labelKey: "hero.epa" as const, color: "text-amber-400" },
                ].map((item) => (
                  <div
                    key={item.labelKey}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border ${
                      isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-[#D1D5DB]"
                    }`}
                  >
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span className={isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}>{t(item.labelKey)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Data Source Notice */}
          <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-xs ${
            isDark
              ? "border-blue-500/20 bg-blue-950/20 text-blue-300"
              : "border-blue-300 bg-blue-100 text-blue-800"
          }`}>
            <Shield className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">{t("notice.title")}</span>{" "}
              {t("notice.text")}
            </div>
          </div>

          {/* Metric Cards */}
          <section>
            <MetricCards />
          </section>

          {/* AI Insights */}
          <section id="ai-insights">
            <WqisInsightsPanel />
          </section>

          {/* Interactive Map */}
          <section id="map">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>{t("section.map_title")}</h2>
                <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`}>
                  {t("section.map_desc")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className={`text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>{t("section.map_network")}</span>
              </div>
            </div>
            <div className="h-[250px] sm:h-[350px] md:h-[550px] overflow-hidden rounded-2xl clip-contents" aria-label="Interactive watershed map">
              <DCMap
                onStationSelect={setSelectedStation}
                selectedStation={selectedStation}
                onStationNavigate={handleStationNavigate}
                monthSnapshot={monthSnapshot}
              />
            </div>
            {/* Time Slider */}
            <div className="mt-4">
              <TimeSlider onMonthChange={handleMonthChange} />
            </div>
          </section>

          {/* Water Quality Section */}
          <TempUnitProvider>
          <section id="water-quality">
            <div className="mb-4">
              <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>{t("section.wq_title")}</h2>
              <p className={`text-xs max-w-3xl ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                {t("section.wq_desc")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 clip-contents">
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
                    ? "border-white/[0.06] bg-[#13161F] hover:bg-white/[0.04] text-[#E5E7EB] hover:border-water-blue/50"
                    : "border-[#D1D5DB] bg-white hover:bg-[#E5E7EB] text-[#111827] hover:border-blue-400"
                } ${selectedParams.length > 0 ? (isDark ? "border-water-blue/50" : "border-blue-400") : ""}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Explore Parameters
                {selectedParams.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isDark ? "bg-water-blue/20 text-blue-300" : "bg-blue-100 text-blue-700"
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
