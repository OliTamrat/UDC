import { NextRequest, NextResponse } from "next/server";

import { changePassword, login, validatePassword } from "@/lib/admin-auth";
import { authenticateAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.ok) return auth.response;

  const user = auth.principal.user;
  if (!user) {
    return NextResponse.json(
      { error: "Sign in with your own account to change a password." },
      { status: 403 },
    );
  }

  let currentPassword = "";
  let newPassword = "";
  try {
    const body = await request.json();
    currentPassword = String(body.currentPassword ?? "");
    newPassword = String(body.newPassword ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const policyError = validatePassword(newPassword);
  if (policyError) return NextResponse.json({ error: policyError }, { status: 400 });

  // Re-verify the current password even though the session is already trusted:
  // otherwise anyone at an unlocked desk could take the account over silently.
  const recheck = await login(user.email, currentPassword);
  if (!recheck.ok) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  await changePassword(user.id, newPassword);
  return NextResponse.json({ ok: true, signedOut: true });
}
