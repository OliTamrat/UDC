import { NextResponse } from 'next/server';
import { sendWqisMessage, isWqisConfigured, WqisClientError } from '@/lib/wqis-client';

export const runtime = 'nodejs';

export interface WqisAlert {
  station: string; stationName: string; parameter: string;
  value: number; threshold: number; severity: 'WARNING' | 'CRITICAL';
}
export interface WqisInsightsResponse {
  overallStatus: 'GOOD' | 'WARNING' | 'POOR' | 'CRITICAL';
  alerts: WqisAlert[]; summary: string; checkedAt: string;
}

let cachedInsights: WqisInsightsResponse | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function parseInsights(text: string): WqisInsightsResponse {
  const lower = text.toLowerCase();
  let overallStatus: WqisInsightsResponse['overallStatus'] = 'GOOD';
  if (lower.includes('critical')) overallStatus = 'CRITICAL';
  else if (lower.includes('poor')) overallStatus = 'POOR';
  else if (lower.includes('warning')) overallStatus = 'WARNING';
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const p = JSON.parse(jsonMatch[1]);
      return { overallStatus: p.overallStatus ?? overallStatus, alerts: p.alerts ?? [], summary: p.summary ?? text, checkedAt: new Date().toISOString() };
    } catch { /* fall through */ }
  }
  return { overallStatus, alerts: [], summary: text, checkedAt: new Date().toISOString() };
}

export async function GET() {
  if (!isWqisConfigured()) return NextResponse.json({ error: 'WQIS agent not configured.' }, { status: 503 });
  if (cachedInsights && Date.now() < cacheExpiry) return NextResponse.json(cachedInsights);
  try {
    const { text } = await sendWqisMessage(
      'Check EPA thresholds for all stations and provide a structured summary of current water quality alerts. Include overall status (GOOD/WARNING/POOR/CRITICAL), active threshold violations, and a brief summary.'
    );
    const insights = parseInsights(text);
    cachedInsights = insights;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return NextResponse.json(insights);
  } catch (err) {
    const message = err instanceof WqisClientError ? err.message : 'Failed to fetch insights';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
