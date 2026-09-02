import { NextRequest, NextResponse } from "next/server";
import { getEmbedAncestors } from "@/config/embed.config";

// Simple in-memory rate limiter (per-IP, resets each window)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Clean up stale entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetTime) rateLimitMap.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS);

/**
 * Content-Security-Policy, built per-route.
 *
 * Every directive below is identical to the policy this app has always shipped;
 * the only thing that varies is `frame-ancestors`, which decides who may put the
 * page inside an iframe. The whole policy lives here rather than in
 * next.config.ts so exactly ONE Content-Security-Policy header is emitted — two
 * CSP headers are intersected by the browser, which would silently re-block the
 * embed no matter what this one says.
 */
function buildCsp(frameAncestors: string): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.live",
    "script-src-elem 'self' 'unsafe-inline' https://vercel.live https://*.vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://server.arcgisonline.com https://*.basemaps.cartocdn.com https://unpkg.com https://vercel.live https://*.vercel.live",
    "connect-src 'self' https://waterservices.usgs.gov https://www.waterqualitydata.us https://server.arcgisonline.com https://*.basemaps.cartocdn.com https://vercel.live https://*.vercel.live wss://ws-us3.pusher.com",
    "frame-src 'self' https://vercel.live https://*.vercel.live",
    `frame-ancestors ${frameAncestors}`,
  ].join("; ");
}

function isEmbedRoute(pathname: string): boolean {
  return pathname === "/embed" || pathname.startsWith("/embed/");
}

/**
 * Applies the security headers to every response.
 *
 * /embed is framable by the approved UDC hosts only. Everything else — the
 * standalone dashboard, /admin, the ingestion APIs — stays unframable, and
 * carries X-Frame-Options as a belt-and-braces fallback for user agents that
 * do not honour frame-ancestors. X-Frame-Options is deliberately NOT set on
 * /embed: it has no allow-list syntax, so any value there would block UDC.
 */
function applySecurityHeaders(response: NextResponse, pathname: string): void {
  if (isEmbedRoute(pathname)) {
    response.headers.set("Content-Security-Policy", buildCsp(getEmbedAncestors().join(" ")));
  } else {
    response.headers.set("Content-Security-Policy", buildCsp("'none'"));
    response.headers.set("X-Frame-Options", "DENY");
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    if (isRateLimited(ip)) {
      const limited = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
      applySecurityHeaders(limited, pathname);
      return limited;
    }
  }

  const response = NextResponse.next();

  // CORS headers for API routes
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "";
    const allowedOrigins = [
      "https://udc.edu",
      "https://www.udc.edu",
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean);

    // In development, allow localhost
    const isDev = process.env.NODE_ENV === "development";
    if (isDev || allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", isDev ? "*" : origin);
    }

    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  applySecurityHeaders(response, pathname);

  return response;
}

export const config = {
  // Every route except build assets, so page responses carry the security
  // headers too. Previously this was "/api/:path*", which is why the dashboard
  // pages never received HSTS.
  matcher: [
    "/((?!_next/static|_next/image|favicon.svg|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)",
  ],
};
