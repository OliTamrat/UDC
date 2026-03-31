"use client";

import { useEffect, useState } from "react";

/**
 * Debug page — open /debug on your phone to find the element causing horizontal scroll.
 * This scans every DOM element and reports any that extend beyond the viewport width.
 */
export default function DebugOverflow() {
  const [results, setResults] = useState<string[]>([]);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const w = document.documentElement.clientWidth;
    const h = document.documentElement.clientHeight;
    setViewport({ w, h });

    const overflowing: string[] = [];
    document.querySelectorAll("*").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > w + 1) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : "";
        const cls = el.className && typeof el.className === "string"
          ? `.${el.className.split(" ").slice(0, 3).join(".")}`
          : "";
        overflowing.push(
          `<${tag}${id}${cls}> — right: ${Math.round(rect.right)}px (overflows by ${Math.round(rect.right - w)}px, width: ${Math.round(rect.width)}px)`
        );
      }
    });

    setResults(overflowing.length > 0 ? overflowing : ["No overflowing elements found"]);
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "monospace", fontSize: 12, color: "#fff", background: "#000", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 16, marginBottom: 8 }}>Overflow Debug</h1>
      <p style={{ marginBottom: 16, color: "#9CA3AF" }}>
        Viewport: {viewport.w}x{viewport.h}px
      </p>
      <p style={{ marginBottom: 8, color: "#FDB927" }}>
        {results.length} element(s) extending beyond viewport:
      </p>
      {results.map((r, i) => (
        <div key={i} style={{ padding: 8, marginBottom: 4, background: "#1a1a2e", borderRadius: 4, wordBreak: "break-all" }}>
          {r}
        </div>
      ))}
      <p style={{ marginTop: 16, color: "#6B7280", fontSize: 10 }}>
        Open this page on mobile to identify the exact element causing horizontal scroll.
        Then go to / (dashboard) and come back here to compare.
      </p>
    </div>
  );
}
