"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, Trash2, X } from "lucide-react";

import {
  DECISION_REASONS,
  DECISION_REASON_LABELS,
  RETENTION_DAYS,
  type DecisionReason,
} from "@/lib/access-requests";

interface AccessRequestRow {
  id: number;
  name: string;
  email: string;
  affiliation: string;
  requester_role: string;
  purpose: string;
  status: "pending" | "approved" | "denied";
  decision_reason: DecisionReason | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

/**
 * WRRI's review queue for Level 2 access requests.
 *
 * Every decision requires a reason chosen from the published list — the UI does
 * not offer a way to approve or deny without naming one. That is the point: it
 * keeps refusals on comparable, request-based grounds instead of unrecorded
 * judgement, and it means a person can always be told why.
 */
export default function AccessRequestsTab({
  isDark,
  adminKey,
}: {
  isDark: boolean;
  adminKey: string;
}) {
  const [rows, setRows] = useState<AccessRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<number, DecisionReason>>({});

  const authHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (adminKey) headers["Authorization"] = `Bearer ${adminKey}`;
    return headers;
  }, [adminKey]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/access-requests", { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRows(await res.json());
    } catch {
      setError("Could not load access requests.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  async function decide(id: number, status: "approved" | "denied") {
    const decisionReason =
      reasons[id] ?? (status === "approved" ? "approved_standard" : undefined);

    if (!decisionReason) {
      setError("Choose a reason before recording a decision.");
      return;
    }

    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/access-requests/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status, decisionReason }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchRows();
    } catch {
      setError("Could not record the decision.");
    } finally {
      setBusyId(null);
    }
  }

  async function erase(id: number) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/access-requests/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchRows();
    } catch {
      setError("Could not delete the request.");
    } finally {
      setBusyId(null);
    }
  }

  const card = isDark
    ? "bg-[#13161F]/90 border-white/[0.06]"
    : "bg-white border-[#D1D5DB]";
  const muted = isDark ? "text-[#9CA3AF]" : "text-[#6B7280]";
  const body = isDark ? "text-[#E5E7EB]" : "text-[#374151]";
  const select = isDark
    ? "bg-[#0C0F17] border-white/[0.08] text-white"
    : "bg-white border-[#D1D5DB] text-[#111827]";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>
            Researcher Access Requests
          </h2>
          <p className={`text-xs mt-1 max-w-2xl ${muted}`}>
            Decide on the stated purpose, not the requester. Role sets the usage
            allowance only. Records are deleted automatically after{" "}
            {Math.round(RETENTION_DAYS / 365)} year, or immediately on request.
          </p>
        </div>
        <button
          onClick={fetchRows}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${card} ${body}`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            isDark
              ? "border-red-500/30 bg-red-950/30 text-red-200"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className={`flex items-center gap-2 text-xs ${muted}`}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading requests...
        </div>
      ) : rows.length === 0 ? (
        <div className={`rounded-xl border p-6 text-center text-xs ${card} ${muted}`}>
          No access requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className={`rounded-xl border p-4 ${card}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>
                    {row.name}{" "}
                    <span className={`font-normal ${muted}`}>&lt;{row.email}&gt;</span>
                  </p>
                  <p className={`text-xs ${muted}`}>
                    {row.affiliation} &middot; {row.requester_role} &middot;{" "}
                    {new Date(row.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={row.status} isDark={isDark} />
              </div>

              <p className={`text-xs mb-3 whitespace-pre-wrap ${body}`}>{row.purpose}</p>

              {row.status === "pending" ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    aria-label="Decision reason"
                    value={reasons[row.id] ?? ""}
                    onChange={(e) =>
                      setReasons({ ...reasons, [row.id]: e.target.value as DecisionReason })
                    }
                    className={`rounded-lg border px-2 py-1.5 text-xs ${select}`}
                  >
                    <option value="">Select a reason...</option>
                    {DECISION_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {DECISION_REASON_LABELS[reason]}
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={busyId === row.id}
                    onClick={() => decide(row.id, "approved")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-env-teal/15 text-env-teal border border-env-teal/40 hover:bg-env-teal/25 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </button>

                  <button
                    disabled={busyId === row.id || !reasons[row.id]}
                    onClick={() => decide(row.id, "denied")}
                    title={!reasons[row.id] ? "Select a reason before denying" : undefined}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X className="w-3.5 h-3.5" />
                    Deny
                  </button>
                </div>
              ) : (
                <p className={`text-xs ${muted}`}>
                  {row.status === "approved" ? "Approved" : "Denied"}
                  {row.decision_reason && ` — ${DECISION_REASON_LABELS[row.decision_reason]}`}
                  {row.reviewed_by && ` · by ${row.reviewed_by}`}
                </p>
              )}

              <div className="mt-3 pt-2 border-t border-dashed border-white/[0.06]">
                <button
                  disabled={busyId === row.id}
                  onClick={() => erase(row.id)}
                  className={`flex items-center gap-1.5 text-[11px] ${muted} hover:text-red-400 disabled:opacity-50`}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete this record
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  isDark,
}: {
  status: AccessRequestRow["status"];
  isDark: boolean;
}) {
  const styles: Record<AccessRequestRow["status"], string> = {
    pending: isDark
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-amber-100 text-amber-800 border-amber-300",
    approved: isDark
      ? "bg-env-teal/15 text-teal-300 border-env-teal/30"
      : "bg-teal-100 text-teal-800 border-teal-300",
    denied: isDark
      ? "bg-red-500/10 text-red-300 border-red-500/30"
      : "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status]}`}>
      {status}
    </span>
  );
}
