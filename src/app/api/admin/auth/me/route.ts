import { NextRequest, NextResponse } from "next/server";

import { authenticateAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lets the admin page decide what to render without guessing at cookie state. */
export async function GET(request: NextRequest) {
  const result = await authenticateAdmin(request);
  if (!result.ok) return NextResponse.json({ user: null }, { status: 401 });

  const { principal } = result;
  return NextResponse.json({
    user: principal.user
      ? {
          email: principal.user.email,
          name: principal.user.name,
          role: principal.user.role,
          mustChangePassword: principal.user.mustChangePassword,
        }
      : null,
    viaSharedKey: principal.viaSharedKey,
  });
}
