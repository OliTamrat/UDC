import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE, destroySession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  // Delete the server-side record too. Clearing only the cookie would leave a
  // valid session behind for anyone who had already captured the token.
  if (token) await destroySession(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
