"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Droplets, Thermometer, Activity, Waves, MapPin,
  CheckCircle2, AlertCircle, Wrench, TrendingUp, TrendingDown,
  ArrowUpRight, ExternalLink, Zap, Shield, Clock,
  BarChart3, FlaskConical, BookOpen,
} from "lucide-react";

/**
 * Design Demo Page — showcases the proposed new visual system.
 * Compare this at /demo against the current dashboard at /
 *
 * Design principles:
 * - Warm dark background (#0C0F17) instead of cold navy
 * - High-contrast text: white/near-white on dark, not muted grays
 * - Cards with subtle glass + shadow depth, not flat borders
 * - Vibrant accents: water-blue, teal, gold — never dull gray
 * - Clean typography with clear hierarchy
 */

// ── Theme hook for this demo ──
function useDemo() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return {
    dark,
    // Page background
    pageBg: dark ? "bg-[#0C0F17]" : "bg-[#F8FAFB]",
    // Card surfaces
    card: dark
      ? "bg-[#13161F]/90 border border-white/[0.06] shadow-lg shadow-black/20"
      : "bg-white border border-[#E5E7EB] shadow-sm shadow-black/[0.03]",
    cardHover: dark
      ? "hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/30"
      : "hover:shadow-md hover:border-[#D1D5DB]",
    // Text
    h1: dark ? "text-white" : "text-[#111827]",
    h2: dark ? "text-white" : "text-[#1F2937]",
    h3: dark ? "text-[#F3F4F6]" : "text-[#1F2937]",
    body: dark ? "text-[#D1D5DB]" : "text-[#4B5563]",
    muted: dark ? "text-[#6B7280]" : "text-[#9CA3AF]",
    label: dark ? "text-[#9CA3AF]" : "text-[#6B7280]",
    // Borders & dividers
    border: dark ? "border-white/[0.06]" : "border-[#E5E7EB]",
    divider: dark ? "divide-white/[0.06]" : "divide-[#F3F4F6]",
    // Inputs
    input: dark
      ? "bg-[#0C0F17] border-white/[0.08] text-white placeholder:text-[#4B5563] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
      : "bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] placeholder:text-[#9CA3AF] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
    // Hero gradient
    heroBg: dark
      ? "bg-gradient-to-br from-[#13161F] via-[#0C0F17] to-[#0C0F17] border-white/[0.06]"
      : "bg-gradient-to-br from-white via-blue-50/30 to-[#F8FAFB] border-[#E5E7EB]",
    // Accent backgrounds
    accentBlueBg: dark ? "bg-blue-500/10" : "bg-blue-50",
    accentTealBg: dark ? "bg-teal-500/10" : "bg-teal-50",
    accentAmberBg: dark ? "bg-amber-500/10" : "bg-amber-50",
    accentRedBg: dark ? "bg-red-500/10" : "bg-red-50",
    accentGreenBg: dark ? "bg-emerald-500/10" : "bg-emerald-50",
    // Status colors (always vibrant)
    statusActive: "text-emerald-400",
    statusOffline: "text-red-400",
    statusMaint: "text-amber-400",
    // Table
    tableHeaderBg: dark ? "bg-white/[0.02]" : "bg-[#F9FAFB]",
    tableRowHover: dark ? "hover:bg-white/[0.03]" : "hover:bg-[#F9FAFB]",
  };
}

