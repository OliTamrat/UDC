/**
 * The one place admin access is decided.
 *
 * This check used to be copy-pasted into five route files. Duplicated auth drifts
 * — one copy gets a fix and the others quietly do not — so every admin route now
 * calls this instead.
 *
 * Two credentials are accepted during the migration to per-person accounts:
 *
 *   1. A session cookie from a named account. This is the real mechanism.
 *   2. The legacy shared ADMIN_API_KEY bearer token.
 *
 * (2) exists only so the switch does not lock a live system out of its own admin
 * panel in a single deploy. It should be removed — and the env var deleted —
 * once WRRI staff have signed in with their own accounts. Until then, requests
 * authenticated that way are attributed to "shared-key", which is exactly the
 * absence of an audit trail that per-person accounts fix.
 */

import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE, resolveSession, type AdminUser } from "@/lib/admin-auth";

export interface AdminPrincipal {
  /** null when authenticated by the legacy shared key. */
  user: AdminUser | null;
  /** For audit fields: an email, or "shared-key". */
  label: string;
  viaSharedKey: boolean;
}

export type AdminAuthResult =
  | { ok: true; principal: AdminPrincipal }
  | { ok: false; response: NextResponse };

export async function authenticateAdmin(request: NextRequest): Promise<AdminAuthResult> {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await resolveSession(sessionToken);
  if (user) {
    return { ok: true, principal: { user, label: user.email, viaSharedKey: false } };
  }

  const adminKey = process.env.ADMIN_API_KEY?.trim();

  // With neither mechanism configured, production must fail closed rather than
  // fall through to an open admin panel.
  if (!adminKey && process.env.NODE_ENV === "production") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Admin access is not configured." },
        { status: 503 },
      ),
    };
  }

  if (adminKey) {
    const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (bearer === adminKey) {
      return {
        ok: true,
        principal: { user: null, label: "shared-key", viaSharedKey: true },
      };
    }
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Development with nothing configured: open, as before.
  return { ok: true, principal: { user: null, label: "dev", viaSharedKey: false } };
}

/**
 * Guard for routes that only need "is this an admin?".
 * Returns a response to send, or null to proceed.
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const result = await authenticateAdmin(request);
  return result.ok ? null : result.response;
}

/**
 * Guard for routes that manage accounts.
 *
 * Restricted to the "owner" role, and deliberately closed to the shared key: a
 * credential that identifies nobody must not be able to mint credentials that
 * identify someone.
 */
export async function requireOwner(request: NextRequest): Promise<
  { ok: true; principal: AdminPrincipal } | { ok: false; response: NextResponse }
> {
  const result = await authenticateAdmin(request);
  if (!result.ok) return result;

  const { principal } = result;
  if (!principal.user || principal.user.role !== "owner") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Managing accounts requires signing in as an owner." },
        { status: 403 },
      ),
    };
  }
  return { ok: true, principal };
}
