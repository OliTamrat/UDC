import { NextRequest, NextResponse } from "next/server";

import { getDbClient } from "@/lib/db";
import { requireAdmin } from "../route";
import {
  DECISION_REASONS,
  REQUEST_STATUSES,
  type DecisionReason,
  type RequestStatus,
} from "@/lib/access-requests";

export const runtime = "nodejs";

/**
 * PATCH — record WRRI's decision on an access request. Admin only.
 *
 * This marks the request approved or denied; it provisions nothing, because
 * there is nothing to provision until identity lands. Approval means "WRRI has
 * agreed to grant this person Level 2 access", and the record is what Phase 13c
 * reads when accounts become real.
 *
 * A decision REQUIRES a reason from the fixed DECISION_REASONS list. That is
 * the non-discrimination control: it forces every refusal onto a named,
 * comparable ground that describes the request rather than the requester, and
 * it makes the pattern of decisions auditable after the fact.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const id = parseId((await context.params).id);
  if (id === null) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const status = typeof raw.status === "string" ? raw.status : "";
  const decisionReason = typeof raw.decisionReason === "string" ? raw.decisionReason : "";
  const reviewedBy = typeof raw.reviewedBy === "string" ? raw.reviewedBy.trim().slice(0, 120) : "";
  const reviewNote = typeof raw.reviewNote === "string" ? raw.reviewNote.trim().slice(0, 1000) : "";

  if (!REQUEST_STATUSES.includes(status as RequestStatus) || status === "pending") {
    return NextResponse.json(
      { error: "status must be 'approved' or 'denied'" },
      { status: 400 },
    );
  }

  if (!DECISION_REASONS.includes(decisionReason as DecisionReason)) {
    return NextResponse.json(
      {
        error: "A decisionReason from the published list is required.",
        allowed: DECISION_REASONS,
      },
      { status: 400 },
    );
  }

  try {
    const db = await getDbClient();
    const { changes } = await db.query(
      // CURRENT_TIMESTAMP is valid in both SQLite and PostgreSQL.
      `UPDATE access_requests
          SET status = ?,
              decision_reason = ?,
              reviewed_at = CURRENT_TIMESTAMP,
              reviewed_by = ?,
              review_note = ?
        WHERE id = ?`,
      [status, decisionReason, reviewedBy || null, reviewNote || null, id],
    );

    if (!changes) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ id, status, decisionReason });
  } catch (error) {
    console.error("[access-requests] review failed", error);
    return NextResponse.json({ error: "Could not update the request." }, { status: 500 });
  }
}

/**
 * DELETE — erase a single request. Admin only.
 *
 * Exists so that someone who asks for their details to be removed can actually
 * have them removed, before the retention window expires. A request to be
 * forgotten should not require a database migration to honour.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const id = parseId((await context.params).id);
  if (id === null) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  try {
    const db = await getDbClient();
    const { changes } = await db.query(`DELETE FROM access_requests WHERE id = ?`, [id]);

    if (!changes) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    console.error("[access-requests] delete failed", error);
    return NextResponse.json({ error: "Could not delete the request." }, { status: 500 });
  }
}

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}