// ── Sample data ──
const metrics = [
  { label: "Active Stations", value: "8", change: "+2", trend: "up", icon: MapPin, color: "text-blue-400", bg: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  { label: "Avg. DO", value: "10.9", unit: "mg/L", change: "+1.9", trend: "up", icon: Droplets, color: "text-teal-400", bg: "bg-teal-500/10", borderColor: "border-teal-500/20" },
  { label: "Avg. Temp", value: "10.6", unit: "°C", change: "-2.1", trend: "down", icon: Thermometer, color: "text-amber-400", bg: "bg-amber-500/10", borderColor: "border-amber-500/20" },
  { label: "USGS Readings", value: "12,569", change: "Today", trend: "up", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
];

const stations = [
  { id: "ANA-002", name: "Anacostia at Kenilworth", type: "River", status: "active", temp: 11.0, do: 10.5, ph: 7.5, turb: null, cond: 533, source: "USGS", updated: "35m ago" },
  { id: "ANA-003", name: "Anacostia at Navy Yard", type: "River", status: "active", temp: 12.8, do: null, ph: null, turb: 12.8, cond: 361, source: "USGS", updated: "35m ago" },
  { id: "WB-001", name: "Watts Branch at Minnesota Ave", type: "Stream", status: "active", temp: 10.7, do: null, ph: null, turb: null, cond: 712, source: "USGS", updated: "38m ago" },
  { id: "HR-001", name: "Hickey Run at Arboretum", type: "Stream", status: "active", temp: 12.1, do: null, ph: null, turb: null, cond: 820, source: "USGS", updated: "38m ago" },
  { id: "ANA-001", name: "Anacostia at Bladensburg", type: "River", status: "offline", temp: null, do: null, ph: null, turb: null, cond: null, source: "—", updated: "Offline" },
  { id: "PB-001", name: "Pope Branch at Fort Stanton", type: "Stream", status: "offline", temp: null, do: null, ph: null, turb: null, cond: null, source: "—", updated: "Offline" },
];

function StatusBadge({ status, dark }: { status: string; dark: boolean }) {
  const config = {
    active: { color: "text-emerald-400", bg: dark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200", icon: CheckCircle2, label: "Active" },
    maintenance: { color: "text-amber-400", bg: dark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200", icon: Wrench, label: "Maintenance" },
    offline: { color: "text-red-400", bg: dark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200", icon: AlertCircle, label: "Offline" },
  }[status] || { color: "text-red-400", bg: "", icon: AlertCircle, label: status };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.bg} ${config.color}`}>
      <Icon className="w-3 h-3" /> {config.label}
    </span>
  );
}

function SourceBadge({ source, dark }: { source: string; dark: boolean }) {
  if (source === "—") return <span className="text-[10px] text-[#6B7280]">—</span>;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
      dark ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-600 border border-blue-200"
    }`}>
      {source}
    </span>
  );
}

// ── Demo Page ──
export default function DesignDemo() {
  const t = useDemo();
  const [activeTab, setActiveTab] = useState<"overview" | "details">("overview");

  return (
    <div className={`min-h-screen ${t.pageBg} transition-colors duration-300`}>
      {/* Simple top bar for demo */}
      <div className={`sticky top-0 z-40 backdrop-blur-xl border-b ${t.border} ${t.dark ? "bg-[#0C0F17]/80" : "bg-white/80"}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FDB927] to-[#CE1141] flex items-center justify-center font-extrabold text-white text-[10px] shadow-lg shadow-[#FDB927]/20">
              UDC
            </div>
            <span className={`font-semibold text-sm ${t.h2}`}>Design System Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full border ${t.border} ${t.muted}`}>
              Compare with <a href="/" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">current dashboard</a>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* ── HERO SECTION ── */}
        <section className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 ${t.heroBg}`}>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FDB927] to-[#CE1141] flex items-center justify-center font-extrabold text-white text-[10px]">
                UDC
              </div>
              <span className="text-xs font-semibold text-[#FDB927] uppercase tracking-wider">
                CAUSES / WRRI Dashboard
              </span>
            </div>
            <h1 className={`text-2xl md:text-3xl font-bold mb-2 tracking-tight ${t.h1}`}>
              Water Resources{" "}
              <span className="bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Data Dashboard
              </span>
            </h1>
            <p className={`text-sm max-w-2xl leading-relaxed ${t.body}`}>
              Real-time monitoring, analysis, and visualization of water quality data across the Anacostia River watershed.
              Integrating research from UDC&apos;s Water Resources Research Institute.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { icon: Droplets, label: "12 Stations", color: "text-blue-400" },
                { icon: MapPin, label: "Anacostia Watershed", color: "text-emerald-400" },
                { icon: Zap, label: "Live USGS Data", color: "text-teal-400" },
                { icon: Shield, label: "EPA Standards", color: "text-amber-400" },
              ].map((item) => (
                <span
                  key={item.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                    t.dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-[#E5E7EB]"
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span className={t.dark ? "text-[#D1D5DB]" : "text-[#4B5563]"}>{item.label}</span>
                </span>
              ))}
            </div>
          </div>
          {/* Subtle decorative gradient orb */}
          {t.dark && (
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none" />
          )}
        </section>

        {/* ── METRIC CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={`rounded-2xl p-4 transition-all duration-200 ${t.card} ${t.cardHover} cursor-default`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${m.bg}`}>
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${
                  m.trend === "up" ? "text-emerald-400" : "text-amber-400"
                }`}>
                  {m.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {m.change}
                </span>
              </div>
              <div className={`text-2xl font-bold tracking-tight ${t.h1}`}>
                {m.value}
                {m.unit && <span className={`text-sm font-normal ml-1 ${t.muted}`}>{m.unit}</span>}
              </div>
              <div className={`text-xs mt-1 ${t.label}`}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* ── TAB NAVIGATION ── */}
        <div className={`flex gap-1 p-1 rounded-xl ${t.dark ? "bg-white/[0.03]" : "bg-[#F3F4F6]"}`}>
          {(["overview", "details"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? t.dark
                    ? "bg-white/[0.08] text-white shadow-sm"
                    : "bg-white text-[#111827] shadow-sm"
                  : t.dark
                    ? "text-[#9CA3AF] hover:text-white"
                    : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {tab === "overview" ? "Overview" : "Station Details"}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <>
            {/* ── CHART CARDS (placeholder) ── */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className={`rounded-2xl p-5 ${t.card}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-sm font-semibold ${t.h3}`}>Dissolved Oxygen Trends</h3>
                    <p className={`text-xs mt-0.5 ${t.label}`}>Monthly average (mg/L)</p>
                  </div>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    2,402 readings
                  </span>
                </div>
                {/* Simulated chart area */}
                <div className={`h-44 rounded-xl flex items-end gap-1 px-2 pb-2 ${t.dark ? "bg-white/[0.02]" : "bg-[#F9FAFB]"}`}>
                  {[65, 60, 55, 48, 40, 32, 28, 30, 38, 50, 58, 72].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-blue-500/60 to-blue-400/80 transition-all hover:from-blue-500/80 hover:to-blue-400"
                        style={{ height: `${h}%` }}
                      />
                      <span className={`text-[8px] ${t.muted}`}>
                        {["J","F","M","A","M","J","J","A","S","O","N","D"][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-blue-400 rounded" />
                    <span className={`text-[10px] ${t.label}`}>DO Level</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-red-400 rounded border-dashed" style={{ borderBottom: "1px dashed" }} />
                    <span className={`text-[10px] ${t.label}`}>EPA Min (5 mg/L)</span>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-5 ${t.card}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-sm font-semibold ${t.h3}`}>Water Temperature</h3>
                    <p className={`text-xs mt-0.5 ${t.label}`}>Monthly average (°C)</p>
                  </div>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    12,569 readings
                  </span>
                </div>
                <div className={`h-44 rounded-xl flex items-end gap-1 px-2 pb-2 ${t.dark ? "bg-white/[0.02]" : "bg-[#F9FAFB]"}`}>
                  {[15, 18, 35, 52, 68, 82, 90, 88, 75, 55, 35, 20].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-teal-500/60 to-cyan-400/80 transition-all hover:from-teal-500/80 hover:to-cyan-400"
                        style={{ height: `${h}%` }}
                      />
                      <span className={`text-[8px] ${t.muted}`}>
                        {["J","F","M","A","M","J","J","A","S","O","N","D"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── QUICK ACTIONS ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: BarChart3, label: "Analytics", desc: "View trends", color: "text-blue-400", bg: "bg-blue-500/10" },
                { icon: FlaskConical, label: "Research", desc: "WRRI projects", color: "text-purple-400", bg: "bg-purple-500/10" },
                { icon: BookOpen, label: "Stories", desc: "Data narratives", color: "text-teal-400", bg: "bg-teal-500/10" },
                { icon: Shield, label: "EPA Alerts", desc: "3 violations", color: "text-red-400", bg: "bg-red-500/10" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl p-4 flex items-center gap-3 transition-all duration-200 cursor-pointer ${t.card} ${t.cardHover}`}
                >
                  <div className={`p-2.5 rounded-xl ${item.bg}`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${t.h3}`}>{item.label}</div>
                    <div className={`text-xs ${t.label}`}>{item.desc}</div>
                  </div>
                  <ArrowUpRight className={`w-4 h-4 ml-auto ${t.muted}`} />
                </div>
              ))}
            </div>
          </>
        ) : null}

        {/* ── STATION TABLE ── */}
        <div className={`rounded-2xl overflow-hidden ${t.card}`}>
          <div className={`px-5 py-4 border-b ${t.border}`}>
            <h3 className={`text-sm font-semibold ${t.h3}`}>Monitoring Stations</h3>
            <p className={`text-xs mt-0.5 ${t.label}`}>Real-time status across the Anacostia watershed</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${t.border} ${t.tableHeaderBg}`}>
                  {["Station", "Type", "Status", "Temp °C", "DO mg/L", "pH", "Turbidity", "Conductivity", "Updated"].map((col) => (
                    <th key={col} className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${t.label}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={t.divider}>
                {stations.map((s) => (
                  <tr key={s.id} className={`border-b ${t.border} ${t.tableRowHover} transition-colors cursor-pointer`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <div>
                          <div className={`text-xs font-semibold ${t.h3}`}>{s.name}</div>
                          <div className={`text-[10px] ${t.muted}`}>{s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-xs ${t.body}`}>{s.type}</td>
                    <td className="py-3 px-4"><StatusBadge status={s.status} dark={t.dark} /></td>
                    <td className={`py-3 px-4 text-xs font-mono ${s.temp != null ? t.h3 : t.muted}`}>{s.temp ?? "—"}</td>
                    <td className={`py-3 px-4 text-xs font-mono ${s.do != null ? (s.do < 5 ? "text-red-400 font-semibold" : "text-emerald-400") : t.muted}`}>{s.do ?? "—"}</td>
                    <td className={`py-3 px-4 text-xs font-mono ${s.ph != null ? t.h3 : t.muted}`}>{s.ph ?? "—"}</td>
                    <td className={`py-3 px-4 text-xs font-mono ${s.turb != null ? t.h3 : t.muted}`}>{s.turb ?? "—"}</td>
                    <td className={`py-3 px-4 text-xs font-mono ${s.cond != null ? t.h3 : t.muted}`}>{s.cond ?? "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-3 h-3 ${s.status === "active" ? "text-emerald-400" : "text-red-400"}`} />
                        <span className={`text-[10px] font-medium ${s.status === "active" ? "text-emerald-400" : "text-red-400"}`}>
                          {s.updated}
                        </span>
                        <SourceBadge source={s.source} dark={t.dark} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── TYPOGRAPHY & COLOR REFERENCE ── */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`rounded-2xl p-5 ${t.card}`}>
            <h3 className={`text-sm font-semibold mb-4 ${t.h3}`}>Typography Scale</h3>
            <div className="space-y-3">
              <div><span className={`text-2xl font-bold tracking-tight ${t.h1}`}>Heading 1</span> <span className={`text-xs ${t.muted}`}>2xl bold</span></div>
              <div><span className={`text-lg font-semibold ${t.h2}`}>Heading 2</span> <span className={`text-xs ${t.muted}`}>lg semibold</span></div>
              <div><span className={`text-sm font-semibold ${t.h3}`}>Heading 3</span> <span className={`text-xs ${t.muted}`}>sm semibold</span></div>
              <div><span className={`text-sm ${t.body}`}>Body text — clear and readable with good contrast</span></div>
              <div><span className={`text-xs ${t.label}`}>Label text — secondary information and metadata</span></div>
              <div><span className={`text-xs ${t.muted}`}>Muted text — timestamps, hints, very low priority</span></div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${t.card}`}>
            <h3 className={`text-sm font-semibold mb-4 ${t.h3}`}>Accent Colors</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "Water Blue", color: "bg-blue-500", text: "#3B82F6" },
                { name: "Teal / Data", color: "bg-teal-400", text: "#2DD4BF" },
                { name: "Emerald / Good", color: "bg-emerald-500", text: "#22C55E" },
                { name: "Amber / Warning", color: "bg-amber-500", text: "#F59E0B" },
                { name: "Red / Danger", color: "bg-red-500", text: "#EF4444" },
                { name: "UDC Gold", color: "bg-[#FDB927]", text: "#FDB927" },
                { name: "Purple / Research", color: "bg-purple-500", text: "#A855F7" },
                { name: "UDC Red", color: "bg-[#CE1141]", text: "#CE1141" },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg ${c.color}`} />
                  <div>
                    <div className={`text-xs font-medium ${t.h3}`}>{c.name}</div>
                    <div className={`text-[10px] font-mono ${t.muted}`}>{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FORM ELEMENTS ── */}
        <div className={`rounded-2xl p-5 ${t.card}`}>
          <h3 className={`text-sm font-semibold mb-4 ${t.h3}`}>Form Elements</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={`text-xs font-medium mb-1.5 block ${t.label}`}>Search Input</label>
              <input
                type="text"
                placeholder="Search stations..."
                className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all ${t.input}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium mb-1.5 block ${t.label}`}>Primary Button</label>
              <button className="w-full px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
                Export Data
              </button>
            </div>
            <div>
              <label className={`text-xs font-medium mb-1.5 block ${t.label}`}>Secondary Button</label>
              <button className={`w-full px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                t.dark
                  ? "border-white/[0.1] text-[#D1D5DB] hover:bg-white/[0.04] hover:border-white/[0.15]"
                  : "border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]"
              }`}>
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className={`text-center text-xs py-6 ${t.muted}`}>
          This is a design preview page. Toggle dark/light mode via Settings to compare both themes.
        </p>
      </div>
    </div>
  );
}
