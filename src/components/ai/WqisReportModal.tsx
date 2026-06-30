'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { FileText, Clock, Copy, Check, Printer, X, RefreshCw, Download, Droplets, Shield, Activity } from 'lucide-react';
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

function RenderReport({ text, isDark }: { text: string; isDark: boolean }) {
  return (
    <div className="report-content space-y-3 text-[14px] leading-[1.75]" style={{ color: isDark ? '#D1D5DB' : '#1F2937' }}>
      {text.split('\n').map((line, i) => {
        const trimmed = line.trimStart();

        // Section headings (numbered: "1) ...", "1. ...", or markdown "## ...")
        const sectionMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);

        if (headingMatch) {
          const level = headingMatch[1].length;
          const content = headingMatch[2];
          if (level <= 2) return (
            <h2 key={i} className="report-section-heading" style={{
              fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em',
              color: isDark ? '#F3F4F6' : '#002B5C',
              borderBottom: `2px solid ${isDark ? 'rgba(20,184,166,0.3)' : '#0D9488'}`,
              paddingBottom: '6px', marginTop: i === 0 ? 0 : '24px',
            }}><InlineMarkdown text={content} /></h2>
          );
          return (
            <h3 key={i} style={{
              fontSize: '14px', fontWeight: 600,
              color: isDark ? '#E5E7EB' : '#1F2937',
              marginTop: '16px',
            }}><InlineMarkdown text={content} /></h3>
          );
        }

        if (sectionMatch) return (
          <h2 key={i} className="report-section-heading" style={{
            fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em',
            color: isDark ? '#F3F4F6' : '#002B5C',
            borderBottom: `2px solid ${isDark ? 'rgba(20,184,166,0.3)' : '#0D9488'}`,
            paddingBottom: '6px', marginTop: i === 0 ? 0 : '24px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ color: '#0D9488', fontWeight: 800 }}>{sectionMatch[1]}.</span>
            <InlineMarkdown text={sectionMatch[2]} />
          </h2>
        );

        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* '))
          return (
            <li key={i} style={{
              marginLeft: '20px', listStyleType: 'disc',
              lineHeight: 1.75, paddingLeft: '4px',
            }}><InlineMarkdown text={trimmed.slice(2)} /></li>
          );

        if (trimmed === '') return <div key={i} style={{ height: '8px' }} />;

        return (
          <p key={i} style={{ lineHeight: 1.75, textAlign: 'justify' }}>
            <InlineMarkdown text={line} />
          </p>
        );
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
  const reportRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? 'Weekly';
  const reportPeriodLabel = report ? (PERIODS.find(p => p.key === report.period)?.label ?? 'Weekly') : periodLabel;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm print:hidden" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-2 sm:inset-auto sm:top-[3vh] sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-3xl sm:max-h-[94vh] z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl print:fixed print:inset-0 print:max-w-none print:max-h-none print:rounded-none print:shadow-none"
        style={{ background: isDark ? '#1A1D23' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'}` }}>

        {/* Header — UDC branded */}
        <div className="relative px-6 py-5 print:px-0 print:py-0 print:hidden" style={{
          background: isDark
            ? 'linear-gradient(135deg, #002B5C, #0F2027, #1A1D23)'
            : 'linear-gradient(135deg, #002B5C, #1E4D8C)',
        }}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors hover:bg-white/10 text-white/60 hover:text-white print:hidden" aria-label="Close">
            <X className="w-4 h-4" />
          </button>

          {/* Logo area */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: 'linear-gradient(135deg, #FDB927, #CE1141)' }}>
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Water Quality Intelligence Report</h2>
              <p className="text-xs text-white/60">UDC Water Resources Research Institute &middot; Anacostia River Basin</p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2">
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  period === p.key
                    ? 'bg-white/20 text-white border border-white/30 shadow-lg'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                }`}>
                <div className="font-semibold">{p.label}</div>
                <div className={`text-[10px] mt-0.5 ${period === p.key ? 'text-white/80' : 'text-white/40'}`}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div className={`px-6 py-3 border-b print:hidden ${isDark ? 'border-white/[0.06]' : 'border-[#E5E7EB]'}`}>
          <button onClick={generate} disabled={loading}
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            style={{ background: loading ? '#0D9488' : 'linear-gradient(135deg, #0D9488, #14B8A6)', boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing basin data with Gemini 2.5...
              </>
            ) : report ? (
              <><RefreshCw className="w-4 h-4" />Regenerate Report</>
            ) : (
              <><Activity className="w-4 h-4" />Generate AI Analysis</>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" ref={reportRef}>
          {!report && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-52 gap-4 px-6">
              <div className="relative">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-[#F0FDFA]'}`}>
                  <FileText className={`w-8 h-8 ${isDark ? 'text-white/15' : 'text-[#0D9488]/30'}`} />
                </div>
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>Select a period and generate your report</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#4B5563]' : 'text-[#9CA3AF]'}`}>AI-powered analysis of real USGS/EPA sensor data with compliance checks</p>
              </div>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { icon: Shield, label: 'EPA Compliance', color: '#22C55E' },
                  { icon: Activity, label: 'Trend Analysis', color: '#3B82F6' },
                  { icon: Droplets, label: 'Water Quality', color: '#06B6D4' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3" style={{ color }} />
                    <span className={`text-[10px] ${isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-52 gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-3 border-[#0D9488]/20 border-t-[#0D9488] rounded-full animate-spin" />
                <Droplets className="w-5 h-5 text-[#0D9488] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${isDark ? 'text-[#E5E7EB]' : 'text-[#374151]'}`}>Analyzing watershed data...</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>Querying stations, checking EPA thresholds, generating insights</p>
              </div>
            </div>
          )}

          {error && (
            <div className="px-6 py-5">
              <div className={`rounded-xl p-4 text-sm ${isDark ? 'bg-red-950/30 border border-red-800/50 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                <p className="font-medium mb-1">Report generation failed</p>
                <p className="text-xs opacity-80">{error}</p>
                <button onClick={generate} className="mt-3 text-xs font-medium underline opacity-70 hover:opacity-100">Try again</button>
              </div>
            </div>
          )}

          {report && !loading && (
            <div className="print-report-area">
              {/* Print-only letterhead */}
              <div className="hidden print:block print-letterhead" style={{ borderBottom: '3px solid #002B5C', paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#002B5C', letterSpacing: '-0.02em' }}>
                      Water Quality Intelligence Report
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      UDC Water Resources Research Institute (WRRI) &middot; College of Agriculture, Urban Sustainability &amp; Environmental Sciences (CAUSES)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#002B5C' }}>{reportPeriodLabel} Report</div>
                    <div style={{ fontSize: '10px', color: '#6B7280' }}>{new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                </div>
              </div>

              {/* Screen-only timestamp */}
              <div className={`flex items-center gap-2 px-8 pt-6 pb-2 text-xs print:hidden ${isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>Generated {new Date(report.generatedAt).toLocaleString()}</span>
                <span className={`mx-1 ${isDark ? 'text-[#374151]' : 'text-[#D1D5DB]'}`}>|</span>
                <span>{reportPeriodLabel} Analysis</span>
                <span className={`mx-1 ${isDark ? 'text-[#374151]' : 'text-[#D1D5DB]'}`}>|</span>
                <span>Anacostia River Basin</span>
              </div>

              {/* Report body */}
              <div className="px-8 py-5 print:px-0 print:py-0">
                <RenderReport text={report.report} isDark={isDark} />
              </div>

              {/* Print-only footer */}
              <div className="hidden print:block print-footer" style={{
                borderTop: '2px solid #E5E7EB', paddingTop: '10px', marginTop: '30px',
                fontSize: '9px', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between',
              }}>
                <span>Data Sources: USGS NWIS, EPA Water Quality Portal | AI Analysis: Gemini 2.5 Flash</span>
                <span>UDC WQIS &middot; Confidential</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {report && !loading && (
          <div className={`flex items-center gap-2 px-6 py-3 border-t print:hidden ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-[#E5E7EB] bg-[#FAFAFA]'}`}>
            <button onClick={copy}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${isDark ? 'border-white/[0.06] text-[#D1D5DB] hover:bg-white/5' : 'border-[#E5E7EB] text-[#374151] hover:bg-white'}`}>
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
            </button>
            <button onClick={handlePrint}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${isDark ? 'border-white/[0.06] text-[#D1D5DB] hover:bg-white/5' : 'border-[#E5E7EB] text-[#374151] hover:bg-white'}`}>
              <Printer className="w-3.5 h-3.5" />Print
            </button>
            <button onClick={handlePrint}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${isDark ? 'border-white/[0.06] text-[#D1D5DB] hover:bg-white/5' : 'border-[#E5E7EB] text-[#374151] hover:bg-white'}`}>
              <Download className="w-3.5 h-3.5" />Save PDF
            </button>
            <div className={`ml-auto flex items-center gap-2 text-[10px] ${isDark ? 'text-[#4B5563]' : 'text-[#D1D5DB]'}`}>
              <Shield className="w-3 h-3" />
              USGS NWIS &middot; Gemini 2.5 Flash
            </div>
          </div>
        )}
      </div>
    </>
  );
}
