"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowUpRight, Droplets, MapPin, Moon, Radio, Shield, Sun } from "lucide-react";

import MetricCards from "@/components/dashboard/MetricCards";
import StationTable from "@/components/dashboard/StationTable";
import EnvironmentalJustice from "@/components/dashboard/EnvironmentalJustice";
import LiveComplianceGauges from "@/components/dashboard/LiveComplianceGauges";
import RecreationSafety from "@/components/dashboard/RecreationSafety";
import TimeSlider, { type MonthlySnapshot } from "@/components/map/TimeSlider";
import {
  DOTrendChart,
  TemperatureTrendChart,
  EColiChart,
  StormwaterChart,
  MultiParameterChart,
  TempUnitProvider,
} from "@/components/charts/WaterQualityCharts";
import { useTheme } from "@/context/ThemeContext";
import type { MonitoringStation } from "@/data/dc-waterways";
import { useEmbedAutoHeight } from "./useEmbedAutoHeight";

const DCMap = dynamic(() => import("@/components/map/DCMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl glass-panel flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-env-teal border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#D1D5DB]">Loading watershed map...</span>
      </div>
    </div>
  ),
});

/**
 * How much of the dashboard the host page wants.
 *   map     - the watershed map alone, for a tight slot
 *   compact - map, recreation safety and headline metrics
 *   full    - everything a public visitor needs (default)
 */
type EmbedView = "map" | "compact" | "full";

const VIEWS: readonly EmbedView[] = ["map", "compact", "full"];

function parseView(value: string | null): EmbedView {
  return VIEWS.includes(value as EmbedView) ? (value as EmbedView) : "full";
}

/**
 * The chrome-free dashboard served at /embed.
 *
 * Everything the standalone app wraps around the data - sidebar, top bar,
 * search, settings, footer, admin links - is deliberately absent. The host page
 * supplies the page furniture; this supplies the data.
 *
 * Behaviour is set by query string so UDC can retune the embed by editing one
 * attribute in their CMS, with no redeploy on our side:
 *
 *   ?view=full|compact|map   how much to render          (default: full)
 *   ?theme=dark|light        colour scheme               (default: dark)
 *   ?nav=blank|inline        where station links open    (default: blank)
 *   ?cta=0                   hide the "full dashboard" link
 *   ?ai=1                    include the AI research assistant (off by default)
 */
export default function EmbedDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const view = parseView(searchParams.get("view"));
  const themeParam = searchParams.get("theme");
  const navMode = searchParams.get("nav") === "inline" ? "inline" : "blank";
  const showCta = searchParams.get("cta") !== "0";
  // The embed has no navbar to hang an appearance control on, so the toggle
  // lives in the identity strip. UDC can hide it with ?toggle=0 once they have
  // settled on one look.
  const showThemeToggle = searchParams.get("toggle") !== "0";

  const [selectedStation, setSelectedStation] = useState<MonitoringStation | null>(null);
  const [monthSnapshot, setMonthSnapshot] = useState<MonthlySnapshot | null>(null);

  useEmbedAutoHeight(view !== "map");

  // Honour ?theme= so the embed can match the host page rather than the other
  // way round. UDC's site is light; the dashboard defaults to dark.
  useEffect(() => {
    if (themeParam === "light" || themeParam === "dark") {
      setTheme(themeParam);
    }
  }, [themeParam, setTheme]);

  /**
   * Station detail pages carry the full app chrome, which would look broken
   * inside a 900px frame on a UDC page. By default we break out to a new tab;
   * ?nav=inline keeps navigation inside the frame if UDC prefers that.
   */
  const handleStationNavigate = useCallback(
    (stationId: string) => {
      if (navMode === "inline") {
        router.push(`/station/${stationId}`);
        return;
      }
      window.open(`${window.location.origin}/station/${stationId}`, "_blank", "noopener,noreferrer");
    },
    [navMode, router],
  );

  const handleMonthChange = useCallback((snapshot: MonthlySnapshot) => {
    setMonthSnapshot(snapshot);
  }, []);

  const showBeyondMap = view !== "map";
  const showFullDepth = view === "full";

  return (
    <div className={`min-h-screen ${isDark ? "bg-udc-dark" : "bg-[#F0F1F3]"}`}>
      <main id="main-content" className="p-3 sm:p-4 space-y-4">
        <EmbedHeader
          isDark={isDark}
          showCta={showCta}
          showThemeToggle={showThemeToggle}
          onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
        />

        {/* Watershed map */}
        <section>
          <div className="relative">
            <div
              className={`${
                view === "map"
                  ? "h-[calc(100vh-140px)] min-h-[420px]"
                  : "h-[460px] sm:h-[520px] md:h-[600px]"
              } rounded-2xl clip-contents glass-panel-hero`}
              aria-label="Interactive watershed map"
            >
              <DCMap
                onStationSelect={setSelectedStation}
                selectedStation={selectedStation}
                onStationNavigate={handleStationNavigate}
                monthSnapshot={monthSnapshot}
              />
              <div
                className={`absolute inset-0 pointer-events-none rounded-2xl ${
                  isDark
                    ? "bg-gradient-to-b from-[#070A12]/50 via-transparent to-[#070A12]/40"
                    : "bg-gradient-to-b from-white/30 via-transparent to-white/20"
                }`}
              />
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
            {showBeyondMap && (
              <div className="mt-3">
                <TimeSlider onMonthChange={handleMonthChange} />
              </div>
            )}
          </div>
        </section>

        {showBeyondMap && (
          <>
            <EmbedSection
              isDark={isDark}
              title="Recreation Safety"
              description="Real-time assessment based on EPA recreational water quality criteria"
            >
              <RecreationSafety />
            </EmbedSection>

            <section>
              <MetricCards />
            </section>
          </>
        )}

        {showFullDepth && (
          <>
            <section>
              <div
                className={`rounded-2xl border p-4 ${
                  isDark
                    ? "bg-[#13161F]/90 border-white/[0.06] shadow-lg shadow-black/20 backdrop-blur-sm"
                    : "bg-white border-[#D1D5DB] shadow-md shadow-black/[0.08]"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-env-teal inline-block" />
                  <h3
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isDark ? "text-[#D1D5DB]" : "text-[#374151]"
                    }`}
                  >
                    Compliance Overview
                  </h3>
                </div>
                <LiveComplianceGauges />
              </div>
            </section>

            <TempUnitProvider>
              <EmbedSection
                isDark={isDark}
                title="Water Quality Trends"
                description="Dissolved oxygen, temperature, bacteria and stormwater response across the watershed"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 clip-contents">
                  <DOTrendChart />
                  <TemperatureTrendChart />
                  <EColiChart />
                  <StormwaterChart />
                </div>
              </EmbedSection>

              <EmbedSection
                isDark={isDark}
                title="Multi-Parameter Overview"
                description="Compare measured parameters against EPA thresholds at a glance"
              >
                <div className="clip-contents">
                  <MultiParameterChart />
                </div>
              </EmbedSection>
            </TempUnitProvider>

            <EmbedSection
              isDark={isDark}
              title="Environmental Justice"
              description="Water quality outcomes mapped against community demographics across DC wards"
            >
              <div className="clip-contents">
                <EnvironmentalJustice />
              </div>
            </EmbedSection>

            <EmbedSection
              isDark={isDark}
              title="Monitoring Stations"
              description="All 12 stations with their latest readings. Select a station for the full record."
            >
              <StationTable onStationClick={handleStationNavigate} />
            </EmbedSection>
          </>
        )}

        <EmbedFooter isDark={isDark} />
      </main>
    </div>
  );
}

