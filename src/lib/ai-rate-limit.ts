import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, type RateLimitConfig } from "@/lib/rate-limit";
import { consumeAiUnits, type AiRouteKind } from "@/lib/ai-budget";

/**
 * Shared guard for endpoints that spend AI tokens.
 *
 * /api/chat has had a burst limit since launch, but /api/wqis/analyze and
 * /api/wqis/report did not - both call Gemini and both were reachable by anyone
 * on the internet with no ceiling at all. That mattered less while the dashboard
 * was an unlinked URL; it matters now that it is framed on a public university
 * page.
 *
 * KNOWN LIMITATION - this is a per-IP, in-memory ceiling, which is a spend
 * ceiling and nothing more:
 *   - A whole UDC lecture hall behind campus NAT shares ONE bucket.
 *   - A student on mobile data gets a fresh bucket by cycling airplane mode.
 *   - The counter resets on every container restart and is not shared between
 *     replicas.
 *
 * It is deliberately not the per-student query quota WRRI wants. That needs
 * identity and durable storage - see docs/WQIS_LEVEL2_ACCESS_DESIGN.md.
 */
export function enforceAiRateLimit(
  req: NextRequest,
  bucket: string,
  config: RateLimitConfig,
): NextResponse | null {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const result = checkRateLimit(`${bucket}:${clientIp}`, config);
  if (result.allowed) return null;

  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));

  return NextResponse.json(
    { error: "Too many AI requests. Please wait a moment before trying again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}

/**
 * Second gate: the shared daily ceiling.
 *
 * `enforceAiRateLimit` above bounds one caller's rate. This bounds the whole
 * day's spend across every caller and every replica, which is the number that
 * shows up on the invoice. Call it after the burst check so a caller who is
 * already being throttled does not consume the shared allowance.
 */
export async function enforceAiDailyBudget(
  kind: AiRouteKind,
): Promise<NextResponse | null> {
  const { allowed, used, budget } = await consumeAiUnits(kind);
  if (allowed) return null;

  console.warn(`[ai-budget] daily ceiling reached: ${used}/${budget} units`);

  return NextResponse.json(
    {
      error:
        "The daily AI allowance for this service has been reached. " +
        "Dashboard data, charts and exports are unaffected. AI features return tomorrow (00:00 UTC).",
    },
    {
      status: 429,
      headers: { "Retry-After": String(secondsUntilUtcMidnight()) },
    },
  );
}

function secondsUntilUtcMidnight(now: Date = new Date()): number {
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((midnight - now.getTime()) / 1000));
}
