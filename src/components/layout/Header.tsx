"use client";

import { Bell, Search, User, Calendar, Sun, Moon, Monitor, MapPin, Menu, Languages } from "lucide-react";
import { useTheme, type Theme } from "@/context/ThemeContext";
import { useSidebar } from "@/context/SidebarContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { monitoringStations, researchProjects } from "@/data/dc-waterways";
import { ALL_PARAMETERS } from "@/data/parameters";
import { sanitizeSearchInput, isInputSafe } from "@/lib/validation";
import type { Locale } from "@/lib/i18n";

const themeOptions: { value: Theme; labelKey: "header.theme_light" | "header.theme_dark" | "header.theme_system"; icon: typeof Sun }[] = [
  { value: "light", labelKey: "header.theme_light", icon: Sun },
  { value: "dark", labelKey: "header.theme_dark", icon: Moon },
  { value: "system", labelKey: "header.theme_system", icon: Monitor },
];

const languageOptions: { value: Locale; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Español", flag: "🇪🇸" },
];

interface SearchResult {
  id: string;
  name: string;
  type: "station" | "research" | "page" | "parameter";
  href: string;
}

const pageResults: SearchResult[] = [
  { id: "page-dashboard", name: "Dashboard — Water Quality Overview", type: "page", href: "/" },
  { id: "page-stories", name: "Stories — Scientific Storytelling", type: "page", href: "/stories" },
  { id: "page-scenarios", name: "Scenarios — Pollution Simulator", type: "page", href: "/scenarios" },
  { id: "page-admin", name: "Admin — Data Management Panel", type: "page", href: "/admin" },
  { id: "page-research", name: "Research Portal", type: "page", href: "/research" },
  { id: "page-education", name: "Education & Outreach", type: "page", href: "/education" },
  { id: "page-methodology", name: "Methodology & Data Sources", type: "page", href: "/methodology" },
];

// Extra keyword entries that map common search terms to relevant pages
const keywordEntries: { keywords: string; result: SearchResult }[] = [
  { keywords: "rain rainfall stormwater runoff cso combined sewer overflow flooding", result: { id: "kw-rain", name: "When It Rains in DC (Story)", type: "page", href: "/stories" } },
  { keywords: "pollution contaminants chemicals toxic pfas emerging", result: { id: "kw-contaminants", name: "Emerging Contaminants Tracking", type: "page", href: "/stories" } },
  { keywords: "seasonal heatmap winter summer spring fall temperature trends year annual", result: { id: "kw-seasonal", name: "A Year in the Anacostia (Story)", type: "page", href: "/stories" } },
  { keywords: "upstream downstream watershed propagation", result: { id: "kw-upstream", name: "Upstream to Downstream (Story)", type: "page", href: "/stories" } },
  { keywords: "simulate simulation timeline playback animation spike", result: { id: "kw-sim", name: "Pollution Scenario Simulator", type: "page", href: "/scenarios" } },
  { keywords: "export csv json download data", result: { id: "kw-export", name: "Export Data (CSV/JSON)", type: "page", href: "/" } },
  { keywords: "upload import ingest ingestion", result: { id: "kw-upload", name: "Upload Data (Admin)", type: "page", href: "/admin" } },
  { keywords: "map leaflet watershed geospatial location", result: { id: "kw-map", name: "Interactive Watershed Map", type: "page", href: "/" } },
  { keywords: "epa threshold violation standard limit", result: { id: "kw-epa", name: "EPA Threshold Violations", type: "page", href: "/" } },
  { keywords: "environmental justice equity ward wards community", result: { id: "kw-ej", name: "Environmental Justice Data", type: "page", href: "/" } },
  { keywords: "green roof infrastructure bmp bioretention rain garden", result: { id: "kw-gi", name: "Green Infrastructure Stations", type: "page", href: "/" } },
  { keywords: "anacostia river potomac creek branch tributary", result: { id: "kw-river", name: "Anacostia Watershed Stations", type: "page", href: "/" } },
  { keywords: "usgs nwis sensor gauge real-time", result: { id: "kw-usgs", name: "USGS Real-Time Sensor Data", type: "page", href: "/admin" } },
  { keywords: "ai assistant chat ask question help", result: { id: "kw-ai", name: "AI Research Assistant", type: "page", href: "/" } },
  { keywords: "udc wrri causes university district columbia deksissa", result: { id: "kw-udc", name: "UDC WRRI Research", type: "page", href: "/research" } },
];

