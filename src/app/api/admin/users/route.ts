import { NextRequest, NextResponse } from "next/server";

import {
  countActiveOwners,
  createUser,
  listUsers,
  setUserStatus,
} from "@/lib/admin-auth";
import { requireOwner } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireOwner(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json({ users: await listUsers() });
}

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (!auth.ok) return auth.response;

  let body: { email?: string; name?: string; password?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const role = body.role === "owner" ? "owner" : "admin";
  const result = await createUser({
    email: String(body.email ?? ""),
    name: String(body.name ?? ""),
    password: String(body.password ?? ""),
    role,
    createdBy: auth.principal.label,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireOwner(request);
  if (!auth.ok) return auth.response;

  let body: { id?: number; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const id = Number(body.id);
  const status = body.status === "disabled" ? "disabled" : "active";
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "A valid user id is required." }, { status: 400 });
  }

  // Disabling yourself is how a one-owner system locks itself out permanently,
  // with no way back in short of a database edit.
  if (status === "disabled" && auth.principal.user?.id === id) {
    return NextResponse.json(
      { error: "You cannot disable your own account." },
      { status: 400 },
    );
  }

  const users = await listUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return NextResponse.json({ error: "No such user." }, { status: 404 });

  if (status === "disabled" && target.role === "owner" && (await countActiveOwners()) <= 1) {
    return NextResponse.json(
      { error: "This is the last active owner. Promote someone else first." },
      { status: 400 },
    );
  }

  await setUserStatus(id, status);
  return NextResponse.json({ ok: true });
}
