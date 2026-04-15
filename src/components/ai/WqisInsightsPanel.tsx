'use client';
import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, RefreshCw, BrainCircuit } from 'lucide-react';

type Status = 'GOOD' | 'WARNING' | 'POOR' | 'CRITICAL';
interface Insights { overallStatus: Status; alerts: unknown[]; summary: string; checkedAt: string; }

const STATUS_CONFIG: Record<Status, { label: string; icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  GOOD:     { label: 'All Clear',  icon: CheckCircle2,  color: 'text-emerald-500', bg: 'bg-emerald-500/10 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' },
  WARNING:  { label: 'Warning',    icon: AlertTriangle,  color: 'text-amber-500',   bg: 'bg-amber-500/10 dark:bg-amber-950/30',     border: 'border-amber-200 dark:border-amber-800' },
  POOR:     { label: 'Poor',       icon: ShieldAlert,    color: 'text-orange-500',  bg: 'bg-orange-500/10 dark:bg-orange-950/30',   border: 'border-orange-200 dark:border-orange-800' },
  CRITICAL: { label: 'Critical',   icon: ShieldAlert,    color: 'text-red-500',     bg: 'bg-red-500/10 dark:bg-red-950/30',         border: 'border-red-200 dark:border-red-800' },
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
}

/** Parse markdown-style text into structured alert items */
function parseAlerts(summary: string): { station: string; parameter: string; value: string; threshold: string; severity: string }[] {
  const alerts: { station: string; parameter: string; value: string; threshold: string; severity: string }[] = [];
  const stationBlocks = summary.split(/\*\s*\*\*Station:/);

  for (const block of stationBlocks) {
    if (!block.includes('Parameter:')) continue;
    const stationMatch = block.match(/^([^*]+)\*\*/);
    const station = stationMatch ? stationMatch[1].trim().replace(/\(.*\)/, '').trim() : 'Unknown';
    const paramMatch = block.match(/Parameter:\*\*\s*([^\n*]+)/);
    const valueMatch = block.match(/Value:\*\*\s*([^\n*]+)/);
    const threshMatch = block.match(/Threshold:\*\*\s*([^\n*]+)/);
    const sevMatch = block.match(/Severity:\*\*\s*([^\n*]+)/);

    if (paramMatch) {
      alerts.push({
        station,
        parameter: paramMatch[1].trim(),
        value: valueMatch ? valueMatch[1].trim() : '',
        threshold: threshMatch ? threshMatch[1].trim() : '',
        severity: sevMatch ? sevMatch[1].trim() : 'WARNING',
      });
    }
  }
  return alerts;
}

/** Extract brief summary from the full text */
function extractBriefSummary(summary: string): string {
  const briefMatch = summary.match(/Brief Summary:\*\*\s*([^\n]+)/);
  if (briefMatch) return briefMatch[1].replace(/\*\*/g, '').trim().split('\n')[0];

  const lines = summary.split('\n').filter(l => l.trim() && !l.includes('**Station:') && !l.includes('**Parameter:') && !l.includes('**Value:') && !l.includes('**Threshold:') && !l.includes('**Severity:') && !l.includes('Active Threshold'));
  const last = lines[lines.length - 1];
  return last ? last.replace(/\*\*/g, '').trim() : '';
}

export function WqisInsightsPanel() {
  const [data, setData]       = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/wqis/insights');
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load insights'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="rounded-2xl border border-[#D1D5DB] dark:border-white/[0.06] bg-white dark:bg-[#13161F]/90 p-5 animate-pulse shadow-md dark:shadow-lg dark:shadow-black/20">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#E5E7EB] dark:bg-white/[0.06]" />
        <div className="h-4 bg-[#E5E7EB] dark:bg-white/[0.06] rounded w-40" />
      </div>
      <div className="h-3 bg-[#E5E7EB] dark:bg-white/[0.06] rounded w-2/3 mb-2" />
      <div className="h-3 bg-[#E5E7EB] dark:bg-white/[0.06] rounded w-1/2" />
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border border-[#D1D5DB] dark:border-white/[0.06] bg-white dark:bg-[#13161F]/90 p-5 shadow-md dark:shadow-lg dark:shadow-black/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-[#9CA3AF]" />
          <span className="text-sm text-[#374151] dark:text-[#D1D5DB]">AI Insights unavailable</span>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  const config = STATUS_CONFIG[data.overallStatus] || STATUS_CONFIG.WARNING;
  const Icon = config.icon;
  const parsedAlerts = parseAlerts(data.summary);
  const briefSummary = extractBriefSummary(data.summary);

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm ${config.bg} ${config.border} shadow-md dark:shadow-lg dark:shadow-black/20`}>
      {/* Gradient header stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-env-teal via-cyan-400 to-blue-500 opacity-40" />
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ring-1 ring-white/[0.06] ${data.overallStatus === 'GOOD' ? 'bg-emerald-500/20' : data.overallStatus === 'CRITICAL' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#111827] dark:text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-env-teal inline-block" />Basin Status — {config.label}
            </h3>
            <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
              Powered by WQIS AI Agent
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
            {data.checkedAt ? timeAgo(data.checkedAt) : ''}
          </span>
          <button
            onClick={fetchData}
            className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600 font-medium"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Alerts Grid */}
      {parsedAlerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
          {parsedAlerts.map((alert, i) => (
            <div
              key={i}
              className={`rounded-xl p-3 border ${
                alert.severity.includes('CRITICAL')
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30'
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase ${
                  alert.severity.includes('CRITICAL') ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {alert.severity.includes('CRITICAL') ? 'CRITICAL' : 'WARNING'}
                </span>
                <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">{alert.station}</span>
              </div>
              <div className="text-xs font-medium text-[#111827] dark:text-[#E5E7EB]">
                {alert.parameter}
              </div>
              <div className="text-[11px] text-[#374151] dark:text-[#D1D5DB] mt-0.5">
                {alert.value} — {alert.threshold}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Brief Summary */}
      {briefSummary && (
        <p className="text-xs text-[#374151] dark:text-[#D1D5DB] leading-relaxed">
          {briefSummary}
        </p>
      )}
    </div>
  );
}
