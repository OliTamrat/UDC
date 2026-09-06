/**
 * Per-person admin accounts for WRRI staff.
 *
 * Replaces the single shared ADMIN_API_KEY, which had three problems: no
 * per-person audit trail, no way to revoke one person without rotating for
 * everyone, and it asked non-technical staff to handle a 40-character bearer
 * token as an everyday password.
 *
 * This is deliberately the SUBSET of what UDC SSO will need rather than a rival
 * to it. When Entra ID lands, the users, roles and sessions here survive and
 * only the credential check is replaced — see docs/WQIS_LEVEL2_ACCESS_DESIGN.md.
 */

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { getDbClient } from "@/lib/db";

export const SESSION_COOKIE = "udc_admin_session";

const SESSION_HOURS = 12;
const SCRYPT_KEYLEN = 64;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "owner";
  status: "active" | "disabled";
  mustChangePassword: boolean;
}

/**
 * Normalises a timestamp read back from either driver.
 *
 * node-postgres returns a Date; better-sqlite3 returns the stored string. SQLite's
 * own `datetime('now')` format ("YYYY-MM-DD HH:MM:SS") is parsed by JS as LOCAL
 * time, which would silently shift every expiry by the host's offset — so this
 * module always writes explicit ISO strings and this reader tolerates both shapes.
 */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const raw = String(value);
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T") + "Z";
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// --------------------------------------------------------------------------
// Passwords
// --------------------------------------------------------------------------

