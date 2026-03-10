"use client";

import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { monitoringStations, getStationHistoricalData } from "@/data/dc-waterways";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  ArrowLeft, MapPin, Activity, Droplets, Thermometer, Waves,
  AlertTriangle, CheckCircle2, Wrench, AlertCircle, Download, Share2,
} from "lucide-react";

function StatusBadge({ status, isDark }: { status: string; isDark: boolean }) {
  const config: Record<string, { bg: string; text: string; icon: typeof CheckCircle2; label: string }> = {
    active: { bg: isDark ? "bg-green-500/10 border-green-500/30" : "bg-green-50 border-green-200", text: "text-green-400", icon: CheckCircle2, label: "Active" },
    maintenance: { bg: isDark ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-200", text: "text-yellow-400", icon: Wrench, label: "Maintenance" },
    offline: { bg: isDark ? "bg-gray-500/10 border-gray-500/30" : "bg-gray-50 border-gray-200", text: "text-gray-400", icon: AlertCircle, label: "Offline" },
  };
  const c = config[status] || config.offline;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.text}`}>
      <Icon className="w-3.5 h-3.5" /> {c.label}
    </span>
  );
}

export default function StationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const stationId = params.id as string;
  const station = monitoringStations.find((s) => s.id === stationId);
  const historical = getStationHistoricalData(stationId);

  if (!station) {
    return (
      <div className={`flex min-h-screen ${isDark ? "bg-udc-dark" : "bg-slate-50"}`}>
        <Sidebar />
        <main className="flex-1 ml-[240px]">
          <Header />
          <div className="p-6 flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Station Not Found</h2>
              <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>No station with ID &quot;{stationId}&quot; exists.</p>
              <button onClick={() => router.push("/")} className="px-4 py-2 bg-water-blue text-white rounded-lg text-sm">
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const reading = station.lastReading;
  const gridColor = isDark ? "#1E3A5F" : "#E2E8F0";
  const tickColor = isDark ? "#64748B" : "#94A3B8";
  const tooltipStyle = {
    backgroundColor: isDark ? "rgba(15, 29, 50, 0.95)" : "rgba(255, 255, 255, 0.98)",
    border: isDark ? "1px solid rgba(30, 58, 95, 0.5)" : "1px solid #E2E8F0",
    borderRadius: "8px", padding: "10px", fontSize: "12px",
    color: isDark ? "#F8FAFC" : "#1E293B",
  };

  const typeLabel = station.type.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const isGI = station.type === "green-infrastructure";

  // EPA thresholds
  const epaLimits = {
    dissolvedOxygen: { min: 5, label: "EPA Minimum (5 mg/L)" },
    eColiCount: { max: 410, label: "EPA Recreational Limit (410 CFU/100mL)" },
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? "bg-udc-dark" : "bg-slate-50"}`}>
      <Sidebar />
      <main className="flex-1 ml-[240px]">
        <Header />
        <div className="p-6 space-y-6">
          {/* Back + Title */}
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push("/")}
              className={`p-2 rounded-lg border transition-colors ${
                isDark ? "border-panel-border hover:bg-panel-hover" : "border-slate-200 hover:bg-slate-100"
              }`}
            >
              <ArrowLeft className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-600"}`} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{station.name}</h1>
                <StatusBadge status={station.status} isDark={isDark} />
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  {station.position[0].toFixed(4)}°N, {Math.abs(station.position[1]).toFixed(4)}°W
                </span>
                <span className={`text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>ID: {station.id}</span>
                <span className={`text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>Type: {typeLabel}</span>
              </div>
              {historical && (
                <p className={`text-xs mt-2 max-w-2xl ${isDark ? "text-slate-500" : "text-slate-500"}`}>{historical.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                isDark ? "border-panel-border text-slate-400 hover:bg-panel-hover" : "border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}>
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                isDark ? "border-panel-border text-slate-400 hover:bg-panel-hover" : "border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}>
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </div>

          {/* Current Readings */}
          {reading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Temperature", value: `${reading.temperature}°C`, icon: Thermometer, color: "text-cyan-400", bgDark: "bg-cyan-500/10 border-cyan-500/20", bgLight: "bg-cyan-50 border-cyan-200" },
                { label: "Dissolved Oxygen", value: `${reading.dissolvedOxygen} mg/L`, icon: Droplets, color: "text-blue-400", bgDark: "bg-blue-500/10 border-blue-500/20", bgLight: "bg-blue-50 border-blue-200",
                  alert: !isGI && reading.dissolvedOxygen < 5 },
                { label: "pH Level", value: `${reading.pH}`, icon: Activity, color: "text-emerald-400", bgDark: "bg-emerald-500/10 border-emerald-500/20", bgLight: "bg-emerald-50 border-emerald-200" },
                { label: "Turbidity", value: `${reading.turbidity} NTU`, icon: Waves, color: "text-amber-400", bgDark: "bg-amber-500/10 border-amber-500/20", bgLight: "bg-amber-50 border-amber-200" },
                { label: "E. coli", value: `${reading.eColiCount.toLocaleString()}`, unit: "CFU/100mL", icon: AlertTriangle,
                  color: reading.eColiCount > 410 ? "text-red-400" : "text-green-400",
                  bgDark: reading.eColiCount > 410 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20",
                  bgLight: reading.eColiCount > 410 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200",
                  alert: reading.eColiCount > 410 },
                { label: "Conductivity", value: `${reading.conductivity}`, unit: "µS/cm", icon: Activity, color: "text-purple-400", bgDark: "bg-purple-500/10 border-purple-500/20", bgLight: "bg-purple-50 border-purple-200" },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className={`rounded-xl border p-4 ${isDark ? metric.bgDark : metric.bgLight}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-4 h-4 ${metric.color}`} />
                      {metric.alert && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    </div>
                    <div className={`text-xl font-bold ${metric.color}`}>{metric.value}</div>
                    {metric.unit && <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{metric.unit}</div>}
                    <div className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{metric.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          {reading && (
            <div className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              Last updated: {new Date(reading.timestamp).toLocaleString()}
            </div>
          )}

          {/* Historical Charts */}
          {historical && (
            <>
              <div>
                <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Historical Trends (2025)</h2>
                <p className={`text-xs mb-4 ${isDark ? "text-slate-500" : "text-slate-500"}`}>Monthly averages with EPA compliance thresholds</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Dissolved Oxygen */}
                {!isGI && (
                  <div className="glass-panel rounded-xl p-4">
                    <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Dissolved Oxygen</h3>
                    <p className={`text-xs mb-3 ${isDark ? "text-slate-500" : "text-slate-500"}`}>Monthly average (mg/L) with EPA minimum threshold</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={historical.data}>
                        <defs>
                          <linearGradient id={`do-grad-${stationId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} />
                        <YAxis tick={{ fontSize: 11, fill: tickColor }} domain={[0, 14]} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="dissolvedOxygen" stroke="#3B82F6" fill={`url(#do-grad-${stationId})`} strokeWidth={2} name="DO (mg/L)" />
                        <Line type="monotone" dataKey={() => epaLimits.dissolvedOxygen.min} stroke="#EF4444" strokeWidth={1} strokeDasharray="5 5" name={epaLimits.dissolvedOxygen.label} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Temperature */}
                <div className="glass-panel rounded-xl p-4">
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Water Temperature</h3>
                  <p className={`text-xs mb-3 ${isDark ? "text-slate-500" : "text-slate-500"}`}>Monthly average (°C)</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={historical.data}>
                      <defs>
                        <linearGradient id={`temp-grad-${stationId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} />
                      <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="temperature" stroke="#22D3EE" fill={`url(#temp-grad-${stationId})`} strokeWidth={2} name="Temperature (°C)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* E. coli */}
                <div className="glass-panel rounded-xl p-4">
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>E. coli Levels</h3>
                  <p className={`text-xs mb-3 ${isDark ? "text-slate-500" : "text-slate-500"}`}>Monthly average (CFU/100mL) with EPA recreational limit</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={historical.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} />
                      <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="eColiCount" name="E. coli (CFU/100mL)" radius={[4, 4, 0, 0]} fill="#EF4444" fillOpacity={0.7} />
                      <Line type="monotone" dataKey={() => epaLimits.eColiCount.max} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 5" name={epaLimits.eColiCount.label} dot={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Turbidity */}
                <div className="glass-panel rounded-xl p-4">
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Turbidity</h3>
                  <p className={`text-xs mb-3 ${isDark ? "text-slate-500" : "text-slate-500"}`}>Monthly average (NTU)</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={historical.data}>
                      <defs>
                        <linearGradient id={`turb-grad-${stationId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} />
                      <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="turbidity" stroke="#F59E0B" fill={`url(#turb-grad-${stationId})`} strokeWidth={2} name="Turbidity (NTU)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Multi-parameter overlay */}
              {!isGI && (
                <div className="glass-panel rounded-xl p-4">
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Multi-Parameter Comparison</h3>
                  <p className={`text-xs mb-3 ${isDark ? "text-slate-500" : "text-slate-500"}`}>All parameters overlaid for correlation analysis</p>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={historical.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: tickColor }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: tickColor }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B" }} />
                      <Line yAxisId="left" type="monotone" dataKey="dissolvedOxygen" stroke="#3B82F6" strokeWidth={2} name="DO (mg/L)" dot={{ r: 2 }} />
                      <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#22D3EE" strokeWidth={2} name="Temp (°C)" dot={{ r: 2 }} />
                      <Line yAxisId="left" type="monotone" dataKey="pH" stroke="#4ADE80" strokeWidth={2} name="pH" dot={{ r: 2 }} />
                      <Line yAxisId="right" type="monotone" dataKey="turbidity" stroke="#F59E0B" strokeWidth={2} name="Turbidity (NTU)" dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Parameters monitored */}
              <div className="glass-panel rounded-xl p-4">
                <h3 className={`text-sm font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>Parameters Monitored</h3>
                <div className="flex flex-wrap gap-2">
                  {station.parameters.map((param) => (
                    <span key={param} className={`px-3 py-1.5 rounded-full text-xs border ${
                      isDark ? "bg-udc-blue/10 border-udc-blue/30 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-700"
                    }`}>
                      {param}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
