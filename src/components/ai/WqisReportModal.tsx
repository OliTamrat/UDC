'use client';
import { useState, useCallback, useEffect } from 'react';
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
        const sectionMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);

        if (headingMatch) {
          const level = headingMatch[1].length;
          const content = headingMatch[2];
          if (level <= 2) return (
            <h2 key={i} style={{
              fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em',
              color: isDark ? '#F3F4F6' : '#002B5C',
              borderBottom: `2px solid ${isDark ? 'rgba(20,184,166,0.3)' : '#0D9488'}`,
              paddingBottom: '6px', marginTop: i === 0 ? 0 : '24px',
            }}><InlineMarkdown text={content} /></h2>
          );
          return (
            <h3 key={i} style={{
              fontSize: '14px', fontWeight: 600,
              color: isDark ? '#E5E7EB' : '#1F2937', marginTop: '16px',
            }}><InlineMarkdown text={content} /></h3>
          );
        }

        if (sectionMatch) return (
          <h2 key={i} style={{
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
            <li key={i} style={{ marginLeft: '20px', listStyleType: 'disc', lineHeight: 1.75, paddingLeft: '4px' }}>
              <InlineMarkdown text={trimmed.slice(2)} />
            </li>
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

/** Convert raw report text to clean HTML for print/PDF */
function buildPrintHTML(text: string, periodLabel: string, generatedAt: string): string {
  const date = new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = new Date(generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Convert report text to HTML paragraphs
  const bodyHTML = text.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';

    // Inline bold/italic
    let html = trimmed
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Markdown headings
    const headingMatch = html.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      if (level <= 2) return `<h2>${content}</h2>`;
      return `<h3>${content}</h3>`;
    }

    // Numbered sections: "1) ..." or "1. ..."
    const sectionMatch = html.match(/^(\d+)[.)]\s+(.+)/);
    if (sectionMatch) return `<h2><span class="section-num">${sectionMatch[1]}.</span> ${sectionMatch[2]}</h2>`;

    // Bullet points
    if (html.startsWith('- ') || html.startsWith('* ') || html.startsWith('• '))
      return `<li>${html.slice(2)}</li>`;

    return `<p>${html}</p>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Water Quality Report - ${periodLabel} - ${date}</title>
<style>
  @page {
    size: letter;
    margin: 1in 1.15in;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', 'Georgia', serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #111;
  }

  /* === HEADER === */
  .header {
    text-align: center;
    border-bottom: 2px solid #002B5C;
    padding-bottom: 14px;
    margin-bottom: 24px;
  }
  .header .institution {
    font-size: 10pt;
    font-variant: small-caps;
    letter-spacing: 1.5px;
    color: #002B5C;
    margin-bottom: 2px;
  }
  .header .department {
    font-size: 9pt;
    color: #555;
    margin-bottom: 16px;
  }
  .header .title {
    font-size: 18pt;
    font-weight: bold;
    color: #002B5C;
    margin-bottom: 4px;
  }
  .header .subtitle {
    font-size: 11pt;
    color: #333;
  }
  .header .meta {
    font-size: 9.5pt;
    color: #666;
    margin-top: 10px;
  }

  /* === BODY === */
  h2 {
    font-size: 13pt;
    font-weight: bold;
    color: #002B5C;
    margin-top: 22px;
    margin-bottom: 8px;
    border-bottom: 1px solid #ccc;
    padding-bottom: 3px;
    page-break-after: avoid;
  }
  h2 .section-num {
    color: #002B5C;
  }
  h3 {
    font-size: 12pt;
    font-weight: bold;
    color: #333;
    margin-top: 16px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }
  p {
    text-align: justify;
    margin-bottom: 8px;
    orphans: 3;
    widows: 3;
  }
  li {
    margin-left: 24px;
    margin-bottom: 4px;
    list-style-type: disc;
  }
  strong { font-weight: bold; }
  em { font-style: italic; }

  /* === FOOTER === */
  .footer {
    margin-top: 36px;
    padding-top: 10px;
    border-top: 1px solid #ccc;
    font-size: 8.5pt;
    color: #888;
    display: flex;
    justify-content: space-between;
  }

  /* === DISCLAIMER === */
  .disclaimer {
    margin-top: 20px;
    padding: 10px 14px;
    border: 1px solid #ddd;
    background: #fafafa;
    font-size: 8.5pt;
    color: #777;
    line-height: 1.5;
  }
</style>
</head>
<body>

<div class="header">
  <div class="institution">University of the District of Columbia</div>
  <div class="department">Water Resources Research Institute (WRRI) &middot; College of Agriculture, Urban Sustainability &amp; Environmental Sciences (CAUSES)</div>
  <div class="title">${periodLabel} Water Quality Assessment Report</div>
  <div class="subtitle">Anacostia River Basin Monitoring Network</div>
  <div class="meta">${date} &middot; ${time} &middot; Report Period: ${periodLabel}</div>
</div>

${bodyHTML}

<div class="disclaimer">
  <strong>Methodology:</strong> This report was generated using real-time sensor data from the USGS National Water Information System (NWIS) and laboratory results from the EPA Water Quality Portal (WQP). Analysis performed by Gemini 2.5 Flash AI model against EPA water quality thresholds. E. coli measurements require laboratory analysis and may not be available from all stations.
</div>

<div class="footer">
  <span>Data: USGS NWIS &middot; EPA Water Quality Portal</span>
  <span>UDC WQIS &middot; ${date}</span>
</div>

</body>
</html>`;
}

export function WqisReportModal({ onClose }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [period, setPeriod] = useState<Period>('7d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [copied, setCopied] = useState(false);

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

  const openPrintWindow = useCallback(() => {
    if (!report) return;
    const pLabel = PERIODS.find(p => p.key === report.period)?.label ?? 'Weekly';
    const html = buildPrintHTML(report.report, pLabel, report.generatedAt);

    // Use a hidden iframe to print — avoids popup blockers and
    // ensures only the report prints (not the app behind the modal)
    const id = 'wqis-print-frame';
    let frame = document.getElementById(id) as HTMLIFrameElement | null;
    if (frame) frame.remove();

    frame = document.createElement('iframe');
    frame.id = id;
    frame.style.cssText = 'position:fixed;width:0;height:0;border:none;left:-9999px;top:-9999px;';
    document.body.appendChild(frame);

    const doc = frame.contentDocument || frame.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    // Wait for content to render, then trigger print on the iframe only
    setTimeout(() => {
      frame?.contentWindow?.print();
    }, 500);
  }, [report]);

  const reportPeriodLabel = report ? (PERIODS.find(p => p.key === report.period)?.label ?? 'Weekly') : (PERIODS.find(p => p.key === period)?.label ?? 'Weekly');

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-2 sm:inset-auto sm:top-[3vh] sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-3xl sm:max-h-[94vh] z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: isDark ? '#1A1D23' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'}` }}>

        {/* Header */}
        <div className="relative px-6 py-5" style={{
          background: isDark
            ? 'linear-gradient(135deg, #002B5C, #0F2027, #1A1D23)'
            : 'linear-gradient(135deg, #002B5C, #1E4D8C)',
        }}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors hover:bg-white/10 text-white/60 hover:text-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: 'linear-gradient(135deg, #FDB927, #CE1141)' }}>
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Water Quality Intelligence Report</h2>
              <p className="text-xs text-white/60">UDC Water Resources Research Institute &middot; Anacostia River Basin</p>
            </div>
          </div>
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
        <div className={`px-6 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E5E7EB]'}`}>
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
        <div className="flex-1 overflow-y-auto">
          {!report && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-52 gap-4 px-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-[#F0FDFA]'}`}>
                <FileText className={`w-8 h-8 ${isDark ? 'text-white/15' : 'text-[#0D9488]/30'}`} />
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
            <div>
              <div className={`flex items-center gap-2 px-8 pt-6 pb-2 text-xs ${isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>Generated {new Date(report.generatedAt).toLocaleString()}</span>
                <span className={`mx-1 ${isDark ? 'text-[#374151]' : 'text-[#D1D5DB]'}`}>|</span>
                <span>{reportPeriodLabel} Analysis</span>
                <span className={`mx-1 ${isDark ? 'text-[#374151]' : 'text-[#D1D5DB]'}`}>|</span>
                <span>Anacostia River Basin</span>
              </div>
              <div className="px-8 py-5">
                <RenderReport text={report.report} isDark={isDark} />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {report && !loading && (
          <div className={`flex items-center gap-2 px-6 py-3 border-t ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-[#E5E7EB] bg-[#FAFAFA]'}`}>
            <button onClick={copy}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${isDark ? 'border-white/[0.06] text-[#D1D5DB] hover:bg-white/5' : 'border-[#E5E7EB] text-[#374151] hover:bg-white'}`}>
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
            </button>
            <button onClick={openPrintWindow}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${isDark ? 'border-white/[0.06] text-[#D1D5DB] hover:bg-white/5' : 'border-[#E5E7EB] text-[#374151] hover:bg-white'}`}>
              <Printer className="w-3.5 h-3.5" />Print
            </button>
            <button onClick={openPrintWindow}
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
