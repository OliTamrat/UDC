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
    const now = new Date().toISOString();
    const { text } = await sendWqisMessage(
      `Current date and time: ${now}. Analyze station ${stationId}: get the MOST RECENT readings (today or within the last 24 hours), analyze parameter trends over the last 7 days, check EPA compliance, and provide a health narrative. IMPORTANT: Do NOT use markdown formatting — no #, ##, ###, ####, no asterisks for bold, no bullet symbols. Write in plain flowing paragraphs with numbered lists where needed. Structure your response as: 1) Latest Readings Summary (with the actual date/time of the readings), 2) Trend Analysis (last 7 days), 3) EPA Compliance Status, 4) Overall Health Assessment.`
    );
    return NextResponse.json({ stationId, analysis: text, analyzedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof WqisClientError ? err.message : 'Failed to analyze station' }, { status: 503 });
  }
}
