"use client";

import { useState } from "react";
import { CheckCircle2, Info, Loader2, ShieldCheck } from "lucide-react";

import {
  ACCESS_CRITERIA,
  REQUESTER_ROLES,
  RETENTION_DAYS,
  type RequesterRole,
} from "@/lib/access-requests";
import { institution } from "@/config/site.config";
import { useTheme } from "@/context/ThemeContext";

const ROLE_LABELS: Record<RequesterRole, string> = {
  student: "Student",
  faculty: "Faculty or instructor",
  researcher: "Researcher",
  partner: "Agency or community partner",
  other: "Other",
};

/**
 * The Level 2 access request form.
 *
 * Three things this page is deliberate about:
 *
 *  - It says plainly that this is a REQUEST reviewed by a person, not a login.
 *    Level 2 authentication does not exist yet and the page must not imply it.
 *  - It publishes the criteria BEFORE the fields, so nobody is judged against
 *    something they were not shown.
 *  - It states exactly what is stored, who sees it and for how long, next to
 *    the inputs rather than buried in a policy page.
 */
export default function RequestAccessForm() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [form, setForm] = useState({
    name: "",
    email: "",
    affiliation: "",
    requesterRole: "student" as RequesterRole,
    purpose: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);

    try {
      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setErrors(payload.details ?? [payload.error ?? "Could not submit your request."]);
        return;
      }

      setSubmitted(true);
    } catch {
      setErrors(["Could not reach the server. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  const shell = isDark ? "bg-udc-dark text-white" : "bg-[#F0F1F3] text-[#111827]";
  const card = isDark
    ? "bg-[#13161F]/90 border-white/[0.06] shadow-lg shadow-black/20"
    : "bg-white border-[#D1D5DB] shadow-md shadow-black/[0.08]";
  const label = isDark ? "text-[#E5E7EB]" : "text-[#374151]";
  const input = isDark
    ? "bg-[#0C0F17] border-white/[0.08] text-white placeholder:text-[#6B7280] focus:border-env-teal"
    : "bg-white border-[#D1D5DB] text-[#111827] placeholder:text-[#9CA3AF] focus:border-teal-500";
  const muted = isDark ? "text-[#9CA3AF]" : "text-[#6B7280]";

  if (submitted) {
    return (
      <div className={`min-h-screen ${shell} flex items-center justify-center p-4`}>
        <div className={`max-w-lg w-full rounded-2xl border p-6 ${card}`}>
          <CheckCircle2 className="w-10 h-10 text-env-teal mb-3" />
          <h1 className="text-xl font-bold mb-2">Request received</h1>
          <p className={`text-sm mb-4 ${label}`}>
            The {institution.instituteAcronym} team will review your request and reply to the
            email address you gave. If your request is declined you will be told on
            which of the published criteria.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-env-teal/15 text-env-teal border border-env-teal/40 hover:bg-env-teal/25 transition-colors"
          >
            Back to the dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${shell} p-4 sm:p-8`}>
      <main className="max-w-2xl mx-auto space-y-4">
        <header>
          <h1 className="text-2xl font-bold mb-1">Request Researcher Access</h1>
          <p className={`text-sm ${label}`}>
            Level 2 access opens restricted datasets and higher analysis limits in the{" "}
            {institution.shortName} Water Quality Intelligence System.
          </p>
        </header>

        {/* Set expectations before anything is typed. */}
        <div
          className={`rounded-xl border p-4 text-sm ${
            isDark
              ? "border-env-teal/20 bg-teal-950/20 text-teal-100"
              : "border-teal-300 bg-teal-50 text-teal-900"
          }`}
        >
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              This is a request reviewed by a person at {institution.instituteAcronym}, not a
              login. Nothing on this page creates an account. All public dashboard
              data stays freely available without any request.
            </p>
          </div>
        </div>

        <section className={`rounded-2xl border p-5 ${card}`}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">
            What we look at
          </h2>
          <p className={`text-sm mb-3 ${label}`}>
            Requests are decided on the purpose described below — not on who is asking.
            Your role sets your usage allowance, not whether you get access.
          </p>
          <ul className={`text-sm space-y-2 ${label}`}>
            {ACCESS_CRITERIA.map((criterion) => (
              <li key={criterion} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-env-teal" />
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </section>

        <form onSubmit={handleSubmit} className={`rounded-2xl border p-5 space-y-4 ${card}`}>
          <Field id="name" label="Name" className={label}>
            <input
              id="name"
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${input}`}
            />
          </Field>

          <Field id="email" label="Email" className={label}>
            <input
              id="email"
              type="email"
              required
              maxLength={254}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${input}`}
            />
            <p className={`text-xs mt-1 ${muted}`}>Used only to send you the decision.</p>
          </Field>

          <Field id="affiliation" label="Institution or organisation" className={label}>
            <input
              id="affiliation"
              required
              maxLength={200}
              value={form.affiliation}
              onChange={(e) => setForm({ ...form, affiliation: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${input}`}
            />
          </Field>

          <Field id="requesterRole" label="Role" className={label}>
            <select
              id="requesterRole"
              value={form.requesterRole}
              onChange={(e) =>
                setForm({ ...form, requesterRole: e.target.value as RequesterRole })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${input}`}
            >
              {REQUESTER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <p className={`text-xs mt-1 ${muted}`}>
              Sets your usage allowance. It does not affect whether access is granted.
            </p>
          </Field>

          <Field id="purpose" label="How will you use the data?" className={label}>
            <textarea
              id="purpose"
              required
              rows={5}
              maxLength={2000}
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="Describe the research, course, or community work this supports."
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${input}`}
            />
            <p className={`text-xs mt-1 ${muted}`}>
              This is the only thing your request is judged on.
            </p>
          </Field>

          {errors.length > 0 && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                isDark
                  ? "border-red-500/30 bg-red-950/30 text-red-200"
                  : "border-red-300 bg-red-50 text-red-800"
              }`}
              role="alert"
            >
              <ul className="list-disc pl-4 space-y-1">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-env-teal text-[#062B2B] hover:bg-teal-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Submitting..." : "Submit request"}
          </button>
        </form>

        {/* Stated next to the inputs, not buried in a policy page. */}
        <section className={`rounded-2xl border p-5 ${card}`}>
          <div className="flex items-start gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-env-teal" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              What happens to what you enter
            </h2>
          </div>
          <ul className={`text-sm space-y-2 ${label}`}>
            <li>
              <strong>Stored:</strong> only the four fields above. Nothing else is recorded —
              no IP address, no device or browser details, no tracking of any kind.
            </li>
            <li>
              <strong>Seen by:</strong> {institution.instituteAcronym} staff reviewing access
              requests.
            </li>
            <li>
              <strong>Kept for:</strong> up to {Math.round(RETENTION_DAYS / 365)} year, then
              deleted automatically.
            </li>
            <li>
              <strong>Never:</strong> sold, shared with third parties, or used to contact you
              about anything other than this request.
            </li>
            <li>
              <strong>Removal:</strong> email{" "}
              <a className="underline" href={`mailto:${institution.contact.email}`}>
                {institution.contact.email}
              </a>{" "}
              and your request will be deleted.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={`block text-sm font-medium mb-1.5 ${className}`}>
        {label}
      </label>
      {children}
    </div>
  );
}
