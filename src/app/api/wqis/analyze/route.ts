import { NextRequest, NextResponse } from 'next/server';
import { sendWqisMessage, isWqisConfigured, WqisClientError } from '@/lib/wqis-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!isWqisConfigured()) return NextResponse.json({ error: 'WQIS agent not configured.' }, { status: 503 });
  let stationId: string;
  try { const b = await req.json(); stationId = b.stationId; } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }
  if (!stationId?.trim()) return NextResponse.json({ error: 'stationId is required' }, { status: 400 });
  try {
    const { text } = await sendWqisMessage(
      `Analyze station ${stationId}: get latest readings, analyze parameter trends, check EPA compliance, and provide an AI-generated health narrative. Structure: latest readings summary, trend analysis, EPA compliance status, overall health assessment.`
    );
    return NextResponse.json({ stationId, analysis: text, analyzedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof WqisClientError ? err.message : 'Failed to analyze station' }, { status: 503 });
  }
}
