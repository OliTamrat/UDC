"use client";

import { useEffect } from "react";
import { EMBED_HEIGHT_MESSAGE, getAllowedParentOrigins } from "@/config/embed.config";

/**
 * Reports the embed's content height to the host page.
 *
 * UDC's page currently hard-codes height="900", which clips the dashboard on
 * desktop and leaves a large empty gap on mobile. With the listener snippet
 * from docs/WQIS_EMBED_INTEGRATION.md in place, the iframe resizes itself and
 * the host page never needs to guess a number.
 *
 * The height is posted only to the parent origin the frame was actually loaded
 * from, and only when that origin is on the approved list — never to "*".
 */
export function useEmbedAutoHeight(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    // Not framed — nothing to report to.
    if (window.parent === window) return;

    const parentOrigin = resolveParentOrigin();
    if (!parentOrigin) return;

    let lastHeight = 0;

    const report = () => {
      const height = Math.ceil(document.documentElement.scrollHeight);
      // Ignore sub-pixel churn from chart/map animations.
      if (Math.abs(height - lastHeight) < 24) return;
      lastHeight = height;
      window.parent.postMessage({ type: EMBED_HEIGHT_MESSAGE, height }, parentOrigin);
    };

    report();

    // The map and charts hydrate asynchronously, so the first useful height
    // arrives well after mount — observe rather than measure once.
    const observer = new ResizeObserver(report);
    observer.observe(document.documentElement);
    window.addEventListener("load", report);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", report);
    };
  }, [enabled]);
}

/** The framing page's origin, if we are willing to talk to it. */
function resolveParentOrigin(): string | null {
  try {
    if (!document.referrer) return null;
    const origin = new URL(document.referrer).origin;
    return getAllowedParentOrigins().includes(origin) ? origin : null;
  } catch {
    return null;
  }
}
