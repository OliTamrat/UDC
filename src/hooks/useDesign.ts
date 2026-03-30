"use client";

import { useTheme } from "@/context/ThemeContext";

/**
 * Shared design system hook — single source of truth for all UI styling.
 * Used by every page and component for consistent visual treatment.
 *
 * Design principles:
 * - Warm dark theme (#0C0F17 base) — not cold navy
 * - High-contrast text — white/near-white on dark, not muted grays
 * - Cards with glass + shadow depth — not flat borders
 * - Vibrant accents — blue, teal, emerald, amber, gold
 */
export function useDesign() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return {
    dark,

    // ── Page background ──
    pageBg: dark ? "bg-[#0C0F17]" : "bg-[#F8FAFB]",

    // ── Card surfaces ──
    card: dark
      ? "bg-[#13161F]/90 border border-white/[0.06] shadow-lg shadow-black/20"
      : "bg-white border border-[#E5E7EB] shadow-sm shadow-black/[0.03]",
    cardHover: dark
      ? "hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/30"
      : "hover:shadow-md hover:border-[#D1D5DB]",
    // Glass panel (for overlays, popups)
    glass: dark
      ? "bg-[#13161F]/80 backdrop-blur-xl border border-white/[0.06] shadow-xl shadow-black/30"
      : "bg-white/90 backdrop-blur-xl border border-[#E5E7EB] shadow-lg shadow-black/[0.05]",

    // ── Text hierarchy (high contrast) ──
    h1: dark ? "text-white" : "text-[#111827]",
    h2: dark ? "text-white" : "text-[#1F2937]",
    h3: dark ? "text-[#F3F4F6]" : "text-[#1F2937]",
    body: dark ? "text-[#E5E7EB]" : "text-[#4B5563]",
    label: dark ? "text-[#D1D5DB]" : "text-[#6B7280]",
    muted: dark ? "text-[#9CA3AF]" : "text-[#9CA3AF]",

    // ── Borders & dividers ──
    border: dark ? "border-white/[0.06]" : "border-[#E5E7EB]",
    divider: dark ? "divide-white/[0.06]" : "divide-[#F3F4F6]",

    // ── Interactive states ──
    hover: dark ? "hover:bg-white/[0.04]" : "hover:bg-[#F3F4F6]",
    active: dark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-700",

    // ── Inputs ──
    input: dark
      ? "bg-[#0C0F17] border border-white/[0.08] text-white placeholder:text-[#4B5563] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
      : "bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] placeholder:text-[#9CA3AF] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",

    // ── Hero section ──
    heroBg: dark
      ? "bg-gradient-to-br from-[#13161F] via-[#0C0F17] to-[#0C0F17] border border-white/[0.06]"
      : "bg-gradient-to-br from-white via-blue-50/30 to-[#F8FAFB] border border-[#E5E7EB]",

    // ── Table ──
    tableHeaderBg: dark ? "bg-white/[0.02]" : "bg-[#F9FAFB]",
    tableRowHover: dark ? "hover:bg-white/[0.03]" : "hover:bg-[#F9FAFB]",
    tableRowBorder: dark ? "border-white/[0.04]" : "border-[#F3F4F6]",

    // ── Buttons ──
    btnPrimary: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20",
    btnSecondary: dark
      ? "border border-white/[0.1] text-[#D1D5DB] hover:bg-white/[0.04] hover:border-white/[0.15]"
      : "border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]",

    // ── Accent pill/badge backgrounds ──
    pill: dark
      ? "bg-white/[0.03] border border-white/[0.06]"
      : "bg-white border border-[#E5E7EB]",
  };
}
