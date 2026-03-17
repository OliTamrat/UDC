"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ScrollySection, FadeIn } from "@/components/stories/ScrollySection";
import RainStory from "@/components/stories/RainStory";
import WhatsInTheWater from "@/components/stories/WhatsInTheWater";
import YearInAnacostia from "@/components/stories/YearInAnacostia";
import UpstreamDownstream from "@/components/stories/UpstreamDownstream";
import { BookOpen, ChevronDown } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export default function StoriesPage() {
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? "bg-udc-dark" : "bg-slate-50"}`}>
      <Sidebar />
      <main id="main-content" className="flex-1 lg:ml-[240px] min-w-0 overflow-x-hidden">
        <Header />
        <div className="p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8">
          {/* Hero */}
          <section
            className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-6 sm:p-8 md:p-10 text-center ${
              isDark
                ? "border-panel-border bg-gradient-to-b from-udc-navy via-panel-bg to-udc-dark"
                : "border-slate-200 bg-gradient-to-b from-blue-50 via-white to-slate-50"
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
                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                  {t("stories.title")}
                </h1>
                <p className={`text-sm sm:text-base leading-relaxed max-w-xl mx-auto ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {t("stories.subtitle")}
                </p>
              </FadeIn>
              <FadeIn delay={400}>
                <div className="mt-6 flex items-center justify-center">
                  <ChevronDown className={`w-5 h-5 animate-bounce ${isDark ? "text-slate-500" : "text-slate-400"}`} />
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
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                    isDark
                      ? "border-panel-border hover:border-water-blue/40 bg-panel-bg text-slate-300"
                      : "border-slate-200 hover:border-blue-300 bg-white text-slate-600"
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

          {/* Call to Action */}
          <FadeIn>
            <section
              className={`rounded-2xl border p-6 sm:p-8 text-center ${
                isDark
                  ? "bg-gradient-to-br from-udc-navy/50 to-panel-bg border-panel-border"
                  : "bg-gradient-to-br from-blue-50 to-white border-slate-200"
              }`}
            >
              <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                {t("stories.cta_title")}
              </h2>
              <p className={`text-sm mb-4 max-w-lg mx-auto ${isDark ? "text-slate-300" : "text-slate-600"}`}>
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
                  href="/api/export?format=csv"
                  className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    isDark
                      ? "border-panel-border text-slate-300 hover:bg-panel-hover"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
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
