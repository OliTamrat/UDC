"use client";

import dynamic from "next/dynamic";
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
import { Droplets, MapPin, TrendingUp, Shield } from "lucide-react";
import { useState } from "react";
import type { MonitoringStation } from "@/data/dc-waterways";

const DCMap = dynamic(() => import("@/components/map/DCMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-xl bg-panel-bg border border-panel-border flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-water-blue border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading DC Map...</span>
      </div>
    </div>
  ),
});

export default function Dashboard() {
  const [selectedStation, setSelectedStation] = useState<MonitoringStation | null>(null);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[240px]">
        <Header />
        <div className="p-6 space-y-6">
          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-2xl border border-panel-border bg-gradient-to-br from-udc-navy via-panel-bg to-udc-dark p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-cyan-600/5" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-[10px]">
                  UDC
                </div>
                <span className="text-xs font-medium text-udc-gold uppercase tracking-wider">
                  CAUSES / WRRI
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                DC Water Resources{" "}
                <span className="gradient-text">Data Dashboard</span>
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl mb-4">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs"
                  >
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span className="text-slate-300">{item.label}</span>
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
                <h2 className="text-lg font-semibold text-white">Interactive Watershed Map</h2>
                <p className="text-xs text-slate-500">
                  Anacostia River, tributaries, and monitoring stations across DC
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-slate-400">Live monitoring data</span>
              </div>
            </div>
            <div className="h-[550px]">
              <DCMap
                onStationSelect={setSelectedStation}
                selectedStation={selectedStation}
              />
            </div>
          </section>

          {/* Water Quality Section */}
          <section id="water-quality">
            <h2 className="text-lg font-semibold text-white mb-1">Water Quality Analysis</h2>
            <p className="text-xs text-slate-500 mb-4">
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
            <StationTable />
          </section>

          {/* Footer */}
          <footer className="border-t border-panel-border pt-6 pb-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-[10px]">
                  UDC
                </div>
                <div>
                  <p className="text-xs font-medium text-white">
                    University of the District of Columbia
                  </p>
                  <p className="text-[10px] text-slate-500">
                    College of Agriculture, Urban Sustainability & Environmental Sciences (CAUSES)
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500">
                  Water Resources Research Institute (WRRI) | Center for Urban Resilience,
                  Innovation and Infrastructure (CURII)
                </p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Funded by DC Government | Data sources: DOEE, EPA, USGS, Anacostia Riverkeeper
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500">4200 Connecticut Ave NW</p>
                <p className="text-[10px] text-slate-500">Washington, DC 20008</p>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
