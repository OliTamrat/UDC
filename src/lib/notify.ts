/**
 * Outbound notification for events WRRI needs to act on.
 *
 * The platform has no email provider configured — no SMTP credentials, no
 * transactional mail dependency — and choosing one is UDC's call, not something
 * to decide inside a feature. So notification is a plain webhook POST: it needs
 * no new dependency, and it targets whatever UDC already uses. A Microsoft Teams
 * incoming webhook is the obvious fit given UDC runs on Microsoft, but any
 * endpoint that accepts JSON works.
 *
 *   ACCESS_REQUEST_WEBHOOK_URL   set on the Azure Container App
 *
 * When it is unset, notification degrades to "WRRI sees it in the admin panel".
 * That is a deliberate fallback, not a failure: the request is always durably
 * stored first, and delivery never blocks the submission.
 */

const WEBHOOK_TIMEOUT_MS = 5_000;

export interface AccessRequestNotification {
  id: number;
  name: string;
  email: string;
  affiliation: string;
  requesterRole: string;
  purpose: string;
}

/**
 * Best-effort notification. Never throws and never blocks the caller's response
 * path — a webhook outage must not cost a researcher their submission.
 */
export async function notifyAccessRequest(
  request: AccessRequestNotification,
  reviewUrl: string,
): Promise<void> {
  const url = (process.env as Record<string, string | undefined>)[
    "ACCESS_REQUEST_WEBHOOK_URL"
  ];
  if (!url) return;

  const text = [
    `New WQIS researcher access request (#${request.id})`,
    `From: ${request.name} <${request.email}>`,
    `Affiliation: ${request.affiliation}`,
    `Role: ${request.requesterRole}`,
    `Purpose: ${truncate(request.purpose, 500)}`,
    `Review: ${reviewUrl}`,
  ].join("\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `text` satisfies Teams and Slack incoming webhooks; the structured
      // fields are there for anything that wants to parse instead.
      body: JSON.stringify({ text, request }),
      signal: controller.signal,
    });
  } catch {
    // Swallowed on purpose. The request is already stored; the admin panel is
    // the source of truth and notification is a convenience on top of it.
  } finally {
    clearTimeout(timer);
  }
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