export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { openMobile } = useSidebar();
  const { locale, setLocale, t } = useLanguage();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const now = new Date();
  const dateStr = now.toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isDark = resolvedTheme === "dark";
  const CurrentIcon = theme === "system" ? Monitor : theme === "dark" ? Moon : Sun;

  const searchResults = useMemo<SearchResult[]>(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const results: SearchResult[] = [];

    for (const station of monitoringStations) {
      if (station.name.toLowerCase().includes(q) || station.id.toLowerCase().includes(q) || station.type.toLowerCase().includes(q)) {
        results.push({ id: station.id, name: station.name, type: "station", href: `/station/${station.id}` });
      }
    }

    for (const project of researchProjects) {
      if (
        project.title.toLowerCase().includes(q) ||
        project.pi.toLowerCase().includes(q) ||
        project.department.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        project.funding.toLowerCase().includes(q) ||
        project.tags.some((tag: string) => tag.toLowerCase().includes(q))
      ) {
        results.push({
          id: project.id,
          name: q.length > 0 && project.pi.toLowerCase().includes(q)
            ? `${project.title} (${project.pi})`
            : project.title,
          type: "research",
          href: "/research",
        });
      }
    }

    // Search water quality parameters (25 total)
    for (const param of ALL_PARAMETERS) {
      if (
        param.name.toLowerCase().includes(q) ||
        param.id.toLowerCase().includes(q) ||
        param.category.toLowerCase().includes(q) ||
        param.description.toLowerCase().includes(q) ||
        param.unit.toLowerCase().includes(q)
      ) {
        results.push({
          id: `param-${param.id}`,
          name: `${param.name} (${param.unit})`,
          type: "parameter" as SearchResult["type"],
          href: "/",
        });
      }
    }

    // Search app pages
    for (const page of pageResults) {
      if (page.name.toLowerCase().includes(q) || page.href.toLowerCase().includes(q)) {
        results.push(page);
      }
    }

    // Search keyword entries (common terms like "rain", "pollution", "export", etc.)
    const addedIds = new Set(results.map((r) => r.id));
    for (const entry of keywordEntries) {
      if (addedIds.has(entry.result.id)) continue;
      if (entry.keywords.split(" ").some((kw) => kw.includes(q) || q.includes(kw))) {
        results.push(entry.result);
        addedIds.add(entry.result.id);
      }
    }

    return results.slice(0, 10);
  }, [searchQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleResultClick(result: SearchResult) {
    setSearchQuery("");
    setShowResults(false);
    router.push(result.href);
  }

  return (
    <header className={`h-14 border-b flex items-center justify-between px-2 sm:px-4 md:px-6 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 ${
      isDark ? "border-white/[0.06] bg-[#0C0F17]/80" : "border-[#E5E7EB] bg-white/80"
    }`}>
      {/* Left side: hamburger + logo + search */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
        {/* Hamburger — mobile/tablet only */}
        <button
          onClick={openMobile}
          aria-label={t("header.open_nav")}
          className={`lg:hidden p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
            isDark ? "hover:bg-white/[0.04] text-[#D1D5DB]" : "hover:bg-gray-100 text-[#4B5563]"
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile logo badge — visible only when sidebar is hidden */}
        <div className="lg:hidden w-7 h-7 rounded-md bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-[8px] flex-shrink-0">
          UDC
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0 lg:flex-none lg:w-72" ref={searchRef} role="search">
          <Search className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-[#9CA3AF]" : "text-[#6B7280]"}`} aria-hidden="true" />
          <input
            type="search"
            aria-label={t("header.search_label")}
            placeholder={t("header.search_placeholder")}
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              if (isInputSafe(val)) {
                setSearchQuery(sanitizeSearchInput(val));
                setShowResults(true);
              }
            }}
            onFocus={() => { if (searchQuery) setShowResults(true); }}
            className={`w-full border rounded-lg pl-8 sm:pl-10 pr-3 py-1.5 text-sm focus:outline-none transition-colors ${
              isDark
                ? "bg-udc-dark/50 border-white/[0.06] text-gray-200 placeholder:text-gray-500 focus:border-water-blue/50"
                : "bg-gray-100 border-gray-200 text-gray-700 placeholder:text-gray-400 focus:border-blue-500"
            }`}
          />
          {showResults && searchQuery && (
            <div role="listbox" aria-label="Search results" className={`absolute left-0 top-full mt-1 w-full sm:w-80 rounded-lg border shadow-lg py-1 z-50 max-h-80 overflow-y-auto ${
              isDark ? "bg-[#13161F] border-white/[0.06]" : "bg-white border-gray-200"
            }`}>
              {searchResults.length === 0 ? (
                <div className={`px-3 py-4 text-sm text-center ${isDark ? "text-[#9CA3AF]" : "text-[#4B5563]"}`}>
                  {t("header.no_results")}
                </div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                      isDark ? "text-[#E5E7EB] hover:bg-white/[0.04]" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${
                      result.type === "station" ? "text-blue-400" : result.type === "research" ? "text-green-400" : result.type === "parameter" ? "text-purple-400" : "text-amber-400"
                    }`} />
                    <div className="min-w-0">
                      <span className="block truncate">{result.name}</span>
                      <span className={`text-[10px] uppercase tracking-wider ${isDark ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                        {result.type === "parameter" ? "parameter" : t(`search.${result.type}` as "search.station" | "search.research" | "search.page")}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: date, live, language, theme, bell, stakeholder */}
      <div className="flex items-center gap-0.5 sm:gap-1.5 md:gap-3 flex-shrink-0 ml-2">
        {/* Date — hidden below md */}
        <div className={`hidden md:flex items-center gap-2 text-xs ${isDark ? "text-[#9CA3AF]" : "text-[#4B5563]"}`}>
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{dateStr}</span>
          <span className="lg:hidden">{now.toLocaleDateString(locale === "es" ? "es-US" : "en-US", { month: "short", day: "numeric" })}</span>
        </div>

        {/* Live indicator — hidden below sm */}
        <div className="hidden sm:flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-water-clean animate-pulse" />
          <span className={`text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>{t("header.live")}</span>
        </div>

        {/* Language Switcher */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              isDark ? "hover:bg-white/[0.04] text-[#D1D5DB]" : "hover:bg-gray-100 text-[#4B5563]"
            }`}
            title={t("header.language")}
            aria-label={t("header.language")}
            aria-expanded={showLangMenu}
            aria-haspopup="true"
          >
            <Languages className="w-4 h-4" aria-hidden="true" />
          </button>
          {showLangMenu && (
            <div className={`absolute right-0 top-full mt-1 rounded-lg border shadow-lg py-1 min-w-[140px] z-50 ${
              isDark ? "bg-[#13161F] border-white/[0.06]" : "bg-white border-gray-200"
            }`}>
              <div className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                isDark ? "text-[#9CA3AF]" : "text-[#6B7280]"
              }`}>
                {t("header.language")}
              </div>
              {languageOptions.map((opt) => {
                const isActive = locale === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setLocale(opt.value); setShowLangMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? isDark
                          ? "bg-udc-blue/20 text-blue-400"
                          : "bg-blue-50 text-blue-600"
                        : isDark
                          ? "text-[#E5E7EB] hover:bg-white/[0.04]"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                    {isActive && <span className="ml-auto text-xs">&#10003;</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              isDark ? "hover:bg-white/[0.04] text-[#D1D5DB]" : "hover:bg-gray-100 text-[#4B5563]"
            }`}
            title={t("header.change_appearance")}
            aria-label={t("header.change_appearance")}
            aria-expanded={showThemeMenu}
            aria-haspopup="true"
          >
            <CurrentIcon className="w-4 h-4" aria-hidden="true" />
          </button>
          {showThemeMenu && (
            <div className={`absolute right-0 top-full mt-1 rounded-lg border shadow-lg py-1 min-w-[140px] z-50 ${
              isDark ? "bg-[#13161F] border-white/[0.06]" : "bg-white border-gray-200"
            }`}>
              <div className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                isDark ? "text-[#9CA3AF]" : "text-[#6B7280]"
              }`}>
                {t("header.appearance")}
              </div>
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setTheme(opt.value); setShowThemeMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? isDark
                          ? "bg-udc-blue/20 text-blue-400"
                          : "bg-blue-50 text-blue-600"
                        : isDark
                          ? "text-[#E5E7EB] hover:bg-white/[0.04]"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t(opt.labelKey)}</span>
                    {isActive && <span className="ml-auto text-xs">&#10003;</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications — hidden on very small screens */}
        <button
          className={`hidden sm:block relative p-1.5 sm:p-2 rounded-lg transition-colors ${
            isDark ? "hover:bg-white/[0.04]" : "hover:bg-gray-100"
          }`}
          title={t("header.notifications")}
          aria-label={t("header.notifications")}
        >
          <Bell className={`w-4 h-4 ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`} aria-hidden="true" />
        </button>

        {/* Stakeholder button — hidden on mobile, icon-only on tablet */}
        <button
          className={`hidden sm:flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg transition-colors border ${
            isDark
              ? "hover:bg-white/[0.04] border-white/[0.06]"
              : "hover:bg-[#F3F4F6] border-[#E5E7EB]"
          }`}
          title={t("header.stakeholder_soon")}
          aria-label={t("header.stakeholder_soon")}
        >
          <User className={`w-4 h-4 ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`} aria-hidden="true" />
          <span className={`hidden md:inline text-sm ${isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"}`}>{t("header.stakeholder")}</span>
        </button>
      </div>
    </header>
  );
}
