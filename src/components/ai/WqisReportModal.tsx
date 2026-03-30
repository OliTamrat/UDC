'use client';
import { useState, useCallback } from 'react';

type Period = '7d' | '30d' | '90d';
const LABELS: Record<Period, string> = { '7d': 'Weekly', '30d': 'Monthly', '90d': 'Quarterly' };
interface ReportData { period: Period; report: string; generatedAt: string; }
interface Props { onClose: () => void; }

function Lines({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm text-[#374151] dark:text-[#E5E7EB]">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('# '))  return <h2 key={i} className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6] mt-4">{line.slice(2)}</h2>;
        if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-semibold text-[#1F2937] dark:text-[#E5E7EB] mt-3">{line.slice(3)}</h3>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} className="leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

export function WqisReportModal({ onClose }: Props) {
  const [period, setPeriod]   = useState<Period>('7d');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [report, setReport]   = useState<ReportData | null>(null);
  const [copied, setCopied]   = useState(false);

  const generate = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/wqis/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ period }) });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      setReport(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to generate report'); }
    finally { setLoading(false); }
  }, [period]);

  const copy = useCallback(async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report.report);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, [report]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-[#22272B] border border-[#E5E7EB] dark:border-[#374151] shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-[#374151]">
          <div>
            <h2 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">Water Quality Report</h2>
            <p className="text-xs text-[#6B7280] dark:text-[#D1D5DB] mt-0.5">Powered by WQIS AI Agent · Anacostia River Basin</p>
          </div>
          <button onClick={onClose} className="text-[#D1D5DB] hover:text-[#4B5563] dark:hover:text-[#E5E7EB] text-xl px-1" aria-label="Close">×</button>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 border-b border-[#E5E7EB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#1B1F23]">
          <span className="text-xs text-[#6B7280] dark:text-[#D1D5DB]">Period</span>
          {(Object.keys(LABELS) as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1 rounded-md border transition-colors ${period === p ? 'bg-[#1C8C7D] text-white border-[#1C8C7D]' : 'border-[#E5E7EB] dark:border-[#374151] text-[#4B5563] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937]'}`}>
              {LABELS[p]}
            </button>
          ))}
          <button onClick={generate} disabled={loading}
            className="ml-auto text-xs px-4 py-1.5 rounded-md bg-[#1C8C7D] hover:bg-[#177a6c] text-white font-medium disabled:opacity-50 transition-colors">
            {loading ? 'Generating…' : report ? 'Regenerate' : 'Generate Report'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!report && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-40 text-[#D1D5DB] dark:text-[#6B7280]">
              <span className="text-3xl mb-2">📊</span>
              <p className="text-sm">Select a period and click Generate Report</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-6 h-6 border-2 border-[#1C8C7D] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#6B7280] dark:text-[#D1D5DB]">WQIS agent is analyzing basin data…</p>
            </div>
          )}
          {error && <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">{error}</div>}
          {report && !loading && (
            <div>
              <p className="text-xs text-[#D1D5DB] dark:text-[#6B7280] mb-4">Generated {new Date(report.generatedAt).toLocaleString()} · {LABELS[report.period]} report</p>
              <Lines text={report.report} />
            </div>
          )}
        </div>
        {report && (
          <div className="flex items-center gap-2 px-6 py-3 border-t border-[#E5E7EB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#1B1F23]">
            <button onClick={copy} className="text-xs px-3 py-1.5 rounded-md border border-[#E5E7EB] dark:border-[#374151] text-[#4B5563] dark:text-[#D1D5DB] hover:bg-white dark:hover:bg-[#1F2937] transition-colors">{copied ? '✓ Copied' : 'Copy text'}</button>
            <button onClick={() => window.print()} className="text-xs px-3 py-1.5 rounded-md border border-[#E5E7EB] dark:border-[#374151] text-[#4B5563] dark:text-[#D1D5DB] hover:bg-white dark:hover:bg-[#1F2937] transition-colors">Download / Print</button>
          </div>
        )}
      </div>
    </div>
  );
}
