const WQIS_AGENT_URL = process.env.WQIS_AGENT_URL ?? process.env.NEXT_PUBLIC_WQIS_AGENT_URL ?? 'http://localhost:8001';
const WQIS_APP_ID    = process.env.WQIS_AGENT_APP_ID ?? 'wqis_agent';
const WQIS_USER_ID   = process.env.WQIS_AGENT_USER_ID ?? 'dashboard-user';

export interface WqisEvent {
  id?:        string;
  author?:    string;
  timestamp?: number;
  content?: {
    parts?: { text?: string }[];
    role?:  string;
  };
  actions?: Record<string, unknown>;
  usageMetadata?: Record<string, unknown>;
}

export interface WqisResponse {
  text:   string;
  events: WqisEvent[];
}

export class WqisClientError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'WqisClientError';
  }
}

export async function createWqisSession(): Promise<string> {
  let res: Response;
  try {
    res = await fetch(
      `${WQIS_AGENT_URL}/apps/${WQIS_APP_ID}/users/${WQIS_USER_ID}/sessions`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
    );
  } catch (err) {
    throw new WqisClientError('WQIS agent unreachable', err);
  }
  if (!res.ok) throw new WqisClientError(`Session creation failed: ${res.status}`);
  const data = await res.json();
  const sessionId: string = data.id ?? data.session_id ?? data.sessionId;
  if (!sessionId) throw new WqisClientError('ADK did not return a session ID');
  return sessionId;
}

export async function sendWqisMessage(message: string, sessionId?: string): Promise<WqisResponse> {
  const sid = sessionId ?? (await createWqisSession());
  let res: Response;
  try {
    res = await fetch(`${WQIS_AGENT_URL}/run`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName:    WQIS_APP_ID,
        userId:     WQIS_USER_ID,
        sessionId:  sid,
        newMessage: { role: 'user', parts: [{ text: message }] },
      }),
    });
  } catch (err) {
    throw new WqisClientError('WQIS agent unreachable', err);
  }
  if (!res.ok) throw new WqisClientError(`WQIS run failed: ${res.status}`);
  const events: WqisEvent[] = await res.json();
  return { text: extractTextFromEvents(events), events };
}

export async function* streamWqisMessage(message: string, sessionId?: string): AsyncGenerator<string> {
  const sid = sessionId ?? (await createWqisSession());
  let res: Response;
  try {
    res = await fetch(`${WQIS_AGENT_URL}/run_sse`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName:    WQIS_APP_ID,
        userId:     WQIS_USER_ID,
        sessionId:  sid,
        newMessage: { role: 'user', parts: [{ text: message }] },
        streaming:  true,
      }),
    });
  } catch (err) {
    throw new WqisClientError('WQIS agent unreachable', err);
  }
  if (!res.ok) throw new WqisClientError(`WQIS SSE failed: ${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) throw new WqisClientError('No response body');
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const event: WqisEvent = JSON.parse(raw);
        const chunk = extractTextFromEvents([event]);
        if (chunk) yield chunk;
      } catch { /* skip non-JSON lines */ }
    }
  }
}

export function extractTextFromEvents(events: WqisEvent[]): string {
  return events
    .filter(e => e.content?.role === 'model' && Array.isArray(e.content?.parts))
    .flatMap(e => e.content!.parts ?? [])
    .map(p => p.text ?? '')
    .join('')
    .trim();
}

export function isWqisConfigured(): boolean {
  return Boolean(process.env.WQIS_AGENT_URL);
}
