import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  changePassword,
  countUsers,
  createSession,
  createUser,
  destroySession,
  ensureBootstrapAdmin,
  hashPassword,
  listUsers,
  login,
  resolveSession,
  setUserStatus,
  validatePassword,
  verifyPassword,
} from "@/lib/admin-auth";
import { getDbClient } from "@/lib/db";

const GOOD_PASSWORD = "correct horse battery staple";

async function reset() {
  const db = await getDbClient();
  await db.query("DELETE FROM admin_sessions", []);
  await db.query("DELETE FROM admin_users", []);
}

async function seedUser(overrides: Partial<{ email: string; role: "admin" | "owner" }> = {}) {
  const result = await createUser({
    email: overrides.email ?? "wrri@udc.edu",
    name: "WRRI Staff",
    password: GOOD_PASSWORD,
    role: overrides.role ?? "admin",
    createdBy: "test",
  });
  expect(result.ok).toBe(true);
}

const ORIGINAL_ENV = {
  email: process.env.ADMIN_BOOTSTRAP_EMAIL,
  password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
};

beforeEach(async () => {
  delete process.env.ADMIN_BOOTSTRAP_EMAIL;
  delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
  await reset();
});

afterEach(() => {
  process.env.ADMIN_BOOTSTRAP_EMAIL = ORIGINAL_ENV.email;
  process.env.ADMIN_BOOTSTRAP_PASSWORD = ORIGINAL_ENV.password;
  if (ORIGINAL_ENV.email === undefined) delete process.env.ADMIN_BOOTSTRAP_EMAIL;
  if (ORIGINAL_ENV.password === undefined) delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
});

describe("password hashing", () => {
  it("round-trips a password", () => {
    const stored = hashPassword(GOOD_PASSWORD);
    expect(verifyPassword(GOOD_PASSWORD, stored)).toBe(true);
    expect(verifyPassword("wrong password entirely", stored)).toBe(false);
  });

  it("salts, so identical passwords do not share a hash", () => {
    // Without a salt, two staff choosing the same password would be visibly
    // identical in the table, and one cracked hash would open both accounts.
    expect(hashPassword(GOOD_PASSWORD)).not.toBe(hashPassword(GOOD_PASSWORD));
  });

  it("rejects malformed stored values instead of throwing", () => {
    expect(verifyPassword(GOOD_PASSWORD, "")).toBe(false);
    expect(verifyPassword(GOOD_PASSWORD, "no-colon-here")).toBe(false);
    expect(verifyPassword(GOOD_PASSWORD, "salt:")).toBe(false);
  });
});

describe("password policy", () => {
  it("requires real length", () => {
    expect(validatePassword("short")).toContain("12 characters");
    expect(validatePassword("a".repeat(12))).toBeNull();
  });
});

describe("login", () => {
  it("issues a session for the right password", async () => {
    await seedUser();
    const result = await login("wrri@udc.edu", GOOD_PASSWORD);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe("wrri@udc.edu");
      // Seeded accounts must change the password they were handed.
      expect(result.user.mustChangePassword).toBe(true);
    }
  });

  it("is case-insensitive about the email", async () => {
    await seedUser();
    const result = await login("  WRRI@UDC.EDU  ", GOOD_PASSWORD);
    expect(result.ok).toBe(true);
  });

  it("does not reveal whether an account exists", async () => {
    await seedUser();
    const wrongPassword = await login("wrri@udc.edu", "definitely not it");
    const noSuchUser = await login("nobody@udc.edu", "definitely not it");
    expect(wrongPassword.ok).toBe(false);
    expect(noSuchUser.ok).toBe(false);
    if (!wrongPassword.ok && !noSuchUser.ok) {
      expect(wrongPassword.reason).toBe(noSuchUser.reason);
    }
  });

  it("locks the account after repeated failures", async () => {
    await seedUser();
    for (let i = 0; i < 4; i++) {
      const attempt = await login("wrri@udc.edu", "wrong");
      expect(attempt.ok).toBe(false);
    }
    const fifth = await login("wrri@udc.edu", "wrong");
    expect(fifth.ok).toBe(false);
    if (!fifth.ok) expect(fifth.reason).toBe("locked");

    // Locked means locked: the correct password must not open it either, or the
    // lockout would only slow down someone who already knows the password.
    const correct = await login("wrri@udc.edu", GOOD_PASSWORD);
    expect(correct.ok).toBe(false);
    if (!correct.ok) expect(correct.reason).toBe("locked");
  });

  it("clears the failure count after a good login", async () => {
    await seedUser();
    await login("wrri@udc.edu", "wrong");
    await login("wrri@udc.edu", "wrong");
    expect((await login("wrri@udc.edu", GOOD_PASSWORD)).ok).toBe(true);

    // Four more failures should not lock, because the counter reset to zero.
    for (let i = 0; i < 4; i++) await login("wrri@udc.edu", "wrong");
    const stillOpen = await login("wrri@udc.edu", GOOD_PASSWORD);
    expect(stillOpen.ok).toBe(true);
  });

  it("refuses a disabled account", async () => {
    await seedUser();
    const users = await listUsers();
    await setUserStatus(users[0].id, "disabled");
    const result = await login("wrri@udc.edu", GOOD_PASSWORD);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("disabled");
  });
});

