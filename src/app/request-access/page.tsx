import type { Metadata } from "next";

import RequestAccessForm from "@/components/access/RequestAccessForm";

/**
 * /request-access — the destination for the "Request Researcher Access" button
 * UDC published on their WRRI page.
 *
 * Deliberately honest about what it is: a request that a person at WRRI reads
 * and decides on, not a login. Level 2 authentication does not exist yet, and
 * the page should not imply otherwise.
 */
export const metadata: Metadata = {
  title: "Request Researcher Access",
  description:
    "Request Level 2 researcher access to the UDC Water Quality Intelligence System.",
  robots: { index: false, follow: true },
};

export default function RequestAccessPage() {
  return <RequestAccessForm />;
}
