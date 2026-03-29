import { NextRequest, NextResponse } from 'next/server';
import { sendWqisMessage, isWqisConfigured, WqisClientError } from '@/lib/wqis-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Period = '7d' | '30d' | '90d';
const LABELS: Record<Period, string> = { '7d': 'weekly', '30d': 'monthly', '90d': 'quarterly' };

export async function POST(req: NextRequest) {
  if (!isWqisConfigured()) return NextResponse.json({ error: 'WQIS agent not configured.' }, { status: 503 });
  let period: Period = '7d';
  try { const b = await req.json(); if (['7d','30d','90d'].includes(b.period)) period = b.period; } catch { /* use default */ }
  try {
    const { text } = await sendWqisMessage(
      `Generate a comprehensive ${LABELS[period]} water quality report for the Anacostia River Basin. Include: executive summary, overall basin health status, active EPA threshold violations, parameter trends per station, recommendations, and next steps.`
    );
    return NextResponse.json({ period, report: text, generatedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof WqisClientError ? err.message : 'Failed to generate report' }, { status: 503 });
  }
}
