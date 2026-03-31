'use client';
import { useEffect, useState, useCallback } from 'react';

type Status = 'GOOD' | 'WARNING' | 'POOR' | 'CRITICAL';
interface Alert { station: string; stationName: string; parameter: string; value: number; threshold: number; severity: 'WARNING' | 'CRITICAL'; }
interface Insights { overallStatus: Status; alerts: Alert[]; summary: string; checkedAt: string; }

const STATUS: Record<Status, { label: string; classes: string; dot: string }> = {
  GOOD:     { label: 'All Clear', classes: 'bg-emerald-100 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500' },
  WARNING:  { label: 'Warning',   classes: 'bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800',         dot: 'bg-amber-500'  },
  POOR:     { label: 'Poor',      classes: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',     dot: 'bg-orange-500' },
  CRITICAL: { label: 'Critical',  classes: 'bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-800',                dot: 'bg-red-500'    },
};
const BADGE: Record<string, string> = {
  WARNING:  'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
}

export function WqisInsightsPanel() {
  const [data, setData]       = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/wqis/insights');
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load insights'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  if (loading) return (
    <div className="rounded-lg border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#22272B] p-4 animate-pulse">
      <div className="h-4 bg-[#E5E7EB] dark:bg-[#374151] rounded w-1/3 mb-3" />
      <div className="h-3 bg-[#E5E7EB] dark:bg-[#374151] rounded w-2/3 mb-2" />
      <div className="h-3 bg-[#E5E7EB] dark:bg-[#374151] rounded w-1/2" />
    </div>
  );

  if (error) return (
    <div className="rounded-lg border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#22272B] p-4 flex items-center justify-between">
      <span className="text-sm text-[#374151] dark:text-[#D1D5DB]">WQIS Insights unavailable: {error}</span>
      <button onClick={fetch_} className="text-xs text-[#374151] hover:text-[#374151] dark:hover:text-[#E5E7EB] underline ml-3">Retry</button>
    </div>
  );

  if (!data) return null;
  const s = STATUS[data.overallStatus];
  return (
    <div className={`rounded-lg border p-4 ${s.classes}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
          <span className="text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">Basin Status — {s.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#374151] dark:text-[#D1D5DB]">Updated {timeAgo(data.checkedAt)}</span>
          <button onClick={fetch_} className="text-xs text-[#374151] hover:text-[#374151] dark:hover:text-[#E5E7EB] underline">Refresh</button>
        </div>
      </div>
      {data.alerts.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {data.alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-white/60 dark:bg-black/20 rounded-md px-3 py-1.5">
              <span className={`rounded px-1.5 py-0.5 font-medium ${BADGE[a.severity]}`}>{a.severity}</span>
              <span className="text-[#374151] dark:text-[#E5E7EB] font-medium">{a.stationName || a.station}</span>
              <span className="text-[#374151] dark:text-[#D1D5DB]">{a.parameter.replace(/_/g,' ')}: {a.value} (threshold {a.threshold})</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-[#1F2937] dark:text-[#D1D5DB] leading-relaxed line-clamp-3">{data.summary}</p>
    </div>
  );
}
