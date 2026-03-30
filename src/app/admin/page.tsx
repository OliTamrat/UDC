"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Upload,
  Database,
  MapPin,
  Activity,
  Trash2,
  Plus,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Edit3,
  Save,
  X,
  Clock,
  Download,
  Sparkles,
  FlaskConical,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  status: string;
  parameters: string;
  reading_count: number;
  last_reading: string | null;
}

interface Reading {
  id: number;
  station_id: string;
  station_name: string;
  timestamp: string;
  temperature: number | null;
  dissolved_oxygen: number | null;
  ph: number | null;
  turbidity: number | null;
  conductivity: number | null;
  ecoli_count: number | null;
  nitrate_n: number | null;
  phosphorus: number | null;
  source: string;
}

interface IngestionLog {
  id: number;
  source: string;
  status: string;
  records_count: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface Measurement {
  id: number;
  stationId: string;
  stationName: string;
  parameterId: string;
  parameterName: string;
  timestamp: string;
  value: number;
  unit: string;
  qualifier: string | null;
  source: string;
  category: string;
  epaMin: number | null;
  epaMax: number | null;
  exceedsThreshold: boolean;
}

interface UploadResult {
  type: string;
  inserted: number;
  total_rows: number;
  column_mapping: Record<string, string>;
  unmapped_columns: string[];
  warnings: string[];
  errors: string[];
}

type Tab = "stations" | "readings" | "measurements" | "upload" | "logs";

// ---------------------------------------------------------------------------
// Helper: Auth headers
// ---------------------------------------------------------------------------
function authHeaders(adminKey: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) headers["Authorization"] = `Bearer ${adminKey}`;
  return headers;
}

