'use client';
import { useState, useEffect, useCallback } from 'react';

interface AnalysisData { stationId: string; analysis: string; analyzedAt: string; }
interface Props { stationId: string; stationName?: string; onClose: () => void; }

function InlineMarkdown({ text }: { text: string }) {
  // Convert inline **bold**, *italic*, and ***bold italic*** to React elements
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    // Match ***bold italic***, **bold**, or *italic* (in that priority order)
    const match = remaining.match(/(\*{3})(.+?)\1|(\*{2})(.+?)\3|(\*{1})(.+?)\5/);
    if (!match) { parts.push(remaining); break; }
    const idx = match.index!;
    if (idx > 0) parts.push(remaining.slice(0, idx));
    if (match[1] === '***') parts.push(<strong key={key++} className="font-semibold italic">{match[2]}</strong>);
    else if (match[3] === '**') parts.push(<strong key={key++} className="font-semibold">{match[4]}</strong>);
    else parts.push(<em key={key++}>{match[6]}</em>);
    remaining = remaining.slice(idx + match[0].length);
  }
  return <>{parts}</>;
}

function Lines({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm text-[#374151] dark:text-[#E5E7EB]">
      {text.split('\n').map((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith('# '))  return <h2 key={i} className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6] mt-4 first:mt-0"><InlineMarkdown text={trimmed.slice(2)} /></h2>;
        if (trimmed.startsWith('## ')) return <h3 key={i} className="text-sm font-semibold text-[#1F2937] dark:text-[#E5E7EB] mt-3"><InlineMarkdown text={trimmed.slice(3)} /></h3>;
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) return <li key={i} className="ml-4 list-disc leading-relaxed"><InlineMarkdown text={trimmed.slice(2)} /></li>;
        if (trimmed === '') return <div key={i} className="h-1" />;
        return <p key={i} className="leading-relaxed"><InlineMarkdown text={line} /></p>;
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
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg flex flex-col bg-white dark:bg-[#22272B] border-l border-[#D1D5DB] dark:border-[#374151] shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D1D5DB] dark:border-[#374151]">
          <div>
            <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">AI Station Analysis</h2>
            <p className="text-xs text-[#374151] dark:text-[#D1D5DB] mt-0.5">{stationName ?? stationId} · WQIS Agent</p>
          </div>
          <div className="flex items-center gap-2">
            {data && <button onClick={analyze} disabled={loading} className="text-xs text-[#374151] hover:text-[#374151] dark:hover:text-[#E5E7EB] underline disabled:opacity-40">Refresh</button>}
            <button onClick={onClose} className="text-[#D1D5DB] hover:text-[#1F2937] dark:hover:text-[#E5E7EB] text-xl px-1" aria-label="Close">×</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-6 h-6 border-2 border-[#1C8C7D] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#374151] dark:text-[#D1D5DB] text-center">WQIS agent analyzing {stationName ?? stationId}…</p>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-800 p-4">
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">{error}</p>
              <button onClick={analyze} className="text-xs text-red-600 dark:text-red-400 underline">Try again</button>
            </div>
          )}
          {data && !loading && (
            <div>
              <p className="text-xs text-[#D1D5DB] dark:text-[#374151] mb-4">Analyzed {new Date(data.analyzedAt).toLocaleString()}</p>
              <Lines text={data.analysis} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
