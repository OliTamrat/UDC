"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useTheme } from "@/context/ThemeContext";
import {
  BookOpen,
  Database,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  Beaker,
  Scale,
} from "lucide-react";
import { useSidebarClass } from "@/hooks/useSidebarMargin";

// ---------------------------------------------------------------------------
// Data Dictionary — every parameter we collect
// ---------------------------------------------------------------------------
const DATA_DICTIONARY = [
  {
    parameter: "Water Temperature",
    field: "temperature",
    unit: "°C",
    method: "Thermistor probe (YSI 6600)",
    range: "-5 to 45",
    epaStandard: "Varies by water body class; generally ≤32°C for warm-water aquatic life",
    detectionLimit: "0.01°C",
    description: "Temperature of water at sampling depth. Affects dissolved oxygen capacity, metabolic rates, and aquatic organism survival.",
  },
  {
    parameter: "Dissolved Oxygen",
    field: "dissolved_oxygen",
    unit: "mg/L",
    method: "Optical DO sensor (luminescent)",
    range: "0 to 20",
    epaStandard: "≥5.0 mg/L for aquatic life support (CWA §304(a))",
    detectionLimit: "0.1 mg/L",
    description: "Concentration of molecular oxygen dissolved in water. Critical for fish and macroinvertebrate survival. Levels below 5 mg/L indicate stress; below 2 mg/L is hypoxic.",
  },
  {
    parameter: "pH",
    field: "ph",
    unit: "Standard units",
    method: "Glass electrode potentiometry",
    range: "0 to 14",
    epaStandard: "6.5–9.0 for freshwater aquatic life (EPA Gold Book)",
    detectionLimit: "0.01 SU",
    description: "Measure of hydrogen ion concentration (acidity/alkalinity). Affects nutrient availability, metal toxicity, and biological processes.",
  },
  {
    parameter: "Turbidity",
    field: "turbidity",
    unit: "NTU",
    method: "Nephelometric (90° scattered light)",
    range: "0 to 4,000",
    epaStandard: "Narrative: shall not exceed levels detrimental to aquatic life. DC DOEE: ≤50 NTU typical reference",
    detectionLimit: "0.1 NTU",
    description: "Measure of water clarity caused by suspended particles. High turbidity reduces light penetration, affecting photosynthesis and can indicate erosion or pollution.",
  },
  {
    parameter: "Specific Conductance",
    field: "conductivity",
    unit: "µS/cm",
    method: "4-electrode conductivity cell, temperature-compensated to 25°C",
    range: "0 to 10,000",
    epaStandard: "No federal numeric standard; DC reference: 150–500 µS/cm typical freshwater",
    detectionLimit: "1 µS/cm",
    description: "Ability of water to conduct electrical current, indicating total dissolved ion concentration. Elevated values may indicate road salt, sewage, or industrial discharge.",
  },
  {
    parameter: "E. coli",
    field: "ecoli_count",
    unit: "CFU/100mL",
    method: "Membrane filtration / Colilert Quanti-Tray (IDEXX)",
    range: "0 to 100,000",
    epaStandard: "≤410 CFU/100mL (single sample recreational contact, EPA 2012 RWQC)",
    detectionLimit: "1 CFU/100mL",
    description: "Fecal indicator bacteria. Indicates potential presence of pathogens from sewage or animal waste. Primary indicator for recreational water safety.",
  },
  {
    parameter: "Nitrate-Nitrogen",
    field: "nitrate_n",
    unit: "mg/L",
    method: "Ion chromatography / cadmium reduction",
    range: "0 to 100",
    epaStandard: "10 mg/L (drinking water MCL, EPA 40 CFR 141)",
    detectionLimit: "0.01 mg/L",
    description: "Inorganic nitrogen form readily used by algae and plants. Excess leads to eutrophication, algal blooms, and oxygen depletion.",
  },
  {
    parameter: "Total Phosphorus",
    field: "phosphorus",
    unit: "mg/L",
    method: "Ascorbic acid colorimetry (SM 4500-P E)",
    range: "0 to 50",
    epaStandard: "0.1 mg/L (EPA recommended for streams; Anacostia TMDL target)",
    detectionLimit: "0.005 mg/L",
    description: "Limiting nutrient for freshwater algal growth. Major contributor to eutrophication in the Anacostia. Sources include fertilizer runoff, wastewater, and erosion.",
  },
];

