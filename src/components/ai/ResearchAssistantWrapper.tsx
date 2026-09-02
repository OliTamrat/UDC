"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ResearchAssistant = dynamic(
  () => import("@/components/ai/ResearchAssistant"),
  { ssr: false },
);

/**
 * Mounts the floating AI research assistant everywhere except the embed.
 *
 * A chat panel floating over a widget inside someone else's page is intrusive,
 * and UDC has not yet said whether they want it public-facing, so /embed opts
 * out by default and turns it on with ?ai=1.
 *
 * The flag is read from window.location rather than useSearchParams because
 * this component is mounted by the root layout - useSearchParams there would
 * force every page in the app into dynamic rendering.
 */
export default function ResearchAssistantWrapper() {
  const pathname = usePathname();
  const isEmbed = pathname === "/embed" || (pathname?.startsWith("/embed/") ?? false);
  const [aiRequested, setAiRequested] = useState(false);

  useEffect(() => {
    if (!isEmbed) return;
    setAiRequested(new URLSearchParams(window.location.search).get("ai") === "1");
  }, [isEmbed, pathname]);

  if (isEmbed && !aiRequested) return null;

  return <ResearchAssistant />;
}
