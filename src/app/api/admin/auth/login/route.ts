import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE, ensureBootstrapAdmin, login } from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_MAX_AGE_SECONDS = 12 * 3600;

/**
 * Per-IP throttle, on top of the per-account lockout in admin-auth.
 *
 * The account lockout stops one account being ground down. This stops one source
 * spraying a common password across many accounts, which the per-account counter
 * would never notice because each account only sees a single failure.
 */
const LOGIN_RATE_LIMIT = { limit: 10, windowMs: 5 * 60_000 };

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const throttle = checkRateLimit(`admin-login:${clientIp(request)}`, LOGIN_RATE_LIMIT);
  if (!throttle.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait a few minutes." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((throttle.resetAt - Date.now()) / 1000))),
        },
      },
    );
  }

  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = String(body.email ?? "");
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Creates the first account only when none exists; a no-op every other time.
  await ensureBootstrapAdmin();

  const result = await login(email, password);

  if (!result.ok) {
    const message =
      result.reason === "locked"
        ? "Too many failed attempts. This account is locked for 15 minutes."
        : result.reason === "disabled"
          ? "This account has been disabled. Contact a WRRI owner."
          : "Email or password is incorrect.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      mustChangePassword: result.user.mustChangePassword,
    },
  });

  response.cookies.set(SESSION_COOKIE, result.token, {
    httpOnly: true, // keeps the token out of reach of any script on the page
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
