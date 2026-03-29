import { NextRequest, NextResponse } from 'next/server';
import { createWqisSession, streamWqisMessage, isWqisConfigured, WqisClientError } from '@/lib/wqis-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!isWqisConfigured()) {
    return NextResponse.json({ error: 'WQIS agent not configured. Set WQIS_AGENT_URL.' }, { status: 503 });
  }
  let body: { message: string; sessionId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }
  const { message, sessionId } = body;
  if (!message?.trim()) return NextResponse.json({ error: 'message is required' }, { status: 400 });
  let sid = sessionId;
  if (!sid) {
    try { sid = await createWqisSession(); }
    catch (err) {
      const msg = err instanceof WqisClientError ? err.message : 'Failed to connect to WQIS agent';
      return NextResponse.json({ error: msg }, { status: 503 });
    }
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'session', sessionId: sid })}\n\n`));
      try {
        for await (const chunk of streamWqisMessage(message, sid)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        const msg = err instanceof WqisClientError ? err.message : 'WQIS agent error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`));
      } finally { controller.close(); }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
}
