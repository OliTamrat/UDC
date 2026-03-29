'use client';
import { useState, useEffect, useCallback } from 'react';

interface AnalysisData { stationId: string; analysis: string; analyzedAt: string; }
interface Props { stationId: string; stationName?: string; onClose: () => void; }

function Lines({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('# '))  return <h2 key={i} className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-4 first:mt-0">{line.slice(2)}</h2>;
        if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-3">{line.slice(3)}</h3>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="ml-4 list-disc leading-relaxed">{line.slice(2)}</li>;
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} className="leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

export function WqisStationAnalysis({ stationId, stationName, onClose }: Props) {
  const [data, setData]       = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const analyze = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/wqis/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stationId }) });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : 'Analysis failed'); }
    finally { setLoading(false); }
  }, [stationId]);

  useEffect(() => { analyze(); }, [analyze]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />
      <div role="dialog" aria-label={`AI Analysis — ${stationName ?? stationId}`}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg flex flex-col bg-white dark:bg-[#22272B] border-l border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Station Analysis</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stationName ?? stationId} · WQIS Agent</p>
          </div>
          <div className="flex items-center gap-2">
            {data && <button onClick={analyze} disabled={loading} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline disabled:opacity-40">Refresh</button>}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl px-1" aria-label="Close">×</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-6 h-6 border-2 border-[#1C8C7D] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">WQIS agent analyzing {stationName ?? stationId}…</p>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">{error}</p>
              <button onClick={analyze} className="text-xs text-red-600 dark:text-red-400 underline">Try again</button>
            </div>
          )}
          {data && !loading && (
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Analyzed {new Date(data.analyzedAt).toLocaleString()}</p>
              <Lines text={data.analysis} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
