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
    <div className="w-full h-[500px] rounded-xl glass-panel flex items-center justify-center">
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
      <main className="flex-1 ml-[240px]">
        <Header />
        <div className="p-6 space-y-6">
          {/* Hero Section */}
          <section className={`relative overflow-hidden rounded-2xl border p-8 ${
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
              <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                DC Water Resources{" "}
                <span className="gradient-text">Data Dashboard</span>
              </h1>
              <p className={`text-sm max-w-2xl mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Real-time monitoring, analysis, and visualization of water quality data across the
                Anacostia River watershed. Integrating research from UDC&apos;s Water Resources
                Research Institute with environmental data for DC communities.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Droplets, label: "12 Active Sensors", color: "text-blue-400" },
                  { icon: MapPin, label: "Anacostia Watershed", color: "text-green-400" },
                  { icon: TrendingUp, label: "Real-Time Data", color: "text-cyan-400" },
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

          {/* Metric Cards */}
          <section>
            <MetricCards />
          </section>

          {/* Interactive Map */}
          <section id="map">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Interactive Watershed Map</h2>
                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                  Anacostia River, tributaries, monitoring stations — toggle layers with the control panel
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Live monitoring data</span>
              </div>
            </div>
            <div className="h-[550px]">
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
            <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Water Quality Analysis</h2>
            <p className={`text-xs mb-4 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              Historical trends and current conditions across monitoring parameters
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DOTrendChart />
              <TemperatureTrendChart />
              <EColiChart />
              <StormwaterChart />
            </div>
          </section>

          {/* Multi-parameter overview */}
          <section id="analytics">
            <MultiParameterChart />
          </section>

          {/* Environmental Justice */}
          <section>
            <EnvironmentalJustice />
          </section>

          {/* Station Table */}
          <section id="stormwater">
            <StationTable onStationClick={handleStationNavigate} />
          </section>

          {/* Footer */}
          <footer className={`border-t pt-6 pb-4 ${isDark ? "border-panel-border" : "border-slate-200"}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-[10px]">
                  UDC
                </div>
                <div>
                  <p className={`text-xs font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                    University of the District of Columbia
                  </p>
                  <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                    College of Agriculture, Urban Sustainability & Environmental Sciences (CAUSES)
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                  Water Resources Research Institute (WRRI) | Center for Urban Resilience,
                  Innovation and Infrastructure (CURII)
                </p>
                <p className={`text-[10px] mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                  Funded by DC Government | Data sources: DOEE, EPA, USGS, Anacostia Riverkeeper
                </p>
              </div>
              <div className="text-right">
                <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>4200 Connecticut Ave NW</p>
                <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>Washington, DC 20008</p>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