describe("sessions", () => {
  it("resolves a live session to its user", async () => {
    await seedUser();
    const result = await login("wrri@udc.edu", GOOD_PASSWORD);
    if (!result.ok) throw new Error("login failed");
    const user = await resolveSession(result.token);
    expect(user?.email).toBe("wrri@udc.edu");
  });

  it("rejects an unknown or empty token", async () => {
    expect(await resolveSession(undefined)).toBeNull();
    expect(await resolveSession("not-a-real-token")).toBeNull();
  });

  it("stops resolving after logout", async () => {
    await seedUser();
    const result = await login("wrri@udc.edu", GOOD_PASSWORD);
    if (!result.ok) throw new Error("login failed");
    await destroySession(result.token);
    expect(await resolveSession(result.token)).toBeNull();
  });

  it("revokes access the moment an account is disabled", async () => {
    // Waiting for the session to lapse would leave a removed staff member with
    // up to 12 hours of continued access.
    await seedUser();
    const result = await login("wrri@udc.edu", GOOD_PASSWORD);
    if (!result.ok) throw new Error("login failed");
    const users = await listUsers();
    await setUserStatus(users[0].id, "disabled");
    expect(await resolveSession(result.token)).toBeNull();
  });

  it("does not store the token itself", async () => {
    await seedUser();
    const users = await listUsers();
    const token = await createSession(users[0].id);
    const db = await getDbClient();
    const { rows } = await db.query("SELECT token_hash FROM admin_sessions", []);
    const stored = rows.map((r) => String((r as { token_hash: string }).token_hash));
    // A dump of this table must not be replayable as a live session.
    expect(stored).not.toContain(token);
    expect(stored.length).toBe(1);
  });

  it("signs every device out when the password changes", async () => {
    await seedUser();
    const first = await login("wrri@udc.edu", GOOD_PASSWORD);
    if (!first.ok) throw new Error("login failed");
    await changePassword(first.user.id, "a brand new long password");
    expect(await resolveSession(first.token)).toBeNull();
    expect((await login("wrri@udc.edu", "a brand new long password")).ok).toBe(true);
  });
});

describe("createUser", () => {
  it("rejects a duplicate email", async () => {
    await seedUser();
    const again = await createUser({
      email: "WRRI@udc.edu",
      name: "Someone Else",
      password: GOOD_PASSWORD,
      createdBy: "test",
    });
    expect(again.ok).toBe(false);
  });

  it("rejects a weak password and a malformed email", async () => {
    const weak = await createUser({
      email: "a@udc.edu", name: "A", password: "short", createdBy: "test",
    });
    expect(weak.ok).toBe(false);
    const bad = await createUser({
      email: "not-an-email", name: "A", password: GOOD_PASSWORD, createdBy: "test",
    });
    expect(bad.ok).toBe(false);
  });
});

describe("bootstrap", () => {
  it("creates the first owner when the table is empty", async () => {
    process.env.ADMIN_BOOTSTRAP_EMAIL = "first@dapsanalytics.com";
    process.env.ADMIN_BOOTSTRAP_PASSWORD = GOOD_PASSWORD;
    await ensureBootstrapAdmin();

    const users = await listUsers();
    expect(users).toHaveLength(1);
    expect(users[0].role).toBe("owner");
    expect(users[0].mustChangePassword).toBe(true);
  });

  it("never adds a second account", async () => {
    // Otherwise the variables would be a permanent back door into a live system.
    await seedUser();
    process.env.ADMIN_BOOTSTRAP_EMAIL = "intruder@example.com";
    process.env.ADMIN_BOOTSTRAP_PASSWORD = GOOD_PASSWORD;
    await ensureBootstrapAdmin();
    expect(await countUsers()).toBe(1);
    expect((await listUsers())[0].email).toBe("wrri@udc.edu");
  });

  it("does nothing when the variables are unset", async () => {
    await ensureBootstrapAdmin();
    expect(await countUsers()).toBe(0);
  });
});
