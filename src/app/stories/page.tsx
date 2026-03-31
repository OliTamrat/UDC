"use client";

import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ScrollySection, FadeIn } from "@/components/stories/ScrollySection";
import { BookOpen, ChevronDown } from "lucide-react";

// Lazy-load heavy story components for faster initial page load
const RainStory = dynamic(() => import("@/components/stories/RainStory"), { ssr: false });
const WhatsInTheWater = dynamic(() => import("@/components/stories/WhatsInTheWater"), { ssr: false });
const YearInAnacostia = dynamic(() => import("@/components/stories/YearInAnacostia"), { ssr: false });
const UpstreamDownstream = dynamic(() => import("@/components/stories/UpstreamDownstream"), { ssr: false });
const AnimatedScenarios = dynamic(() => import("@/components/stories/AnimatedScenarios"), { ssr: false });
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSidebarClass } from "@/hooks/useSidebarMargin";

export default function StoriesPage() {
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";
  const sidebarClass = useSidebarClass();

  return (
    <div className={`flex min-h-screen overflow-x-hidden transition-colors duration-300 ${isDark ? "bg-udc-dark" : "bg-[#F9FAFB]"}`}>
      <Sidebar />
      <main id="main-content" className={`flex-1 ${sidebarClass} min-w-0 overflow-x-hidden`}>
        <Header />
        <div className="p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8">
          {/* Hero */}
          <section
            className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-6 sm:p-8 md:p-10 text-center ${
              isDark
                ? "border-white/[0.06] bg-gradient-to-b from-[#13161F] via-[#0C0F17] to-[#0C0F17]"
                : "border-[#E5E7EB] bg-gradient-to-b from-white via-blue-50/30 to-[#F9FAFB]"
            }`}
          >
            <div className={`absolute inset-0 ${
              isDark ? "bg-gradient-to-r from-cyan-600/5 via-transparent to-blue-600/5" : ""
            }`} />
            <div className="relative z-10 max-w-2xl mx-auto">
              <FadeIn>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className={`p-2.5 rounded-xl ${isDark ? "bg-water-blue/10" : "bg-blue-50"}`}>
                    <BookOpen className="w-6 h-6 text-water-blue" />
                  </div>
                </div>
                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 ${isDark ? "text-white" : "text-[#111827]"}`}>
                  {t("stories.title")}
                </h1>
                <p className={`text-sm sm:text-base leading-relaxed max-w-xl mx-auto ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>
                  {t("stories.subtitle")}
                </p>
              </FadeIn>
              <FadeIn delay={400}>
                <div className="mt-6 flex items-center justify-center">
                  <ChevronDown className={`w-5 h-5 animate-bounce ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`} />
                </div>
              </FadeIn>
            </div>
          </section>

          {/* Story Navigation */}
          <FadeIn delay={200}>
            <nav className="flex flex-wrap gap-2 justify-center">
              {[
                { href: "#rain", labelKey: "stories.nav_rain" as const, color: "text-blue-400" },
                { href: "#whats-in-water", labelKey: "stories.nav_whats" as const, color: "text-green-400" },
                { href: "#year", labelKey: "stories.nav_year" as const, color: "text-amber-400" },
                { href: "#upstream", labelKey: "stories.nav_upstream" as const, color: "text-cyan-400" },
                { href: "#scenarios", labelKey: "stories.nav_scenarios" as const, color: "text-rose-400" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                    isDark
                      ? "border-white/[0.06] hover:border-water-blue/40 bg-[#13161F] text-[#E5E7EB]"
                      : "border-[#E5E7EB] hover:border-blue-300 bg-white text-[#4B5563]"
                  }`}
                >
                  <span className={item.color}>&#9679;</span>{" "}
                  {t(item.labelKey)}
                </a>
              ))}
            </nav>
          </FadeIn>

          {/* Stories */}
          <ScrollySection id="rain">
            <RainStory />
          </ScrollySection>

          <ScrollySection id="whats-in-water">
            <WhatsInTheWater />
          </ScrollySection>

          <ScrollySection id="year">
            <YearInAnacostia />
          </ScrollySection>

          <ScrollySection id="upstream">
            <UpstreamDownstream />
          </ScrollySection>

          <ScrollySection id="scenarios">
            <AnimatedScenarios />
          </ScrollySection>

          {/* Call to Action */}
          <FadeIn>
            <section
              className={`rounded-2xl border p-6 sm:p-8 text-center ${
                isDark
                  ? "bg-gradient-to-br from-[#13161F] to-[#0C0F17] border-white/[0.06]"
                  : "bg-gradient-to-br from-blue-50 to-white border-[#E5E7EB]"
              }`}
            >
              <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-[#111827]"}`}>
                {t("stories.cta_title")}
              </h2>
              <p className={`text-sm mb-4 max-w-lg mx-auto ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>
                {t("stories.cta_text")}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a
                  href="/"
                  className="px-5 py-2.5 rounded-xl bg-water-blue hover:bg-blue-600 text-white text-sm font-medium transition-colors"
                >
                  {t("stories.cta_dashboard")}
                </a>
                <a
                  href="/scenarios"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium transition-colors"
                >
                  Pollution Simulator
                </a>
                <a
                  href="/api/export?format=csv"
                  className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    isDark
                      ? "border-white/[0.06] text-[#E5E7EB] hover:bg-white/[0.04]"
                      : "border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]"
                  }`}
                >
                  {t("stories.cta_download")}
                </a>
              </div>
            </section>
          </FadeIn>

          <Footer />
        </div>
      </main>
    </div>
  );
}
