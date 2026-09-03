/**
 * Level 2 researcher access requests.
 *
 * UDC's WRRI page publishes a "Request Researcher Access" button. Authenticated
 * Level 2 access does not exist yet, so this is deliberately a *request queue*
 * and nothing more: it records who asked, for what, and what WRRI decided. No
 * account is created and no access is granted by anything in this file.
 *
 * ---------------------------------------------------------------------------
 * DATA MINIMISATION
 * ---------------------------------------------------------------------------
 * This is a public university system and the people submitting are largely
 * students. Four fields are collected and nothing else:
 *
 *   name         to address a reply
 *   email        the only way to send the decision back
 *   affiliation  to confirm a legitimate academic or partner use
 *   purpose      the sole basis on which the request is decided
 *
 * Explicitly NOT collected or stored: IP address, user agent, referrer, device
 * identifiers, cookies, demographics, student ID, nationality, or anything else
 * that was not typed deliberately into the form. The IP address is used only as
 * a transient in-memory rate-limit key and is never written to the database.
 *
 * Records are purged after RETENTION_DAYS. UDC/WRRI own the final retention
 * decision and the privacy notice — the value here is a conservative default,
 * not legal advice.
 *
 * ---------------------------------------------------------------------------
 * NON-DISCRIMINATION
 * ---------------------------------------------------------------------------
 * Access is decided on the stated purpose, not on who is asking. Two structural
 * controls enforce that rather than relying on good intentions:
 *
 *  1. `requesterRole` sets the QUOTA TIER a person lands in. It is not a gate.
 *     A student and a faculty member with the same legitimate purpose both get
 *     access; they get different AI budgets, the way a library sets different
 *     borrowing limits.
 *
 *  2. A denial must cite a reason from DECISION_REASONS. Free-form judgement is
 *     where inconsistent treatment hides — a fixed list makes every refusal
 *     reviewable and comparable, and none of the reasons refer to any
 *     characteristic of the person.
 *
 * See docs/WQIS_LEVEL2_ACCESS_DESIGN.md.
 */

export const REQUESTER_ROLES = [
  "student",
  "faculty",
  "researcher",
  "partner",
  "other",
] as const;

export type RequesterRole = (typeof REQUESTER_ROLES)[number];

export const REQUEST_STATUSES = ["pending", "approved", "denied"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/**
 * The complete set of grounds on which a request may be refused.
 *
 * Every entry describes something about the REQUEST. None describes anything
 * about the requester. Adding a reason here is a policy change and should be
 * agreed with WRRI, not made casually.
 */
export const DECISION_REASONS = [
  "purpose_not_stated",       // the purpose field says nothing decision-relevant
  "purpose_outside_scope",    // not a water-quality research or educational use
  "affiliation_unverifiable", // WRRI could not confirm the stated affiliation
  "duplicate_request",        // the same person already has a decision on file
  "suspected_abuse",          // automated, bulk, or bad-faith submission
  "approved_standard",        // approvals: met the published criteria
] as const;

export type DecisionReason = (typeof DECISION_REASONS)[number];

/**
 * Human-readable labels. These are shown to WRRI reviewers and, for denials,
 * are what the requester is told — a person refused access is entitled to know
 * on what ground.
 */
export const DECISION_REASON_LABELS: Record<DecisionReason, string> = {
  purpose_not_stated: "No research or educational purpose was described",
  purpose_outside_scope: "Purpose falls outside water-quality research or education",
  affiliation_unverifiable: "Stated affiliation could not be confirmed",
  duplicate_request: "A decision already exists for this requester",
  suspected_abuse: "Submission appears automated or in bad faith",
  approved_standard: "Meets the published access criteria",
};

/** Days a request is retained before it is purged. */
export const RETENTION_DAYS = 365;

/**
 * The criteria published on the request form. Kept in code so the form, the
 * reviewer UI and this module cannot drift apart — a person should be judged
 * against exactly the criteria they were shown.
 */
export const ACCESS_CRITERIA = [
  "You describe a water-quality research, teaching, or community purpose.",
  "You provide an institutional or organisational affiliation we can confirm.",
  "You agree to cite UDC CAUSES/WRRI as the data source in published work.",
] as const;

export interface AccessRequestInput {
  name: string;
  email: string;
  affiliation: string;
  requesterRole: RequesterRole;
  purpose: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  value?: AccessRequestInput;
}

/** Field length ceilings — also stops the form being used as free storage. */
const LIMITS = {
  name: 120,
  email: 254,
  affiliation: 200,
  purpose: 2000,
} as const;

/**
 * Validates a submitted request.
 *
 * Strict about shape and length, permissive about content. This form is public
 * and the goal is a usable record for WRRI — not a filter on who is allowed to
 * ask. Anyone may ask; the decision happens later, in the open, against the
 * published criteria.
 */
export function validateAccessRequest(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: ["Request body must be a JSON object."] };
  }

  const raw = body as Record<string, unknown>;

  const name = str(raw.name);
  const email = str(raw.email);
  const affiliation = str(raw.affiliation);
  const purpose = str(raw.purpose);
  const requesterRole = str(raw.requesterRole);

  if (!name) errors.push("Name is required.");
  else if (name.length > LIMITS.name) errors.push(`Name must be ${LIMITS.name} characters or fewer.`);

  if (!email) errors.push("Email is required.");
  else if (email.length > LIMITS.email) errors.push(`Email must be ${LIMITS.email} characters or fewer.`);
  else if (!isEmailShaped(email)) errors.push("Email does not look like a valid address.");

  if (!affiliation) errors.push("Affiliation is required.");
  else if (affiliation.length > LIMITS.affiliation) {
    errors.push(`Affiliation must be ${LIMITS.affiliation} characters or fewer.`);
  }

  if (!REQUESTER_ROLES.includes(requesterRole as RequesterRole)) {
    errors.push(`Role must be one of: ${REQUESTER_ROLES.join(", ")}.`);
  }

  if (!purpose) errors.push("Please describe how you intend to use the data.");
  else if (purpose.length > LIMITS.purpose) {
    errors.push(`Purpose must be ${LIMITS.purpose} characters or fewer.`);
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    value: {
      name,
      email,
      affiliation,
      requesterRole: requesterRole as RequesterRole,
      purpose,
    },
  };
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Shape check only. Full RFC 5322 validation is not worth the false negatives —
 * a WRRI reviewer reads every one of these anyway, and rejecting a legitimate
 * address on a regex technicality is its own kind of unfairness.
 */
function isEmailShaped(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
