import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, type RateLimitConfig } from "@/lib/rate-limit";

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
 *     replicas. The Container App scales to maxReplicas=3, so the EFFECTIVE
 *     ceiling is up to 3x the number configured here - confirmed in production,
 *     where concurrent /wqis/report calls were served by more than one replica.
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