// ---------------------------------------------------------------------------
// Ingestion history types
// ---------------------------------------------------------------------------
interface IngestionLogEntry {
  id: number;
  source: string;
  status: string;
  records_count: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export default function MethodologyPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const sidebarClass = useSidebarClass();
  const [logs, setLogs] = useState<IngestionLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/ingestion-log?limit=20");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // silent — logs are supplementary
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? "bg-udc-dark" : "bg-[#F9FAFB]"}`}>
      <Sidebar />
      <main id="main-content" className={`flex-1 ${sidebarClass} min-w-0 overflow-x-hidden`}>
        <Header />
        <div className="p-3 sm:p-4 md:p-6 space-y-8">
          {/* Page Header */}
          <section
            className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-4 sm:p-6 md:p-8 ${
              isDark
                ? "border-panel-border bg-gradient-to-br from-blue-900/10 via-[#0C0F17] to-[#0C0F17]"
                : "border-[#E5E7EB] bg-gradient-to-br from-white via-blue-50/30 to-[#F9FAFB]"
            }`}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                  Methodology & Data Documentation
                </span>
              </div>
              <h1 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-[#111827]"}`}>
                Data Methodology & Quality Assurance
              </h1>
              <p className={`text-sm max-w-2xl ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>
                Complete documentation of sampling protocols, quality assurance procedures, parameter
                definitions, and data provenance. This page enables researchers to verify, cite, and
                reproduce analyses using UDC WRRI water quality data.
              </p>
            </div>
          </section>

          {/* Quick Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Data Dictionary", icon: Database, href: "#data-dictionary", color: "text-blue-400", bg: "bg-blue-500/10" },
              { label: "Sampling Protocols", icon: Beaker, href: "#sampling", color: "text-green-400", bg: "bg-green-500/10" },
              { label: "QA/QC Procedures", icon: Shield, href: "#qaqc", color: "text-purple-400", bg: "bg-purple-500/10" },
              { label: "Ingestion History", icon: Clock, href: "#history", color: "text-amber-400", bg: "bg-amber-500/10" },
            ].map((nav) => (
              <a
                key={nav.label}
                href={nav.href}
                className={`glass-panel rounded-xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02] ${
                  isDark ? "hover:border-white/[0.06]" : "hover:border-[#E5E7EB]"
                }`}
              >
                <div className={`p-2 rounded-lg ${nav.bg}`}>
                  <nav.icon className={`w-4 h-4 ${nav.color}`} />
                </div>
                <span className={`text-sm font-medium ${isDark ? "text-white" : "text-[#111827]"}`}>{nav.label}</span>
              </a>
            ))}
          </div>

          {/* Data Sources */}
          <section>
            <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>Data Sources & Provenance</h2>
            <p className={`text-xs mb-4 ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>
              Every reading in the database is tagged with its source for full traceability
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  source: "USGS NWIS",
                  badge: "usgs",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10 border-blue-500/20",
                  description: "Real-time and daily values from USGS National Water Information System. Instantaneous values via the NWIS IV Web Service.",
                  sites: "01651000, 01649500, 01646500",
                  frequency: "Daily automated ingestion (06:00 UTC)",
                  url: "https://waterservices.usgs.gov",
                },
                {
                  source: "EPA WQX",
                  badge: "epa",
                  color: "text-green-400",
                  bg: "bg-green-500/10 border-green-500/20",
                  description: "Historical water quality data from EPA's Water Quality Exchange portal. Provides longitudinal data back to 2020.",
                  sites: "Anacostia watershed (HUC 02070010)",
                  frequency: "On-demand ingestion",
                  url: "https://www.waterqualitydata.us",
                },
                {
                  source: "Baseline / Modeled",
                  badge: "seed",
                  color: "text-[#9CA3AF]",
                  bg: "bg-slate-500/10 border-slate-500/20",
                  description: "Initial dataset derived from published averages and modeled values for station commissioning. Being progressively replaced by measured data.",
                  sites: "All 12 stations",
                  frequency: "One-time seed data",
                  url: "",
                },
                {
                  source: "Manual Entry",
                  badge: "manual",
                  color: "text-amber-400",
                  bg: "bg-amber-500/10 border-amber-500/20",
                  description: "Field measurements entered by WRRI researchers and trained student technicians. Includes grab samples and portable meter readings.",
                  sites: "As collected",
                  frequency: "Event-driven",
                  url: "",
                },
              ].map((src) => (
                <div key={src.badge} className={`glass-panel rounded-xl p-4 border ${isDark ? "" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${src.bg} ${src.color}`}>
                      {src.badge.toUpperCase()}
                    </span>
                    <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>{src.source}</span>
                  </div>
                  <p className={`text-xs mb-3 leading-relaxed ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>{src.description}</p>
                  <div className={`space-y-1 text-[10px] ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>
                    <div><span className="font-medium">Sites:</span> {src.sites}</div>
                    <div><span className="font-medium">Frequency:</span> {src.frequency}</div>
                    {src.url && (
                      <div>
                        <span className="font-medium">API: </span>
                        <span className="text-blue-400">{src.url}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Data Dictionary */}
          <section id="data-dictionary">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5 text-blue-400" />
              <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>Data Dictionary</h2>
            </div>
            <p className={`text-xs mb-4 ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>
              Complete definitions for every parameter collected, including measurement methods, valid ranges, and regulatory standards
            </p>
            <div className="space-y-4">
              {DATA_DICTIONARY.map((param) => (
                <div key={param.field} className="glass-panel rounded-xl p-3 sm:p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>{param.parameter}</h3>
                      <code className={`text-[10px] ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>field: {param.field}</code>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600"}`}>
                      {param.unit}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed mb-3 ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>{param.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Method", value: param.method },
                      { label: "Valid Range", value: param.range },
                      { label: "Detection Limit", value: param.detectionLimit },
                      { label: "EPA Standard", value: param.epaStandard },
                    ].map((detail) => (
                      <div key={detail.label}>
                        <div className={`text-[10px] font-medium uppercase ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>{detail.label}</div>
                        <div className={`text-xs mt-0.5 ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>{detail.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sampling Protocols */}
          <section id="sampling">
            <div className="flex items-center gap-2 mb-1">
              <Beaker className="w-5 h-5 text-green-400" />
              <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>Sampling Protocols</h2>
            </div>
            <p className={`text-xs mb-4 ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>
              Standard operating procedures for field data collection
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Continuous Monitoring Stations",
                  icon: Activity,
                  items: [
                    "Multi-parameter sondes (YSI 6600 / EXO2) deployed at fixed stations",
                    "15-minute recording interval for temperature, DO, pH, turbidity, conductivity",
                    "Sensors calibrated monthly using NIST-traceable standards",
                    "Anti-fouling wipers activated before each measurement cycle",
                    "Data transmitted via cellular telemetry to USGS NWIS database",
                    "Backup manual readings during maintenance windows",
                  ],
                },
                {
                  title: "Grab Sampling (E. coli, Nutrients)",
                  icon: Beaker,
                  items: [
                    "Samples collected mid-channel at 0.3m depth (wadeable) or from bridge with weighted sampler",
                    "Sterile 500mL Whirl-Pak bags for bacteriological samples",
                    "Acid-washed HDPE bottles for nutrient analysis (pre-rinsed 3×)",
                    "Samples stored on ice (4°C) and transported to lab within 6 hours",
                    "E. coli processed within 24 hours per EPA Method 1603",
                    "Nutrient samples filtered (0.45µm) and preserved with H₂SO₄ for nitrogen/phosphorus",
                  ],
                },
                {
                  title: "Stormwater BMP Monitoring",
                  icon: Scale,
                  items: [
                    "Paired influent/effluent sampling at green infrastructure installations",
                    "Flow-weighted composite sampling during storm events (ISCO 6712)",
                    "Minimum 3 first-flush events captured per quarter",
                    "Runoff volume measured via calibrated flumes and pressure transducers",
                    "Pre/post performance metrics: pollutant removal efficiency (%)",
                    "Rainfall intensity recorded by co-located tipping bucket gauge",
                  ],
                },
                {
                  title: "Field QC Requirements",
                  icon: Shield,
                  items: [
                    "Field duplicate collected every 10th sample (≥10% frequency)",
                    "Equipment blank run at start of each sampling event",
                    "Trip blank accompanies every cooler of samples",
                    "Field meter calibration documented in log book before each use",
                    "Chain of custody form signed at each transfer point",
                    "GPS coordinates recorded at each sampling location (±3m accuracy)",
                  ],
                },
              ].map((protocol) => (
                <div key={protocol.title} className="glass-panel rounded-xl p-3 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <protocol.icon className={`w-4 h-4 ${isDark ? "text-green-400" : "text-green-600"}`} />
                    <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>{protocol.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {protocol.items.map((item, i) => (
                      <li key={i} className={`flex items-start gap-2 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* QA/QC Procedures */}
          <section id="qaqc">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-purple-400" />
              <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>Quality Assurance / Quality Control</h2>
            </div>
            <p className={`text-xs mb-4 ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>
              Procedures ensuring data reliability and fitness for research use
            </p>
            <div className="glass-panel rounded-xl p-3 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className={`text-sm font-semibold mb-3 ${isDark ? "text-white" : "text-[#111827]"}`}>Automated Validation (Ingest Pipeline)</h3>
                  <ul className="space-y-2">
                    {[
                      "Physical range checks reject impossible values (e.g., pH > 14, negative DO)",
                      "USGS -999999 sentinel values filtered before storage",
                      "Duplicate timestamp detection per station (same source + time = skip)",
                      "Validation warnings logged and returned in API response",
                      "All rejected values recorded with reason for audit trail",
                    ].map((item, i) => (
                      <li key={i} className={`flex items-start gap-2 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className={`text-sm font-semibold mb-3 ${isDark ? "text-white" : "text-[#111827]"}`}>Manual Review Procedures</h3>
                  <ul className="space-y-2">
                    {[
                      "Monthly data review by WRRI research staff",
                      "Time-series plots inspected for sensor drift or fouling artifacts",
                      "Cross-parameter consistency checks (e.g., high temp + low DO = expected)",
                      "Lab duplicate RPD must be ≤25% for acceptance",
                      "Flagged values annotated but retained for transparency (not deleted)",
                    ].map((item, i) => (
                      <li key={i} className={`flex items-start gap-2 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>
                        <FileText className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Validation Ranges Quick Reference */}
          <section>
            <h3 className={`text-sm font-semibold mb-3 ${isDark ? "text-white" : "text-[#111827]"}`}>Validation Ranges (Automated Rejection Thresholds)</h3>
            <div className="glass-panel rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className={`border-b ${isDark ? "border-panel-border bg-white/[0.02]" : "border-[#E5E7EB] bg-[#F9FAFB]"}`}>
                    {["Parameter", "Min", "Max", "Unit", "Action if Out-of-Range"].map((h) => (
                      <th key={h} className={`text-left py-2 px-4 text-xs font-medium uppercase ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DATA_DICTIONARY.map((p) => {
                    const [min, max] = p.range.replace(/,/g, "").split(" to ");
                    return (
                      <tr key={p.field} className={`border-b ${isDark ? "border-panel-border/50" : "border-[#F3F4F6]"}`}>
                        <td className={`py-2 px-4 text-xs ${isDark ? "text-white" : "text-[#111827]"}`}>{p.parameter}</td>
                        <td className={`py-2 px-4 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>{min}</td>
                        <td className={`py-2 px-4 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>{max}</td>
                        <td className={`py-2 px-4 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>{p.unit}</td>
                        <td className={`py-2 px-4 text-xs text-red-400`}>Value set to NULL + warning logged</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Ingestion History */}
          <section id="history">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>Ingestion History</h2>
            </div>
            <p className={`text-xs mb-4 ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>
              Log of all data ingestion events — when data was fetched, how many records were added, and any errors encountered
            </p>
            <div className="glass-panel rounded-xl overflow-x-auto">
              {logsLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-water-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className={`p-8 text-center text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>
                  No ingestion events recorded yet. Run <code className="px-1 py-0.5 rounded bg-slate-800 text-[#E5E7EB]">POST /api/ingest?source=usgs</code> to trigger the first data ingestion.
                </div>
              ) : (
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className={`border-b ${isDark ? "border-panel-border bg-white/[0.02]" : "border-[#E5E7EB] bg-[#F9FAFB]"}`}>
                      {["Date", "Source", "Status", "Records", "Errors"].map((h) => (
                        <th key={h} className={`text-left py-2 px-4 text-xs font-medium uppercase ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className={`border-b ${isDark ? "border-panel-border/50" : "border-[#F3F4F6]"}`}>
                        <td className={`py-2 px-4 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                          {log.completed_at ? new Date(log.completed_at).toLocaleString() : new Date(log.started_at).toLocaleString()}
                        </td>
                        <td className="py-2 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            log.source === "usgs"
                              ? "text-blue-400 bg-blue-500/10 border-blue-500/30"
                              : log.source === "epa"
                              ? "text-green-400 bg-green-500/10 border-green-500/30"
                              : "text-[#9CA3AF] bg-slate-500/10 border-slate-500/30"
                          }`}>
                            {log.source.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs ${
                            log.status === "success" ? "text-green-400" : "text-red-400"
                          }`}>
                            {log.status === "success" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {log.status}
                          </span>
                        </td>
                        <td className={`py-2 px-4 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>
                          {log.records_count.toLocaleString()}
                        </td>
                        <td className={`py-2 px-4 text-xs max-w-xs truncate ${log.error_message ? "text-red-400" : isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                          {log.error_message || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Citation Guide */}
          <section>
            <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>How to Cite This Data</h2>
            <p className={`text-xs mb-4 ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>
              Recommended citations for academic publications and reports
            </p>
            <div className="glass-panel rounded-xl p-3 sm:p-5 space-y-4">
              <div>
                <h3 className={`text-xs font-semibold mb-1 ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>Dataset Citation (APA 7th)</h3>
                <div className={`text-xs p-3 rounded-lg border font-mono leading-relaxed ${
                  isDark ? "bg-[#0C0F17]/50 border-panel-border text-[#9CA3AF]" : "bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563]"
                }`}>
                  UDC Water Resources Research Institute. (2026). <em>Anacostia Watershed Water Quality Monitoring Data</em> [Dataset]. University of the District of Columbia, College of Agriculture, Urban Sustainability and Environmental Sciences (CAUSES). Retrieved from https://udc-water.vercel.app/api/export
                </div>
              </div>
              <div>
                <h3 className={`text-xs font-semibold mb-1 ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>API Endpoint for Programmatic Access</h3>
                <div className={`text-xs p-3 rounded-lg border font-mono ${
                  isDark ? "bg-[#0C0F17]/50 border-panel-border text-[#9CA3AF]" : "bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563]"
                }`}>
                  <div>GET /api/stations — List all monitoring stations with latest readings</div>
                  <div>GET /api/stations/:id/history — Historical readings for a station</div>
                  <div>GET /api/export?format=csv&station=ANA-001 — Export data as CSV or JSON</div>
                  <div>GET /api/ingestion-log — View data ingestion history</div>
                </div>
              </div>
              <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>
                CSV and JSON exports include machine-readable citation metadata. All exports include the <code className="px-1 py-0.5 rounded bg-slate-800 text-[#E5E7EB]">source</code> field for each reading.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