/** scrypt with a per-password salt, stored as "salt:hash". */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${derived}`;
}

/**
 * Constant-time comparison. A plain `===` on the hex digests leaks, through
 * timing, how many leading characters matched — enough to reconstruct a hash
 * byte by byte given enough attempts.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = (stored || "").split(":");
  if (!salt || !expected) return false;

  const actual = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  const a = Buffer.from(actual, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Minimum viable password policy.
 *
 * Length carries far more of the weight than character-class rules, which mostly
 * push people toward predictable substitutions. Twelve characters is the floor
 * for an account reachable from the public internet.
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length < 12) {
    return "Password must be at least 12 characters.";
  }
  if (password.length > 200) {
    return "Password must be 200 characters or fewer.";
  }
  return null;
}

// --------------------------------------------------------------------------
// Sessions
// --------------------------------------------------------------------------

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Returns the raw token for the cookie; only its hash reaches the database. */
export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000).toISOString();

  const db = await getDbClient();
  await db.query(
    `INSERT INTO admin_sessions (token_hash, user_id, created_at, expires_at)
     VALUES (?, ?, ?, ?)`,
    [hashToken(token), userId, new Date().toISOString(), expiresAt],
  );
  return token;
}

export async function resolveSession(token: string | undefined): Promise<AdminUser | null> {
  if (!token) return null;

  const db = await getDbClient();
  const { rows } = await db.query(
    `SELECT s.expires_at, u.id, u.email, u.name, u.role, u.status, u.must_change_password
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = ?`,
    [hashToken(token)],
  );

  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  const expires = toDate(row.expires_at);
  if (!expires || expires.getTime() <= Date.now()) {
    await destroySession(token);
    return null;
  }
  // A disabled account must lose access immediately, not when its session lapses.
  if (row.status !== "active") return null;

  return {
    id: Number(row.id),
    email: String(row.email),
    name: String(row.name),
    role: row.role as AdminUser["role"],
    status: row.status as AdminUser["status"],
    mustChangePassword: Boolean(row.must_change_password),
  };
}

export async function destroySession(token: string): Promise<void> {
  const db = await getDbClient();
  await db.query(`DELETE FROM admin_sessions WHERE token_hash = ?`, [hashToken(token)]);
}

/** Drops every session for a user — used when disabling an account. */
export async function destroyAllSessions(userId: number): Promise<void> {
  const db = await getDbClient();
  await db.query(`DELETE FROM admin_sessions WHERE user_id = ?`, [userId]);
}

// --------------------------------------------------------------------------
// Login
// --------------------------------------------------------------------------

export type LoginResult =
  | { ok: true; user: AdminUser; token: string }
  | { ok: false; reason: "invalid" | "locked" | "disabled" };

/**
 * Verifies a credential and issues a session.
 *
 * Wrong password and unknown account both return "invalid" so the response
 * cannot be used to enumerate who has an account.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const db = await getDbClient();
  const normalised = (email || "").trim().toLowerCase();

  const { rows } = await db.query(
    `SELECT id, email, name, role, status, password_hash, must_change_password,
            failed_attempts, locked_until
       FROM admin_users WHERE email = ?`,
    [normalised],
  );
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return { ok: false, reason: "invalid" };

  const lockedUntil = toDate(row.locked_until);
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    return { ok: false, reason: "locked" };
  }
  if (row.status !== "active") return { ok: false, reason: "disabled" };

  if (!verifyPassword(password, String(row.password_hash))) {
    const attempts = Number(row.failed_attempts ?? 0) + 1;
    const lock =
      attempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
        : null;
    await db.query(
      `UPDATE admin_users SET failed_attempts = ?, locked_until = ? WHERE id = ?`,
      [attempts, lock, row.id],
    );
    return { ok: false, reason: attempts >= MAX_FAILED_ATTEMPTS ? "locked" : "invalid" };
  }

  await db.query(
    `UPDATE admin_users
        SET failed_attempts = 0, locked_until = NULL, last_login_at = ?
      WHERE id = ?`,
    [new Date().toISOString(), row.id],
  );

  const user: AdminUser = {
    id: Number(row.id),
    email: String(row.email),
    name: String(row.name),
    role: row.role as AdminUser["role"],
    status: "active",
    mustChangePassword: Boolean(row.must_change_password),
  };
  return { ok: true, user, token: await createSession(user.id) };
}

export async function changePassword(userId: number, newPassword: string): Promise<void> {
  const db = await getDbClient();
  await db.query(
    `UPDATE admin_users SET password_hash = ?, must_change_password = 0 WHERE id = ?`,
    [hashPassword(newPassword), userId],
  );
  // Force every other device to re-authenticate with the new credential.
  await destroyAllSessions(userId);
}

// --------------------------------------------------------------------------
// User management
// --------------------------------------------------------------------------

export async function listUsers(): Promise<(AdminUser & { lastLoginAt: string | null })[]> {
  const db = await getDbClient();
  const { rows } = await db.query(
    `SELECT id, email, name, role, status, must_change_password, last_login_at
       FROM admin_users ORDER BY name`,
  );
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    email: String(r.email),
    name: String(r.name),
    role: r.role as AdminUser["role"],
    status: r.status as AdminUser["status"],
    mustChangePassword: Boolean(r.must_change_password),
    lastLoginAt: toDate(r.last_login_at)?.toISOString() ?? null,
  }));
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role?: "admin" | "owner";
  createdBy: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!input.name.trim()) return { ok: false, error: "Name is required." };

  const policyError = validatePassword(input.password);
  if (policyError) return { ok: false, error: policyError };

  const db = await getDbClient();
  const existing = await db.query(`SELECT id FROM admin_users WHERE email = ?`, [email]);
  if (existing.rows.length > 0) return { ok: false, error: "That email already has an account." };

  await db.query(
    `INSERT INTO admin_users
       (email, name, password_hash, role, status, must_change_password, created_at, created_by)
     VALUES (?, ?, ?, ?, 'active', 1, ?, ?)`,
    [
      email,
      input.name.trim(),
      hashPassword(input.password),
      input.role ?? "admin",
      new Date().toISOString(),
      input.createdBy,
    ],
  );
  return { ok: true };
}

export async function setUserStatus(
  userId: number,
  status: "active" | "disabled",
): Promise<void> {
  const db = await getDbClient();
  await db.query(`UPDATE admin_users SET status = ? WHERE id = ?`, [status, userId]);
  if (status === "disabled") await destroyAllSessions(userId);
}

export async function countUsers(): Promise<number> {
  const db = await getDbClient();
  const { rows } = await db.query(`SELECT COUNT(*) AS n FROM admin_users`);
  return Number((rows[0] as { n?: number | string })?.n ?? 0);
}

export async function countActiveOwners(): Promise<number> {
  const db = await getDbClient();
  const { rows } = await db.query(
    `SELECT COUNT(*) AS n FROM admin_users WHERE role = 'owner' AND status = 'active'`,
  );
  return Number((rows[0] as { n?: number | string })?.n ?? 0);
}

/**
 * Creates the very first account from ADMIN_BOOTSTRAP_EMAIL / _PASSWORD.
 *
 * Only ever fires when the table is empty, so it cannot be used to slip an extra
 * account into a running system. That first person adds everyone else through the
 * UI, which keeps a real audit trail from the first account onward. Once they
 * have signed in and set their own password, both variables can be removed.
 */
export async function ensureBootstrapAdmin(): Promise<void> {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) return;
  if ((await countUsers()) > 0) return;

  const db = await getDbClient();
  await db.query(
    `INSERT INTO admin_users
       (email, name, password_hash, role, status, must_change_password, created_at, created_by)
     VALUES (?, ?, ?, 'owner', 'active', 1, ?, 'bootstrap')`,
    [email, email.split("@")[0], hashPassword(password), new Date().toISOString()],
  );
  console.warn(`[admin-auth] bootstrap account created for ${email}`);
}
