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
} from "@/components/charts/WaterQualityCharts";
import TimeSlider, { type MonthlySnapshot } from "@/components/map/TimeSlider";
import { Droplets, MapPin, TrendingUp, Shield } from "lucide-react";
import { useState, useCallback } from "react";
import type { MonitoringStation } from "@/data/dc-waterways";
import { useTheme } from "@/context/ThemeContext";

const DCMap = dynamic(() => import("@/components/map/DCMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-xl glass-panel flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-water-blue border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading DC Map...</span>
      </div>
    </div>
  ),
});

export default function Dashboard() {
  const [selectedStation, setSelectedStation] = useState<MonitoringStation | null>(null);
  const [monthSnapshot, setMonthSnapshot] = useState<MonthlySnapshot | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const router = useRouter();

  const handleStationNavigate = useCallback((stationId: string) => {
    router.push(`/station/${stationId}`);
  }, [router]);

  const handleMonthChange = useCallback((snapshot: MonthlySnapshot) => {
    setMonthSnapshot(snapshot);
  }, []);

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? "bg-udc-dark" : "bg-slate-50"}`}>
      <Sidebar />
      <main id="main-content" className="flex-1 lg:ml-[240px] min-w-0 overflow-x-hidden">
        <Header />
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* Hero Section */}
          <section className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-4 sm:p-6 md:p-8 ${
            isDark
              ? "border-panel-border bg-gradient-to-br from-udc-navy via-panel-bg to-udc-dark"
              : "border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50"
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
                  CAUSES / WRRI
                </span>
              </div>
              <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                DC Water Resources{" "}
                <span className="gradient-text">Data Dashboard</span>
              </h1>
              <p className={`text-sm max-w-2xl mb-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Monitoring, analysis, and visualization of water quality data across the
                Anacostia River watershed. Integrating research from UDC&apos;s Water Resources
                Research Institute with environmental data for DC communities.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Droplets, label: "12 Monitoring Stations", color: "text-blue-400" },
                  { icon: MapPin, label: "Anacostia Watershed", color: "text-green-400" },
                  { icon: TrendingUp, label: "USGS Data Integration", color: "text-cyan-400" },
                  { icon: Shield, label: "EPA Standards Tracking", color: "text-amber-400" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border ${
                      isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-slate-200"
                    }`}
                  >
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span className={isDark ? "text-slate-300" : "text-slate-600"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Data Source Notice */}
          <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-xs ${
            isDark
              ? "border-blue-500/30 bg-blue-950/30 text-blue-300"
              : "border-blue-200 bg-blue-50 text-blue-800"
          }`}>
            <Shield className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Data Sources:</span>{" "}
              Station locations derived from DC GIS and USGS monitoring sites.
              Water quality baselines use USGS NWIS instantaneous values (sites 01651000, 01651750)
              and modeled seasonal patterns from peer-reviewed Anacostia watershed research.
              Geospatial boundaries from official DC government GIS datasets.
              This dashboard is a research and educational tool developed by UDC CAUSES/WRRI.
            </div>
          </div>

          {/* Metric Cards */}
          <section>
            <MetricCards />
          </section>

          {/* Interactive Map */}
          <section id="map">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Interactive Watershed Map</h2>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Anacostia River, tributaries, monitoring stations — toggle layers with the control panel
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-500"}`}>USGS &amp; DOEE monitoring network</span>
              </div>
            </div>
            <div className="h-[300px] sm:h-[400px] md:h-[550px]">
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
          <section id="water-quality">
            <div className="mb-4">
              <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Water Quality Analysis</h2>
              <p className={`text-xs max-w-3xl ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                Historical trends and current conditions across four key monitoring parameters.
                Dissolved oxygen and E. coli levels are compared against EPA recreational water quality
                standards. Data is sourced from USGS NWIS sensors and the EPA Water Quality Portal for the
                Anacostia watershed (HUC 02070010).
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DOTrendChart />
              <TemperatureTrendChart />
              <EColiChart />
              <StormwaterChart />
            </div>
          </section>

          {/* Multi-parameter overview */}
          <section id="analytics">
            <div className="mb-3">
              <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Multi-Parameter Overview</h2>
              <p className={`text-xs max-w-3xl ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                Correlate dissolved oxygen, temperature, pH, and turbidity on a unified timeline.
                Parameter relationships reveal how seasonal changes and storm events affect overall
                water health — for example, elevated turbidity after rainfall often coincides with
                depressed dissolved oxygen levels.
              </p>
            </div>
            <MultiParameterChart />
          </section>

          {/* Environmental Justice */}
          <section>
            <div className="mb-3">
              <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Environmental Justice</h2>
              <p className={`text-xs max-w-3xl ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                Water quality issues disproportionately affect communities in DC&apos;s eastern wards.
                Combined sewer overflows (CSOs), impervious surface coverage, and limited green space access
                are interconnected factors that UDC&apos;s WRRI tracks across all eight wards to support
                equitable environmental policy and community-led restoration.
              </p>
            </div>
            <EnvironmentalJustice />
          </section>

          {/* Station Table */}
          <section id="stormwater">
            <div className="mb-3">
              <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Monitoring Stations</h2>
              <p className={`text-xs max-w-3xl ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                All 12 stations across the Anacostia, Potomac, and Rock Creek watersheds. Click any row
                to view detailed readings, historical charts, and data export options for that station.
                Data provenance badges indicate whether readings come from USGS sensors, EPA WQP records,
                or the seed dataset.
              </p>
            </div>
            <StationTable onStationClick={handleStationNavigate} />
          </section>

          {/* Footer */}
          <footer className={`border-t pt-6 pb-6 ${isDark ? "border-panel-border" : "border-slate-200"}`}>
            <div className="flex flex-col items-center gap-4 text-center">
              {/* Logo + University name */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-[10px] flex-shrink-0">
                  UDC
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                    University of the District of Columbia
                  </p>
                  <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                    CAUSES / WRRI
                  </p>
                </div>
              </div>

              {/* Institute info */}
              <div className="space-y-1 max-w-md">
                <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                  Water Resources Research Institute (WRRI)
                </p>
                <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                  Center for Urban Resilience, Innovation &amp; Infrastructure (CURII)
                </p>
                <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  4200 Connecticut Ave NW, Washington, DC 20008
                </p>
              </div>

              {/* Data links */}
              <div className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                <a href="/api/export?format=csv" className="underline hover:text-udc-gold transition-colors">Export CSV</a>
                <span aria-hidden="true">·</span>
                <a href="/api/export?format=json" className="underline hover:text-udc-gold transition-colors">Export JSON</a>
                <span aria-hidden="true">·</span>
                <a href="/methodology" className="underline hover:text-udc-gold transition-colors">Methodology</a>
              </div>

              {/* Funding attribution */}
              <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Funded by DC Government · Data: DOEE, EPA WQP, USGS NWIS, Anacostia Riverkeeper
              </p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
