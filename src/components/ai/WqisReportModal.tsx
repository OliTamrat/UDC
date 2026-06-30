'use client';
import { useState, useCallback, useEffect } from 'react';
import { FileText, Clock, Copy, Check, Printer, X, RefreshCw } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

type Period = '7d' | '30d' | '90d';
const PERIODS: { key: Period; label: string; desc: string }[] = [
  { key: '7d', label: 'Weekly', desc: 'Last 7 days' },
  { key: '30d', label: 'Monthly', desc: 'Last 30 days' },
  { key: '90d', label: 'Quarterly', desc: 'Last 90 days' },
];

interface ReportData { period: Period; report: string; generatedAt: string; }
interface Props { onClose: () => void; }

function InlineMarkdown({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
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

function RenderReport({ text }: { text: string }) {
  return (
    <div className="space-y-2.5 text-[13px] leading-relaxed text-[#374151] dark:text-[#E5E7EB]">
      {text.split('\n').map((line, i) => {
        const trimmed = line.trimStart();
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const content = headingMatch[2];
          if (level <= 2) return <h2 key={i} className="text-base font-bold text-[#111827] dark:text-[#F3F4F6] mt-5 first:mt-0"><InlineMarkdown text={content} /></h2>;
          return <h3 key={i} className="text-sm font-semibold text-[#1F2937] dark:text-[#E5E7EB] mt-4"><InlineMarkdown text={content} /></h3>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* '))
          return <li key={i} className="ml-5 list-disc leading-relaxed"><InlineMarkdown text={trimmed.slice(2)} /></li>;
        // Numbered list items
        const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
        if (numMatch)
          return <div key={i} className="flex gap-2 ml-1"><span className="text-[#1C8C7D] dark:text-[#2DD4BF] font-bold flex-shrink-0">{numMatch[1]}.</span><span><InlineMarkdown text={numMatch[2]} /></span></div>;
        if (trimmed === '') return <div key={i} className="h-2" />;
        return <p key={i} className="leading-relaxed"><InlineMarkdown text={line} /></p>;
      })}
    </div>
  );
}

export function WqisReportModal({ onClose }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [period, setPeriod] = useState<Period>('7d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

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
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 sm:inset-auto sm:top-[5vh] sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl sm:max-h-[90vh] z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: isDark ? '#1A1D23' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'}` }}>

        {/* Header with gradient */}
        <div className="relative px-6 py-5" style={{ background: isDark ? 'linear-gradient(135deg, #0F2027, #1A1D23)' : 'linear-gradient(135deg, #F0FDFA, #ECFDF5)' }}>
          <button onClick={onClose} className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-[#9CA3AF]' : 'hover:bg-black/5 text-[#6B7280]'}`} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl" style={{ background: isDark ? 'rgba(29,197,156,0.15)' : 'rgba(13,148,136,0.1)' }}>
              <FileText className="w-5 h-5 text-[#1C8C7D]" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>Water Quality Report</h2>
              <p className={`text-xs ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>Anacostia River Basin · AI-Generated Analysis</p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2">
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  period === p.key
                    ? 'bg-[#1C8C7D] text-white shadow-lg shadow-[#1C8C7D]/20'
                    : isDark
                      ? 'bg-white/5 text-[#D1D5DB] hover:bg-white/10 border border-white/[0.06]'
                      : 'bg-white text-[#374151] hover:bg-[#F0F1F3] border border-[#E5E7EB]'
                }`}>
                <div className="font-semibold">{p.label}</div>
                <div className={`text-[10px] mt-0.5 ${period === p.key ? 'text-white/70' : isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div className={`px-6 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E5E7EB]'}`}>
          <button onClick={generate} disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#1C8C7D] hover:bg-[#177a6c] text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing basin data...
              </>
            ) : report ? (
              <><RefreshCw className="w-4 h-4" />Regenerate Report</>
            ) : (
              <><FileText className="w-4 h-4" />Generate Report</>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!report && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <FileText className={`w-10 h-10 ${isDark ? 'text-white/10' : 'text-[#E5E7EB]'}`} />
              <p className={`text-sm ${isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>Select a period and generate your report</p>
              <p className={`text-xs ${isDark ? 'text-[#374151]' : 'text-[#D1D5DB]'}`}>Reports analyze real USGS sensor data with EPA compliance checks</p>
            </div>
          )}

          {error && (
            <div className={`rounded-xl p-4 text-sm ${isDark ? 'bg-red-950/30 border border-red-800 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              <p className="font-medium mb-1">Report generation failed</p>
              <p className="text-xs opacity-80">{error}</p>
              <button onClick={generate} className="mt-2 text-xs underline opacity-70 hover:opacity-100">Try again</button>
            </div>
          )}

          {report && !loading && (
            <div>
              <div className={`flex items-center gap-2 mb-4 text-xs ${isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                <Clock className="w-3 h-3" />
                Generated {new Date(report.generatedAt).toLocaleString()} · {PERIODS.find(p => p.key === report.period)?.label} report
              </div>
              <RenderReport text={report.report} />
            </div>
          )}
        </div>

        {/* Footer actions */}
        {report && !loading && (
          <div className={`flex items-center gap-2 px-6 py-3 border-t ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-[#E5E7EB] bg-[#FAFAFA]'}`}>
            <button onClick={copy}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-white/[0.06] text-[#D1D5DB] hover:bg-white/5' : 'border-[#E5E7EB] text-[#374151] hover:bg-white'}`}>
              {copied ? <><Check className="w-3 h-3 text-emerald-500" />Copied</> : <><Copy className="w-3 h-3" />Copy text</>}
            </button>
            <button onClick={() => window.print()}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-white/[0.06] text-[#D1D5DB] hover:bg-white/5' : 'border-[#E5E7EB] text-[#374151] hover:bg-white'}`}>
              <Printer className="w-3 h-3" />Print
            </button>
            <span className={`ml-auto text-[10px] ${isDark ? 'text-[#374151]' : 'text-[#D1D5DB]'}`}>
              Source: USGS NWIS · Gemini 2.5 Flash
            </span>
          </div>
        )}
      </div>
    </>
  );
}
