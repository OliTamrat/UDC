import type { Metadata } from "next";
import { Suspense } from "react";

import EmbedDashboard from "@/components/embed/EmbedDashboard";

/**
 * /embed - the chrome-free view UDC frames into their WRRI pages.
 *
 * Kept out of search indexes on purpose: the standalone dashboard at / is the
 * canonical page, and an indexed embed would compete with both it and UDC's own
 * page for the same queries.
 *
 * Who may frame this route is decided by the CSP `frame-ancestors` header set
 * in src/middleware.ts, from the allow-list in src/config/embed.config.ts.
 */
export const metadata: Metadata = {
  title: "Water Quality Intelligence System - Live Data",
  description:
    "Live Anacostia watershed monitoring from UDC CAUSES Water Resources Research Institute.",
  robots: { index: false, follow: false },
};

export default function EmbedPage() {
  return (
    <Suspense fallback={<EmbedLoading />}>
      <EmbedDashboard />
    </Suspense>
  );
}

/**
 * Shown while the client bundle loads. The embed reads its configuration from
 * the query string, so it must sit behind a Suspense boundary - without one,
 * useSearchParams would opt the whole route out of static rendering.
 */
function EmbedLoading() {
  return (
    <div className="min-h-screen bg-udc-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-env-teal border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#D1D5DB]">Loading live water quality data...</span>
      </div>
    </div>
  );
}
