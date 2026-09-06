"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, UserPlus, XCircle } from "lucide-react";

interface AdminAccount {
  id: number;
  email: string;
  name: string;
  role: "admin" | "owner";
  status: "active" | "disabled";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
}

interface Props {
  isDark: boolean;
  currentEmail: string;
}

export default function UsersTab({ isDark, currentEmail }: Props) {
  const [users, setUsers] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "owner">("admin");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Could not load accounts.");
        setUsers([]);
      } else {
        setUsers(body.users || []);
        setError("");
      }
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addUser() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Could not create the account.");
      } else {
        setNotice(
          `Account created for ${email}. Give them the temporary password — they must change it when they first sign in.`,
        );
        setName("");
        setEmail("");
        setPassword("");
        setRole("admin");
        await load();
      }
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: number, status: "active" | "disabled") {
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const body = await res.json();
      if (!res.ok) setError(body.error || "Could not update the account.");
      else await load();
    } catch {
      setError("Unable to reach the server.");
    }
  }

  const card = isDark
    ? "bg-[#13161F] border-white/[0.06]"
    : "bg-white border-[#D1D5DB]";
  const label = isDark ? "text-[#D1D5DB]" : "text-[#374151]";
  const heading = isDark ? "text-white" : "text-[#111827]";
  const input = `w-full px-3 py-2 rounded-lg border text-sm outline-none ${
    isDark
      ? "bg-[#090B11] border-white/[0.08] text-white placeholder:text-[#4B5563] focus:border-blue-500/50"
      : "bg-[#F0F1F3] border-[#D1D5DB] text-[#374151] placeholder:text-[#6B7280] focus:border-blue-500"
  }`;

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-5 ${card}`}>
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="w-4 h-4 text-udc-gold" />
          <h2 className={`text-sm font-bold ${heading}`}>Add a WRRI account</h2>
        </div>
        <p className={`text-xs mb-4 ${label}`}>
          Each person signs in with their own email and password, so actions can be
          traced to a person and one account can be removed without disturbing anyone else.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${label}`}>Full name</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div>
            <label className={`block text-xs font-semibold mb-1 ${label}`}>Email</label>
            <input className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane.doe@udc.edu" />
          </div>
          <div>
            <label className={`block text-xs font-semibold mb-1 ${label}`}>Temporary password</label>
            <input
              className={input}
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 12 characters"
            />
            <p className={`text-[11px] mt-1 ${label}`}>
              Shown as text so you can pass it on. They must change it at first sign-in.
            </p>
          </div>
          <div>
            <label className={`block text-xs font-semibold mb-1 ${label}`}>Role</label>
            <select
              className={input}
              value={role}
              onChange={(e) => setRole(e.target.value === "owner" ? "owner" : "admin")}
            >
              <option value="admin">Admin — manage data</option>
              <option value="owner">Owner — manage data and accounts</option>
            </select>
          </div>
        </div>

        <button
          onClick={addUser}
          disabled={saving || !name || !email || !password}
          className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-udc-gold to-udc-red text-white text-sm font-semibold disabled:opacity-40 transition-all active:scale-[0.98]"
        >
          {saving ? "Creating…" : "Create account"}
        </button>

        {error && (
          <div className={`mt-3 flex items-start gap-2 p-3 rounded-xl text-xs ${
            isDark ? "bg-red-500/10 border border-red-500/20 text-red-300" : "bg-red-100 border border-red-300 text-red-700"
          }`}>
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div className={`mt-3 flex items-start gap-2 p-3 rounded-xl text-xs ${
            isDark ? "bg-green-500/10 border border-green-500/20 text-green-300" : "bg-green-100 border border-green-300 text-green-800"
          }`}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      <div className={`rounded-2xl border overflow-hidden ${card}`}>
        <div className="px-5 py-4 border-b border-inherit">
          <h2 className={`text-sm font-bold ${heading}`}>Accounts</h2>
        </div>
        {loading ? (
          <p className={`px-5 py-6 text-xs ${label}`}>Loading…</p>
        ) : users.length === 0 ? (
          <p className={`px-5 py-6 text-xs ${label}`}>No accounts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-[11px] uppercase tracking-wide ${label}`}>
                  <th className="text-left font-semibold px-5 py-2">Name</th>
                  <th className="text-left font-semibold px-5 py-2">Email</th>
                  <th className="text-left font-semibold px-5 py-2">Role</th>
                  <th className="text-left font-semibold px-5 py-2">Last sign-in</th>
                  <th className="text-right font-semibold px-5 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={isDark ? "border-t border-white/[0.06]" : "border-t border-[#E5E7EB]"}>
                    <td className={`px-5 py-3 ${heading}`}>
                      {u.name}
                      {u.email === currentEmail && (
                        <span className={`ml-2 text-[10px] ${label}`}>(you)</span>
                      )}
                    </td>
                    <td className={`px-5 py-3 ${label}`}>{u.email}</td>
                    <td className={`px-5 py-3 ${label}`}>
                      <span className="inline-flex items-center gap-1">
                        {u.role === "owner" && <ShieldCheck className="w-3 h-3 text-udc-gold" />}
                        {u.role}
                      </span>
                    </td>
                    <td className={`px-5 py-3 ${label}`}>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "never"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {u.email === currentEmail ? (
                        <span className={`text-xs ${label}`}>active</span>
                      ) : (
                        <button
                          onClick={() => setStatus(u.id, u.status === "active" ? "disabled" : "active")}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                            u.status === "active"
                              ? isDark ? "text-red-300 hover:bg-red-500/10" : "text-red-700 hover:bg-red-50"
                              : isDark ? "text-green-300 hover:bg-green-500/10" : "text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {u.status === "active" ? "Disable" : "Re-enable"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