/** Compact identity strip - replaces the app's sidebar and top bar. */
function EmbedHeader({
  isDark,
  showCta,
  showThemeToggle,
  onToggleTheme,
}: {
  isDark: boolean;
  showCta: boolean;
  showThemeToggle: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <header
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${
        isDark
          ? "border-white/[0.06] bg-gradient-to-br from-[#13161F] via-[#0C0F17] to-[#0C0F17]"
          : "border-[#D1D5DB] bg-gradient-to-br from-white via-teal-50/20 to-[#F9FAFB]"
      }`}
    >
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-[10px] shadow-lg shadow-udc-gold/20">
            UDC
          </div>
          <div>
            <h1
              className={`text-base sm:text-lg font-bold leading-tight ${
                isDark ? "text-white" : "text-[#111827]"
              }`}
            >
              Water Quality <span className="gradient-text">Intelligence System</span>
            </h1>
            <span className="text-[10px] font-medium text-env-teal uppercase tracking-wider">
              Anacostia Watershed &middot; Live Monitoring
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { icon: Droplets, label: "12 Stations", color: "text-env-teal" },
            { icon: MapPin, label: "Anacostia Watershed", color: "text-green-400" },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border ${
                isDark
                  ? "bg-white/[0.03] border-white/[0.06] text-[#E5E7EB]"
                  : "bg-white border-[#D1D5DB] text-[#1F2937]"
              }`}
            >
              <item.icon className={`w-3 h-3 ${item.color}`} />
              {item.label}
            </div>
          ))}
          {showThemeToggle && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? "Switch to light appearance" : "Switch to dark appearance"}
              title={isDark ? "Light appearance" : "Dark appearance"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium border transition-colors ${
                isDark
                  ? "bg-white/[0.03] border-white/[0.06] text-[#E5E7EB] hover:bg-white/[0.08]"
                  : "bg-white border-[#D1D5DB] text-[#1F2937] hover:bg-[#E5E7EB]"
              }`}
            >
              {isDark ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-teal-700" />}
              {isDark ? "Light" : "Dark"}
            </button>
          )}
          {showCta && (
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                isDark
                  ? "border-env-teal/40 bg-env-teal/10 text-teal-200 hover:bg-env-teal/20"
                  : "border-teal-400 bg-teal-50 text-teal-800 hover:bg-teal-100"
              }`}
            >
              Open full dashboard
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

/** Data provenance line. Keeps sourcing visible without the app footer. */
function EmbedFooter({ isDark }: { isDark: boolean }) {
  return (
    <footer
      className={`flex flex-col gap-1 rounded-lg border px-3 py-2 text-[11px] sm:flex-row sm:items-center sm:justify-between ${
        isDark
          ? "border-white/[0.06] bg-white/[0.02] text-[#D1D5DB]"
          : "border-[#D1D5DB] bg-white text-[#374151]"
      }`}
    >
      <span>Live data from USGS NWIS, EPA Water Quality Portal and DOEE. Updated daily.</span>
      <span className={isDark ? "text-[#9CA3AF]" : "text-[#6B7280]"}>
        UDC CAUSES &middot; Water Resources Research Institute
      </span>
    </footer>
  );
}

function EmbedSection({
  isDark,
  title,
  description,
  children,
}: {
  isDark: boolean;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>
          {title}
        </h2>
        <p className={`text-xs max-w-3xl ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
