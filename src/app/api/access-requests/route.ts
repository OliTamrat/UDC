import { NextRequest, NextResponse } from "next/server";

import { ensureAccessRequestsTable, getDbClient } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyAccessRequest } from "@/lib/notify";
import {
  REQUEST_STATUSES,
  RETENTION_DAYS,
  validateAccessRequest,
  type RequestStatus,
} from "@/lib/access-requests";

export const runtime = "nodejs";

/**
 * POST — submit a Level 2 access request. Public.
 *
 * This creates no account and grants no access. It records that someone asked,
 * so WRRI has something to approve. See docs/WQIS_LEVEL2_ACCESS_DESIGN.md.
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // Public write endpoint, so it needs its own ceiling. Generous enough that a
  // shared campus IP submitting several genuine requests is never blocked.
  const limit = checkRateLimit(`access-request:${clientIp}`, {
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests submitted. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validateAccessRequest(body);
  if (!validation.ok || !validation.value) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.errors },
      { status: 400 },
    );
  }

  const input = validation.value;

  try {
    const db = await getDbClient();
    await ensureAccessRequestsTable(db);

    // Enforce retention opportunistically on write, so expired records fall out
    // without needing a scheduled job.
    await purgeExpiredRequests(db);

    const { rows } = await db.query(
      // Only the four fields the person typed. No IP, user agent or referrer is
      // recorded against the request - see the data-minimisation note in
      // src/lib/access-requests.ts.
      `INSERT INTO access_requests
         (name, email, affiliation, requester_role, purpose)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`,
      [
        input.name,
        input.email,
        input.affiliation,
        input.requesterRole,
        input.purpose,
      ],
    );

    const id = Number((rows[0] as { id: number | string }).id);

    // Fire-and-forget: a webhook outage must not lose the submission, which is
    // already committed above.
    void notifyAccessRequest(
      {
        id,
        name: input.name,
        email: input.email,
        affiliation: input.affiliation,
        requesterRole: input.requesterRole,
        purpose: input.purpose,
      },
      `${originOf(request)}/admin`,
    );

    return NextResponse.json({ id, status: "pending" }, { status: 201 });
  } catch (error) {
    console.error("[access-requests] insert failed", error);
    return NextResponse.json(
      {
        error: "Could not record the request. Please try again later.",
        // The SQLSTATE code only - never the message, which can quote row data.
        // Standard five-character codes (42P01 undefined_table, 42703
        // undefined_column, 23514 check_violation) leak nothing about the
        // database or its contents, and are the difference between diagnosing a
        // production failure in seconds and guessing at it.
        code: sqlStateOf(error),
      },
      { status: 500 },
    );
  }
}

/** Extracts a PostgreSQL SQLSTATE code, if the driver supplied one. */
function sqlStateOf(error: unknown): string | undefined {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && /^[0-9A-Z]{5}$/.test(code) ? code : undefined;
}

/**
 * GET — list requests for WRRI review. Admin only.
 *
 * Gated by the same shared ADMIN_API_KEY as the rest of /api/admin. That key is
 * a known weakness (one secret for all faculty, no per-person audit) and is
 * scheduled for replacement in Phase 13d — but these records carry names, email
 * addresses and stated research intent, so they must not be readable publicly in
 * the meantime.
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const statusParam = request.nextUrl.searchParams.get("status");
  const status = REQUEST_STATUSES.includes(statusParam as RequestStatus)
    ? (statusParam as RequestStatus)
    : null;

  try {
    const db = await getDbClient();
    await ensureAccessRequestsTable(db);
    const { rows } = status
      ? await db.query(
          `SELECT id, name, email, affiliation, requester_role, purpose,
                  status, decision_reason, created_at, reviewed_at, reviewed_by, review_note
             FROM access_requests WHERE status = ? ORDER BY created_at DESC LIMIT 500`,
          [status],
        )
      : await db.query(
          `SELECT id, name, email, affiliation, requester_role, purpose,
                  status, decision_reason, created_at, reviewed_at, reviewed_by, review_note
             FROM access_requests ORDER BY created_at DESC LIMIT 500`,
        );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[access-requests] list failed", error);
    return NextResponse.json({ error: "Could not load requests." }, { status: 500 });
  }
}

/**
 * Deletes requests past the retention window.
 *
 * Retention is a privacy control, not housekeeping: personal contact details
 * should not sit in the database indefinitely because nobody remembered to
 * clear them. Runs on submission so it needs no scheduled job.
 */
export async function purgeExpiredRequests(db: {
  query: (sql: string, params?: unknown[]) => Promise<{ changes?: number }>;
}): Promise<void> {
  try {
    await db.query(
      `DELETE FROM access_requests
        WHERE created_at < ?`,
      [new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString()],
    );
  } catch (error) {
    // Never let retention housekeeping fail a submission.
    console.error("[access-requests] purge failed", error);
  }
}

export function requireAdmin(request: NextRequest): NextResponse | null {
  const adminKey = process.env.ADMIN_API_KEY?.trim();

  if (!adminKey && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "ADMIN_API_KEY not configured. Admin access is disabled." },
      { status: 503 },
    );
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (adminKey && token !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function originOf(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || new URL(request.url).host;
  return `${proto}://${host}`;
}