function authHeadersNoBody(adminKey: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (adminKey) headers["Authorization"] = `Bearer ${adminKey}`;
  return headers;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AdminPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // Login check
  const handleLogin = useCallback(async () => {
    setLoginError("");
    try {
      const res = await fetch("/api/admin/stations", {
        headers: authHeadersNoBody(adminKey),
      });
      if (res.ok) {
        sessionStorage.setItem("udc-admin-key", adminKey);
        setAuthenticated(true);
      } else if (res.status === 503) {
        setLoginError("Admin access requires ADMIN_API_KEY to be configured on the server.");
      } else {
        setLoginError("Invalid admin key. Please check your credentials.");
      }
    } catch {
      setLoginError("Unable to connect to the server.");
    }
  }, [adminKey]);

  // On mount: try stored key from sessionStorage, then try no-auth (dev mode)
  useEffect(() => {
    const storedKey = sessionStorage.getItem("udc-admin-key") || "";
    if (storedKey) setAdminKey(storedKey);

    fetch("/api/admin/stations", {
      headers: storedKey ? { Authorization: `Bearer ${storedKey}` } : {},
    })
      .then((r) => {
        if (r.ok) setAuthenticated(true);
        setAuthChecked(true);
      })
      .catch(() => {
        setAuthChecked(true);
      });
  }, []);

  if (!authenticated) {
    if (!authChecked) {
      return (
        <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-udc-dark" : "bg-[#F9FAFB]"}`}>
          <div className={`text-sm ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>Checking authentication...</div>
        </div>
      );
    }
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-udc-dark" : "bg-[#F9FAFB]"}`}>
        <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-lg ${isDark ? "bg-panel-bg border-panel-border" : "bg-white border-[#E5E7EB]"}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>Admin Panel</h1>
              <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>UDC Water Resources Data Management</p>
            </div>
          </div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
            Admin API Key
          </label>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Enter ADMIN_API_KEY..."
            className={`w-full px-3 py-2 rounded-lg border text-sm mb-3 ${
              isDark
                ? "bg-udc-dark border-panel-border text-[#E5E7EB] placeholder:text-[#9CA3AF]"
                : "bg-[#F9FAFB] border-[#E5E7EB] text-[#374151]"
            }`}
          />
          {loginError && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-xs mb-3 ${
              isDark ? "bg-red-500/10 border border-red-500/30 text-red-300" : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}
          <button
            onClick={handleLogin}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-udc-gold to-udc-red text-white text-sm font-medium hover:shadow-lg transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-udc-dark" : "bg-[#F9FAFB]"}`}>
      {/* Header */}
      <header className={`border-b px-4 sm:px-6 py-4 ${isDark ? "border-panel-border bg-panel-bg" : "border-[#E5E7EB] bg-white"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className={`text-xs hover:underline ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
              &larr; Dashboard
            </a>
            <div className="w-px h-5 bg-slate-600" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-[9px]">
                UDC
              </div>
              <div>
                <h1 className={`text-sm font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>Data Management</h1>
                <p className={`text-[10px] ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>WRRI Faculty Admin Panel</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("udc-admin-key");
              setAdminKey("");
              setAuthenticated(false);
            }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              isDark
                ? "border-panel-border text-[#D1D5DB] hover:text-white hover:bg-white/[0.04]"
                : "border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
            }`}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className={`border-b ${isDark ? "border-panel-border" : "border-[#E5E7EB]"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {([
            { id: "upload" as Tab, label: "Upload Data", icon: Upload },
            { id: "stations" as Tab, label: "Stations", icon: MapPin },
            { id: "readings" as Tab, label: "Readings", icon: Activity },
            { id: "measurements" as Tab, label: "Measurements", icon: FlaskConical },
            { id: "logs" as Tab, label: "Ingestion Log", icon: Clock },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? isDark
                    ? "border-udc-gold text-udc-gold"
                    : "border-blue-600 text-blue-600"
                  : isDark
                    ? "border-transparent text-[#D1D5DB] hover:text-slate-200"
                    : "border-transparent text-[#6B7280] hover:text-[#374151]"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "upload" && <UploadTab isDark={isDark} adminKey={adminKey} />}
        {activeTab === "stations" && <StationsTab isDark={isDark} adminKey={adminKey} />}
        {activeTab === "readings" && <ReadingsTab isDark={isDark} adminKey={adminKey} />}
        {activeTab === "measurements" && <MeasurementsTab isDark={isDark} adminKey={adminKey} />}
        {activeTab === "logs" && <LogsTab isDark={isDark} adminKey={adminKey} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload Tab
// ---------------------------------------------------------------------------
interface ColumnMapping {
  mapping: Record<string, string | null>;
  method: string;
  model?: string;
}

interface PreviewData {
  file: File;
  columns: string[];
  sampleRows: Record<string, string>[];
  aiMapping: ColumnMapping | null;
  loadingAI: boolean;
}

function UploadTab({ isDark, adminKey }: { isDark: boolean; adminKey: string }) {
  const [uploadType, setUploadType] = useState<"readings" | "stations">("readings");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [customMapping, setCustomMapping] = useState<Record<string, string | null>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Parse file and get AI column mapping
  const handleFileSelect = useCallback(async (file: File) => {
    setResult(null);
    const text = await file.text();
    const fileName = file.name.toLowerCase();
    let columns: string[] = [];
    let sampleRows: Record<string, string>[] = [];

    if (fileName.endsWith(".json")) {
      const json = JSON.parse(text);
      const data = Array.isArray(json) ? json : json.data || json.readings || json.stations || [json];
      columns = data.length > 0 ? Object.keys(data[0]) : [];
      sampleRows = data.slice(0, 5).map((row: Record<string, unknown>) => {
        const r: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) r[k] = v == null ? "" : String(v);
        return r;
      });
    } else {
      const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));
      if (lines.length >= 1) {
        columns = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
          const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const row: Record<string, string> = {};
          columns.forEach((h, j) => { row[h] = vals[j] || ""; });
          sampleRows.push(row);
        }
      }
    }

    const previewState: PreviewData = { file, columns, sampleRows, aiMapping: null, loadingAI: true };
    setPreview(previewState);

    // Request AI column mapping
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (adminKey) headers["Authorization"] = `Bearer ${adminKey}`;

      const res = await fetch("/api/admin/ai-map-columns", {
        method: "POST",
        headers,
        body: JSON.stringify({ columns, sampleRows: sampleRows.slice(0, 3), dataType: uploadType }),
      });
      const aiResult = await res.json();
      setPreview((prev) => prev ? { ...prev, aiMapping: aiResult, loadingAI: false } : null);
      setCustomMapping(aiResult.mapping || {});
    } catch {
      setPreview((prev) => prev ? { ...prev, loadingAI: false } : null);
    }
  }, [uploadType, adminKey]);

  const handleConfirmUpload = useCallback(async () => {
    if (!preview) return;
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", preview.file);
    formData.append("type", uploadType);

    try {
      const headers: Record<string, string> = {};
      if (adminKey) headers["Authorization"] = `Bearer ${adminKey}`;

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      setResult(data);
      setPreview(null);
    } catch (err) {
      setResult({
        type: uploadType,
        inserted: 0,
        total_rows: 0,
        column_mapping: {},
        unmapped_columns: [],
        warnings: [],
        errors: [err instanceof Error ? err.message : "Upload failed"],
      });
    } finally {
      setUploading(false);
    }
  }, [preview, uploadType, adminKey]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>Upload Data</h2>
        <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
          Upload CSV or JSON files with water quality readings or station data.
          Column names are automatically mapped to the database schema.
        </p>
      </div>

      {/* Upload type toggle */}
      <div className="flex gap-2">
        {(["readings", "stations"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setUploadType(type)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              uploadType === type
                ? "bg-gradient-to-r from-udc-gold to-udc-red text-white"
                : isDark
                  ? "bg-panel-bg border border-panel-border text-[#D1D5DB] hover:text-white"
                  : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#111827]"
            }`}
          >
            {type === "readings" ? "Water Quality Readings" : "Station Metadata"}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? isDark ? "border-udc-gold bg-udc-gold/5" : "border-blue-400 bg-blue-50"
            : isDark ? "border-panel-border hover:border-slate-500" : "border-[#E5E7EB] hover:border-slate-400"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className={`w-8 h-8 animate-spin ${isDark ? "text-udc-gold" : "text-blue-500"}`} />
            <p className={`text-sm font-medium ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>Processing upload...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className={`w-8 h-8 ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`} />
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                Drop your {uploadType === "readings" ? "readings" : "stations"} file here
              </p>
              <p className={`text-xs mt-1 ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                Supports CSV and JSON &bull; Click to browse
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expected format hint */}
      <div className={`rounded-lg border p-4 ${isDark ? "border-panel-border bg-panel-bg" : "border-[#E5E7EB] bg-white"}`}>
        <h3 className={`text-xs font-semibold mb-2 ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
          <FileText className="w-3.5 h-3.5 inline mr-1.5" />
          Expected Format — {uploadType === "readings" ? "Readings" : "Stations"}
        </h3>
        <div className={`text-[11px] font-mono p-3 rounded-lg overflow-x-auto ${isDark ? "bg-udc-dark text-[#D1D5DB]" : "bg-[#F9FAFB] text-[#4B5563]"}`}>
          {uploadType === "readings" ? (
            <>
              <div className="text-green-500 mb-1"># CSV columns (names are flexible — auto-mapped):</div>
              <div>station_id, timestamp, temperature, dissolved_oxygen, ph, turbidity, conductivity, ecoli_count, nitrate_n, phosphorus</div>
              <div className="mt-2 text-green-500"># Example:</div>
              <div>ANA-001, 2026-03-10T10:00:00, 12.5, 8.2, 7.1, 15.3, 320, 85, 1.2, 0.08</div>
            </>
          ) : (
            <>
              <div className="text-green-500 mb-1"># Required columns:</div>
              <div>id, name, latitude, longitude, type</div>
              <div className="mt-2 text-green-500"># Optional: status, parameters</div>
              <div className="mt-1 text-green-500"># type must be: river | stream | stormwater | green-infrastructure</div>
            </>
          )}
        </div>
        <p className={`text-[10px] mt-2 ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
          Column aliases supported: temp, DO, water_temp, e_coli, specific_conductance, etc.
        </p>
      </div>

      {/* AI Column Mapping Preview */}
      {preview && (
        <div className={`rounded-xl border p-4 space-y-4 ${isDark ? "border-panel-border bg-panel-bg" : "border-[#E5E7EB] bg-white"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${isDark ? "text-udc-gold" : "text-amber-500"}`} />
              <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>
                Column Mapping Preview
              </h3>
              {preview.aiMapping?.method === "ai" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400">AI-assisted</span>
              )}
              {preview.loadingAI && (
                <span className={`text-[10px] ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>Analyzing columns...</span>
              )}
            </div>
            <button
              onClick={() => setPreview(null)}
              className={`p-1 rounded ${isDark ? "text-[#D1D5DB] hover:text-white" : "text-[#9CA3AF] hover:text-[#374151]"}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
            File: <strong>{preview.file.name}</strong> &bull; {preview.sampleRows.length} sample rows &bull; {preview.columns.length} columns detected
          </p>

          {/* Mapping Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}>
                  <th className="text-left px-2 py-1.5 font-medium">Your Column</th>
                  <th className="text-left px-2 py-1.5 font-medium">Maps To</th>
                  <th className="text-left px-2 py-1.5 font-medium">Sample Value</th>
                </tr>
              </thead>
              <tbody className={isDark ? "divide-y divide-white/[0.06]" : "divide-y divide-[#F3F4F6]"}>
                {preview.columns.map((col) => {
                  const mapped = customMapping[col];
                  const schemaFields = uploadType === "stations"
                    ? ["id", "name", "latitude", "longitude", "type", "status", "parameters"]
                    : ["station_id", "timestamp", "temperature", "dissolved_oxygen", "ph", "turbidity", "conductivity", "ecoli_count", "nitrate_n", "phosphorus", "source"];

                  return (
                    <tr key={col}>
                      <td className={`px-2 py-1.5 font-mono ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>{col}</td>
                      <td className="px-2 py-1.5">
                        <select
                          value={mapped || ""}
                          onChange={(e) => setCustomMapping({ ...customMapping, [col]: e.target.value || null })}
                          className={`px-1.5 py-0.5 rounded border text-xs ${
                            mapped
                              ? isDark ? "bg-green-950/30 border-green-500/30 text-green-400" : "bg-green-50 border-green-200 text-green-700"
                              : isDark ? "bg-udc-dark border-panel-border text-[#9CA3AF]" : "bg-[#F9FAFB] border-[#E5E7EB] text-[#9CA3AF]"
                          }`}
                        >
                          <option value="">— skip —</option>
                          {schemaFields.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </td>
                      <td className={`px-2 py-1.5 font-mono text-[11px] ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                        {preview.sampleRows[0]?.[col] || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sample Data Preview */}
          {preview.sampleRows.length > 0 && (
            <details>
              <summary className={`text-xs cursor-pointer ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
                Preview first {preview.sampleRows.length} rows
              </summary>
              <div className={`mt-2 text-[10px] font-mono p-3 rounded-lg overflow-x-auto ${isDark ? "bg-udc-dark text-[#D1D5DB]" : "bg-[#F9FAFB] text-[#4B5563]"}`}>
                <table className="w-full">
                  <thead>
                    <tr>
                      {preview.columns.map((c) => (
                        <th key={c} className="text-left px-2 py-1 font-medium">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sampleRows.map((row, i) => (
                      <tr key={i}>
                        {preview.columns.map((c) => (
                          <td key={c} className="px-2 py-0.5">{row[c] || ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          {/* Upload Button */}
          <div className="flex gap-2">
            <button
              onClick={handleConfirmUpload}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-udc-gold to-udc-red text-white text-xs font-medium disabled:opacity-50"
            >
              {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Uploading..." : `Upload ${preview.sampleRows.length > 0 ? "" : ""}${uploadType}`}
            </button>
            <button
              onClick={() => setPreview(null)}
              className={`px-4 py-2 rounded-lg text-xs ${isDark ? "text-[#D1D5DB] hover:text-white" : "text-[#6B7280] hover:text-[#374151]"}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload Result */}
      {result && <UploadResultPanel result={result} isDark={isDark} />}
    </div>
  );
}

function UploadResultPanel({ result, isDark }: { result: UploadResult; isDark: boolean }) {
  const hasErrors = result.errors.length > 0;
  const hasWarnings = result.warnings.length > 0;
  const allFailed = result.inserted === 0 && hasErrors;

  return (
    <div className={`rounded-xl border p-4 space-y-4 ${
      allFailed
        ? isDark ? "border-red-500/30 bg-red-950/20" : "border-red-200 bg-red-50"
        : hasErrors
          ? isDark ? "border-amber-500/30 bg-amber-950/20" : "border-amber-200 bg-amber-50"
          : isDark ? "border-green-500/30 bg-green-950/20" : "border-green-200 bg-green-50"
    }`}>
      {/* Summary */}
      <div className="flex items-center gap-3">
        {allFailed ? (
          <XCircle className="w-5 h-5 text-red-400" />
        ) : hasErrors ? (
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        )}
        <div>
          <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>
            {allFailed ? "Upload Failed" : hasErrors ? "Partial Upload" : "Upload Successful"}
          </p>
          <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#4B5563]"}`}>
            {result.inserted} of {result.total_rows} {result.type} records inserted
          </p>
        </div>
      </div>

      {/* Column mapping */}
      {Object.keys(result.column_mapping).length > 0 && (
        <div>
          <p className={`text-xs font-medium mb-1 ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>Column Mapping:</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(result.column_mapping).map(([from, to]) => (
              <span
                key={from}
                className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? "bg-white/5 text-[#D1D5DB]" : "bg-white text-[#4B5563]"}`}
              >
                {from} &rarr; {to}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div>
          <p className={`text-xs font-medium mb-1 ${isDark ? "text-amber-300" : "text-amber-700"}`}>Warnings:</p>
          <ul className={`text-[11px] space-y-0.5 ${isDark ? "text-amber-300/80" : "text-amber-600"}`}>
            {result.warnings.slice(0, 10).map((w, i) => (
              <li key={i}>&bull; {w}</li>
            ))}
            {result.warnings.length > 10 && <li>... and {result.warnings.length - 10} more</li>}
          </ul>
        </div>
      )}

      {/* Errors */}
      {hasErrors && (
        <div>
          <p className={`text-xs font-medium mb-1 ${isDark ? "text-red-300" : "text-red-700"}`}>Errors:</p>
          <ul className={`text-[11px] space-y-0.5 ${isDark ? "text-red-300/80" : "text-red-600"}`}>
            {result.errors.slice(0, 10).map((e, i) => (
              <li key={i}>&bull; {e}</li>
            ))}
            {result.errors.length > 10 && <li>... and {result.errors.length - 10} more</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stations Tab
// ---------------------------------------------------------------------------
function StationsTab({ isDark, adminKey }: { isDark: boolean; adminKey: string }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Station>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStation, setNewStation] = useState({
    id: "", name: "", latitude: "", longitude: "", type: "river", status: "active",
  });

  const fetchStations = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/stations", { headers: authHeadersNoBody(adminKey) });
    const data = await res.json();
    setStations(data.stations || []);
    setLoading(false);
  }, [adminKey]);

  useEffect(() => { fetchStations(); }, [fetchStations]);

  const handleAdd = async () => {
    if (!newStation.id || !newStation.name || !newStation.latitude || !newStation.longitude) {
      alert("All fields are required");
      return;
    }
    const res = await fetch("/api/admin/stations", {
      method: "POST",
      headers: authHeaders(adminKey),
      body: JSON.stringify({
        ...newStation,
        latitude: parseFloat(newStation.latitude),
        longitude: parseFloat(newStation.longitude),
      }),
    });
    if (res.ok) {
      setShowAddForm(false);
      setNewStation({ id: "", name: "", latitude: "", longitude: "", type: "river", status: "active" });
      fetchStations();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const res = await fetch("/api/admin/stations", {
      method: "PUT",
      headers: authHeaders(adminKey),
      body: JSON.stringify({ id: editingId, ...editData }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchStations();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete station ${id} and all its readings? This cannot be undone.`)) return;
    await fetch("/api/admin/stations", {
      method: "DELETE",
      headers: authHeaders(adminKey),
      body: JSON.stringify({ id }),
    });
    fetchStations();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>Monitoring Stations</h2>
          <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>{stations.length} stations registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStations} className={`p-2 rounded-lg border text-xs ${isDark ? "border-panel-border text-[#D1D5DB] hover:text-white" : "border-[#E5E7EB] text-[#6B7280] hover:text-[#374151]"}`}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-udc-gold to-udc-red text-white text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Add Station
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className={`rounded-xl border p-4 ${isDark ? "border-panel-border bg-panel-bg" : "border-[#E5E7EB] bg-white"}`}>
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? "text-white" : "text-[#111827]"}`}>New Station</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: "id", label: "Station ID", placeholder: "e.g. ANA-005" },
              { key: "name", label: "Name", placeholder: "e.g. Anacostia at Navy Yard" },
              { key: "latitude", label: "Latitude", placeholder: "38.8xxx" },
              { key: "longitude", label: "Longitude", placeholder: "-76.9xxx" },
            ].map((field) => (
              <div key={field.key}>
                <label className={`text-[10px] font-medium block mb-1 ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>{field.label}</label>
                <input
                  value={newStation[field.key as keyof typeof newStation]}
                  onChange={(e) => setNewStation({ ...newStation, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${isDark ? "bg-udc-dark border-panel-border text-[#E5E7EB]" : "bg-[#F9FAFB] border-[#E5E7EB]"}`}
                />
              </div>
            ))}
            <div>
              <label className={`text-[10px] font-medium block mb-1 ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>Type</label>
              <select
                value={newStation.type}
                onChange={(e) => setNewStation({ ...newStation, type: e.target.value })}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${isDark ? "bg-udc-dark border-panel-border text-[#E5E7EB]" : "bg-[#F9FAFB] border-[#E5E7EB]"}`}
              >
                <option value="river">River</option>
                <option value="stream">Stream</option>
                <option value="stormwater">Stormwater</option>
                <option value="green-infrastructure">Green Infrastructure</option>
              </select>
            </div>
            <div>
              <label className={`text-[10px] font-medium block mb-1 ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>Status</label>
              <select
                value={newStation.status}
                onChange={(e) => setNewStation({ ...newStation, status: e.target.value })}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${isDark ? "bg-udc-dark border-panel-border text-[#E5E7EB]" : "bg-[#F9FAFB] border-[#E5E7EB]"}`}
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-udc-gold to-udc-red text-white text-xs font-medium">
              <Save className="w-3.5 h-3.5" /> Save Station
            </button>
            <button onClick={() => setShowAddForm(false)} className={`px-3 py-2 rounded-lg text-xs ${isDark ? "text-[#D1D5DB] hover:text-white" : "text-[#6B7280] hover:text-[#374151]"}`}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className={`w-5 h-5 animate-spin ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`} />
        </div>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${isDark ? "border-panel-border" : "border-[#E5E7EB]"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={isDark ? "bg-panel-bg text-[#D1D5DB]" : "bg-[#F9FAFB] text-[#6B7280]"}>
                  <th className="text-left px-3 py-2.5 font-medium">ID</th>
                  <th className="text-left px-3 py-2.5 font-medium">Name</th>
                  <th className="text-left px-3 py-2.5 font-medium">Type</th>
                  <th className="text-left px-3 py-2.5 font-medium">Status</th>
                  <th className="text-right px-3 py-2.5 font-medium">Lat</th>
                  <th className="text-right px-3 py-2.5 font-medium">Lng</th>
                  <th className="text-right px-3 py-2.5 font-medium">Readings</th>
                  <th className="text-right px-3 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className={isDark ? "divide-y divide-white/[0.06]" : "divide-y divide-[#F3F4F6]"}>
                {stations.map((s) => (
                  <tr key={s.id} className={isDark ? "hover:bg-white/[0.04]" : "hover:bg-[#F3F4F6]"}>
                    {editingId === s.id ? (
                      <>
                        <td className={`px-3 py-2 font-mono ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>{s.id}</td>
                        <td className="px-3 py-2">
                          <input
                            defaultValue={s.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className={`w-full px-1.5 py-0.5 rounded border text-xs ${isDark ? "bg-udc-dark border-panel-border text-[#E5E7EB]" : "bg-white border-[#E5E7EB]"}`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            defaultValue={s.type}
                            onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                            className={`px-1.5 py-0.5 rounded border text-xs ${isDark ? "bg-udc-dark border-panel-border text-[#E5E7EB]" : "bg-white border-[#E5E7EB]"}`}
                          >
                            <option value="river">River</option>
                            <option value="stream">Stream</option>
                            <option value="stormwater">Stormwater</option>
                            <option value="green-infrastructure">Green Infra</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            defaultValue={s.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                            className={`px-1.5 py-0.5 rounded border text-xs ${isDark ? "bg-udc-dark border-panel-border text-[#E5E7EB]" : "bg-white border-[#E5E7EB]"}`}
                          >
                            <option value="active">Active</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="offline">Offline</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            defaultValue={s.latitude}
                            onChange={(e) => setEditData({ ...editData, latitude: parseFloat(e.target.value) })}
                            className={`w-20 px-1.5 py-0.5 rounded border text-xs text-right ${isDark ? "bg-udc-dark border-panel-border text-[#E5E7EB]" : "bg-white border-[#E5E7EB]"}`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            defaultValue={s.longitude}
                            onChange={(e) => setEditData({ ...editData, longitude: parseFloat(e.target.value) })}
                            className={`w-20 px-1.5 py-0.5 rounded border text-xs text-right ${isDark ? "bg-udc-dark border-panel-border text-[#E5E7EB]" : "bg-white border-[#E5E7EB]"}`}
                          />
                        </td>
                        <td className={`text-right px-3 py-2 ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>{s.reading_count}</td>
                        <td className="text-right px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={handleSaveEdit} className="p-1 rounded text-green-400 hover:bg-green-500/10" title="Save">
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1 rounded text-[#9CA3AF] hover:bg-slate-500/10" title="Cancel">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={`px-3 py-2 font-mono font-medium ${isDark ? "text-udc-gold" : "text-blue-600"}`}>{s.id}</td>
                        <td className={`px-3 py-2 ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>{s.name}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${isDark ? "bg-white/5 text-[#D1D5DB]" : "bg-[#F3F4F6] text-[#4B5563]"}`}>
                            {s.type}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            s.status === "active" ? "bg-green-500/10 text-green-400" :
                            s.status === "maintenance" ? "bg-amber-500/10 text-amber-400" :
                            "bg-red-500/10 text-red-400"
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className={`text-right px-3 py-2 font-mono ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>{Number(s.latitude).toFixed(4)}</td>
                        <td className={`text-right px-3 py-2 font-mono ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>{Number(s.longitude).toFixed(4)}</td>
                        <td className={`text-right px-3 py-2 ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>{s.reading_count}</td>
                        <td className="text-right px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditingId(s.id); setEditData({}); }}
                              className={`p-1 rounded ${isDark ? "text-[#D1D5DB] hover:text-blue-400 hover:bg-blue-500/10" : "text-[#9CA3AF] hover:text-blue-600 hover:bg-blue-50"}`}
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className={`p-1 rounded ${isDark ? "text-[#D1D5DB] hover:text-red-400 hover:bg-red-500/10" : "text-[#9CA3AF] hover:text-red-600 hover:bg-red-50"}`}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Readings Tab
// ---------------------------------------------------------------------------
function ReadingsTab({ isDark, adminKey }: { isDark: boolean; adminKey: string }) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stationFilter, setStationFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchReadings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (stationFilter) params.set("station", stationFilter);

    const res = await fetch(`/api/admin/readings?${params}`, {
      headers: authHeadersNoBody(adminKey),
    });
    const data = await res.json();
    setReadings(data.readings || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [adminKey, offset, stationFilter]);

  useEffect(() => { fetchReadings(); }, [fetchReadings]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this reading?")) return;
    await fetch("/api/admin/readings", {
      method: "DELETE",
      headers: authHeaders(adminKey),
      body: JSON.stringify({ id }),
    });
    fetchReadings();
  };

  const formatVal = (v: number | null) => v != null ? v.toFixed(2) : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>Water Quality Readings</h2>
          <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>{total} total readings</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={stationFilter}
            onChange={(e) => { setStationFilter(e.target.value); setOffset(0); }}
            placeholder="Filter by station ID..."
            className={`px-3 py-1.5 rounded-lg border text-xs w-44 ${isDark ? "bg-udc-dark border-panel-border text-[#E5E7EB] placeholder:text-[#9CA3AF]" : "bg-white border-[#E5E7EB]"}`}
          />
          <button onClick={fetchReadings} className={`p-2 rounded-lg border text-xs ${isDark ? "border-panel-border text-[#D1D5DB]" : "border-[#E5E7EB] text-[#6B7280]"}`}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={`/api/export?format=csv${stationFilter ? `&station=${stationFilter}` : ""}`}
            className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs ${isDark ? "border-panel-border text-[#D1D5DB] hover:text-white" : "border-[#E5E7EB] text-[#6B7280] hover:text-[#374151]"}`}
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className={`w-5 h-5 animate-spin ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`} />
        </div>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${isDark ? "border-panel-border" : "border-[#E5E7EB]"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={isDark ? "bg-panel-bg text-[#D1D5DB]" : "bg-[#F9FAFB] text-[#6B7280]"}>
                  <th className="text-left px-3 py-2.5 font-medium">Station</th>
                  <th className="text-left px-3 py-2.5 font-medium">Timestamp</th>
                  <th className="text-right px-3 py-2.5 font-medium">Temp °C</th>
                  <th className="text-right px-3 py-2.5 font-medium">DO mg/L</th>
                  <th className="text-right px-3 py-2.5 font-medium">pH</th>
                  <th className="text-right px-3 py-2.5 font-medium">Turb NTU</th>
                  <th className="text-right px-3 py-2.5 font-medium">Cond</th>
                  <th className="text-right px-3 py-2.5 font-medium">E.coli</th>
                  <th className="text-left px-3 py-2.5 font-medium">Source</th>
                  <th className="text-right px-3 py-2.5 font-medium">Del</th>
                </tr>
              </thead>
              <tbody className={isDark ? "divide-y divide-white/[0.06]" : "divide-y divide-[#F3F4F6]"}>
                {readings.map((r) => (
                  <tr key={r.id} className={isDark ? "hover:bg-white/[0.04]" : "hover:bg-[#F3F4F6]"}>
                    <td className={`px-3 py-2 font-mono ${isDark ? "text-udc-gold" : "text-blue-600"}`}>{r.station_id}</td>
                    <td className={`px-3 py-2 ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className={`text-right px-3 py-2 font-mono ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>{formatVal(r.temperature)}</td>
                    <td className={`text-right px-3 py-2 font-mono ${
                      r.dissolved_oxygen != null && r.dissolved_oxygen < 5 ? "text-red-400 font-semibold" : isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"
                    }`}>{formatVal(r.dissolved_oxygen)}</td>
                    <td className={`text-right px-3 py-2 font-mono ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>{formatVal(r.ph)}</td>
                    <td className={`text-right px-3 py-2 font-mono ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>{formatVal(r.turbidity)}</td>
                    <td className={`text-right px-3 py-2 font-mono ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>{formatVal(r.conductivity)}</td>
                    <td className={`text-right px-3 py-2 font-mono ${
                      r.ecoli_count != null && r.ecoli_count > 410 ? "text-red-400 font-semibold" : isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"
                    }`}>{formatVal(r.ecoli_count)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        r.source === "usgs" ? "bg-blue-500/10 text-blue-400" :
                        r.source === "epa" ? "bg-green-500/10 text-green-400" :
                        r.source === "upload" ? "bg-purple-500/10 text-purple-400" :
                        isDark ? "bg-white/5 text-[#D1D5DB]" : "bg-[#F3F4F6] text-[#6B7280]"
                      }`}>
                        {r.source}
                      </span>
                    </td>
                    <td className="text-right px-3 py-2">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className={`p-1 rounded ${isDark ? "text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/10" : "text-[#9CA3AF] hover:text-red-600 hover:bg-red-50"}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? "border-white/[0.06]" : "border-[#F3F4F6]"}`}>
            <p className={`text-[11px] ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
              Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className={`p-1.5 rounded ${isDark ? "text-[#D1D5DB] hover:bg-white/[0.04] disabled:opacity-30" : "text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-30"}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className={`p-1.5 rounded ${isDark ? "text-[#D1D5DB] hover:bg-white/[0.04] disabled:opacity-30" : "text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-30"}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Measurements Tab (EAV data — all 25 parameters)
// ---------------------------------------------------------------------------
const CATEGORY_COLORS: Record<string, string> = {
  physical: "bg-blue-500/10 text-blue-400",
  nutrients: "bg-green-500/10 text-green-400",
  metals: "bg-orange-500/10 text-orange-400",
  biological: "bg-pink-500/10 text-pink-400",
  organic: "bg-purple-500/10 text-purple-400",
};

function MeasurementsTab({ isDark, adminKey }: { isDark: boolean; adminKey: string }) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stationFilter, setStationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [violationsOnly, setViolationsOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchMeasurements = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (stationFilter) params.set("stations", stationFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (violationsOnly) params.set("violations", "true");

    const res = await fetch(`/api/measurements?${params}`, {
      headers: authHeadersNoBody(adminKey),
    });
    const data = await res.json();
    setMeasurements(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [adminKey, offset, stationFilter, categoryFilter, violationsOnly]);

  useEffect(() => { fetchMeasurements(); }, [fetchMeasurements]);

  const isViolation = (m: Measurement) =>
    (m.epaMax != null && m.value > m.epaMax) ||
    (m.epaMin != null && m.value < m.epaMin);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>EAV Measurements</h2>
          <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>{total} total measurements (25 parameters across 5 categories)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={stationFilter}
            onChange={(e) => { setStationFilter(e.target.value); setOffset(0); }}
            placeholder="Station ID..."
            className={`px-3 py-1.5 rounded-lg border text-xs w-32 ${isDark ? "bg-udc-dark border-panel-border text-[#E5E7EB] placeholder:text-[#9CA3AF]" : "bg-white border-[#E5E7EB]"}`}
          />
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setOffset(0); }}
            className={`px-3 py-1.5 rounded-lg border text-xs ${isDark ? "bg-udc-dark border-panel-border text-[#E5E7EB]" : "bg-white border-[#E5E7EB]"}`}
          >
            <option value="">All Categories</option>
            <option value="physical">Physical</option>
            <option value="nutrients">Nutrients</option>
            <option value="metals">Metals</option>
            <option value="biological">Biological</option>
            <option value="organic">Organic / Emerging</option>
          </select>
          <label className={`flex items-center gap-1.5 text-xs cursor-pointer ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
            <input
              type="checkbox"
              checked={violationsOnly}
              onChange={(e) => { setViolationsOnly(e.target.checked); setOffset(0); }}
              className="rounded border-slate-400"
            />
            Violations only
          </label>
          <button onClick={fetchMeasurements} className={`p-2 rounded-lg border text-xs ${isDark ? "border-panel-border text-[#D1D5DB]" : "border-[#E5E7EB] text-[#6B7280]"}`}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className={`w-5 h-5 animate-spin ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`} />
        </div>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${isDark ? "border-panel-border" : "border-[#E5E7EB]"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={isDark ? "bg-panel-bg text-[#D1D5DB]" : "bg-[#F9FAFB] text-[#6B7280]"}>
                  <th className="text-left px-3 py-2.5 font-medium">Station</th>
                  <th className="text-left px-3 py-2.5 font-medium">Parameter</th>
                  <th className="text-left px-3 py-2.5 font-medium">Category</th>
                  <th className="text-left px-3 py-2.5 font-medium">Timestamp</th>
                  <th className="text-right px-3 py-2.5 font-medium">Value</th>
                  <th className="text-left px-3 py-2.5 font-medium">Unit</th>
                  <th className="text-left px-3 py-2.5 font-medium">EPA Threshold</th>
                  <th className="text-left px-3 py-2.5 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className={isDark ? "divide-y divide-white/[0.06]" : "divide-y divide-[#F3F4F6]"}>
                {measurements.map((m) => {
                  const violation = isViolation(m);
                  return (
                    <tr key={m.id} className={`${isDark ? "hover:bg-white/[0.04]" : "hover:bg-[#F3F4F6]"} ${violation ? (isDark ? "bg-red-500/5" : "bg-red-50/50") : ""}`}>
                      <td className={`px-3 py-2 font-mono ${isDark ? "text-udc-gold" : "text-blue-600"}`}>{m.stationId}</td>
                      <td className={`px-3 py-2 ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                        <span className="font-medium">{m.parameterName}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${CATEGORY_COLORS[m.category] || (isDark ? "bg-white/5 text-[#D1D5DB]" : "bg-[#F3F4F6] text-[#6B7280]")}`}>
                          {m.category}
                        </span>
                      </td>
                      <td className={`px-3 py-2 ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                        {new Date(m.timestamp).toLocaleString()}
                      </td>
                      <td className={`text-right px-3 py-2 font-mono ${violation ? "text-red-400 font-semibold" : isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
                        {m.value.toFixed(3)}
                      </td>
                      <td className={`px-3 py-2 ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>{m.unit}</td>
                      <td className={`px-3 py-2 text-[11px] ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                        {m.epaMin != null && m.epaMax != null
                          ? `${m.epaMin}–${m.epaMax}`
                          : m.epaMin != null
                            ? `min ${m.epaMin}`
                            : m.epaMax != null
                              ? `max ${m.epaMax}`
                              : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          m.source === "usgs" ? "bg-blue-500/10 text-blue-400" :
                          m.source === "epa" ? "bg-green-500/10 text-green-400" :
                          m.source === "wqp" ? "bg-teal-500/10 text-teal-400" :
                          isDark ? "bg-white/5 text-[#D1D5DB]" : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}>
                          {m.source}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {measurements.length === 0 && (
                  <tr>
                    <td colSpan={8} className={`px-3 py-8 text-center text-xs ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                      No measurements found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? "border-white/[0.06]" : "border-[#F3F4F6]"}`}>
            <p className={`text-[11px] ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
              Showing {total > 0 ? offset + 1 : 0}–{Math.min(offset + limit, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className={`p-1.5 rounded ${isDark ? "text-[#D1D5DB] hover:bg-white/[0.04] disabled:opacity-30" : "text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-30"}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className={`p-1.5 rounded ${isDark ? "text-[#D1D5DB] hover:bg-white/[0.04] disabled:opacity-30" : "text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-30"}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ingestion Logs Tab
// ---------------------------------------------------------------------------
interface IngestResult {
  status: "success" | "error";
  source: string;
  records_ingested: number;
  measurements_ingested: number;
  errors: string[];
  validation_warnings: string[];
}

function LogsTab({ isDark, adminKey }: { isDark: boolean; adminKey: string }) {
  const [logs, setLogs] = useState<IngestionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerSource, setTriggerSource] = useState("usgs");
  const [triggering, setTriggering] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/ingestion-log?limit=100");
    const data = await res.json();
    setLogs(data.logs || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const triggerIngest = async () => {
    setTriggering(true);
    setIngestResult(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const ingestKey = adminKey || "";
      if (ingestKey) headers["Authorization"] = `Bearer ${ingestKey}`;

      const res = await fetch(`/api/ingest?source=${triggerSource}`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      setIngestResult({
        status: data.errors?.length ? "error" : "success",
        source: triggerSource,
        records_ingested: data.records_ingested || 0,
        measurements_ingested: data.measurements_ingested || 0,
        errors: data.errors || [],
        validation_warnings: data.validation_warnings || [],
      });
      fetchLogs();
    } catch (err) {
      setIngestResult({
        status: "error",
        source: triggerSource,
        records_ingested: 0,
        measurements_ingested: 0,
        errors: [err instanceof Error ? err.message : String(err)],
        validation_warnings: [],
      });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>Ingestion Log</h2>
          <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>History of all data ingestion runs</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={triggerSource}
            onChange={(e) => setTriggerSource(e.target.value)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs ${isDark ? "bg-udc-dark border-panel-border text-[#E5E7EB]" : "bg-white border-[#E5E7EB]"}`}
          >
            <option value="usgs">USGS NWIS (Real-time IV)</option>
            <option value="epa">EPA WQP (Legacy)</option>
            <option value="wqp">WQP (Broad Parameters)</option>
          </select>
          <button
            onClick={triggerIngest}
            disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-udc-gold to-udc-red text-white text-xs font-medium disabled:opacity-50"
          >
            {triggering ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            {triggering ? "Ingesting..." : "Run Ingestion"}
          </button>
        </div>
      </div>

      {/* Ingestion Result Banner */}
      {ingestResult && (
        <div className={`rounded-xl border p-4 ${
          ingestResult.status === "error"
            ? isDark ? "border-red-500/30 bg-red-950/20" : "border-red-200 bg-red-50"
            : isDark ? "border-green-500/30 bg-green-950/20" : "border-green-200 bg-green-50"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {ingestResult.status === "error" ? (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>
                  Ingestion Complete — {ingestResult.source.toUpperCase()}
                </p>
                <div className={`mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-blue-400" />
                    <span><strong>{ingestResult.records_ingested}</strong> legacy readings</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-purple-400" />
                    <span><strong>{ingestResult.measurements_ingested}</strong> EAV measurements</span>
                  </div>
                </div>
                {ingestResult.records_ingested === 0 && ingestResult.measurements_ingested === 0 && ingestResult.errors.length === 0 && (
                  <p className={`mt-2 text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
                    No new data was returned. This can happen if the USGS sites lack real-time water quality sensors, or data for the current period was already ingested.
                  </p>
                )}
                {ingestResult.validation_warnings.length > 0 && (
                  <div className="mt-2">
                    <p className={`text-xs font-medium ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                      {ingestResult.validation_warnings.length} validation warning{ingestResult.validation_warnings.length > 1 ? "s" : ""}
                    </p>
                    <ul className={`mt-1 text-[11px] space-y-0.5 ${isDark ? "text-amber-300/80" : "text-amber-600"}`}>
                      {ingestResult.validation_warnings.slice(0, 5).map((w, i) => (
                        <li key={i}>&bull; {w}</li>
                      ))}
                      {ingestResult.validation_warnings.length > 5 && (
                        <li>... and {ingestResult.validation_warnings.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
                {ingestResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className={`text-xs font-medium ${isDark ? "text-red-300" : "text-red-700"}`}>Errors:</p>
                    <ul className={`mt-1 text-[11px] space-y-0.5 ${isDark ? "text-red-300/80" : "text-red-600"}`}>
                      {ingestResult.errors.slice(0, 5).map((e, i) => (
                        <li key={i}>&bull; {e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {ingestResult.errors.length === 0 && (ingestResult.records_ingested > 0 || ingestResult.measurements_ingested > 0) && (
                  <p className={`mt-2 text-xs ${isDark ? "text-green-300/80" : "text-green-600"}`}>
                    No errors. Data is now available in the dashboard.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIngestResult(null)}
              className={`p-1 rounded ${isDark ? "text-[#D1D5DB] hover:text-white" : "text-[#9CA3AF] hover:text-[#374151]"}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className={`w-5 h-5 animate-spin ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`} />
        </div>
      ) : logs.length === 0 ? (
        <div className={`text-center py-12 text-sm ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
          No ingestion logs yet. Run an ingestion to get started.
        </div>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${isDark ? "border-panel-border" : "border-[#E5E7EB]"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={isDark ? "bg-panel-bg text-[#D1D5DB]" : "bg-[#F9FAFB] text-[#6B7280]"}>
                  <th className="text-left px-3 py-2.5 font-medium">Source</th>
                  <th className="text-left px-3 py-2.5 font-medium">Status</th>
                  <th className="text-right px-3 py-2.5 font-medium">Records</th>
                  <th className="text-left px-3 py-2.5 font-medium">Started</th>
                  <th className="text-left px-3 py-2.5 font-medium">Completed</th>
                  <th className="text-left px-3 py-2.5 font-medium">Error</th>
                </tr>
              </thead>
              <tbody className={isDark ? "divide-y divide-white/[0.06]" : "divide-y divide-[#F3F4F6]"}>
                {logs.map((log) => (
                  <tr key={log.id} className={isDark ? "hover:bg-white/[0.04]" : "hover:bg-[#F3F4F6]"}>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        log.source.includes("usgs") ? "bg-blue-500/10 text-blue-400" :
                        log.source.includes("epa") ? "bg-green-500/10 text-green-400" :
                        log.source.includes("upload") ? "bg-purple-500/10 text-purple-400" :
                        isDark ? "bg-white/5 text-[#D1D5DB]" : "bg-[#F3F4F6] text-[#6B7280]"
                      }`}>
                        {log.source}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {log.status === "success" ? (
                        <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="w-3 h-3" /> Success</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3 h-3" /> Error</span>
                      )}
                    </td>
                    <td className={`text-right px-3 py-2 font-mono ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>{log.records_count}</td>
                    <td className={`px-3 py-2 ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
                      {log.started_at ? new Date(log.started_at).toLocaleString() : "—"}
                    </td>
                    <td className={`px-3 py-2 ${isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"}`}>
                      {log.completed_at ? new Date(log.completed_at).toLocaleString() : "—"}
                    </td>
                    <td className={`px-3 py-2 max-w-[200px] truncate ${isDark ? "text-red-300/80" : "text-red-600"}`} title={log.error_message || ""}>
                      {log.error_message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
