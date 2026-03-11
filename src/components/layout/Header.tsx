"use client";

import { Bell, Search, User, Calendar, Sun, Moon, Monitor, MapPin, Menu } from "lucide-react";
import { useTheme, type Theme } from "@/context/ThemeContext";
import { useSidebar } from "@/context/SidebarContext";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { monitoringStations, researchProjects } from "@/data/dc-waterways";
import { sanitizeSearchInput, isInputSafe } from "@/lib/validation";

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

interface SearchResult {
  id: string;
  name: string;
  type: "station" | "research" | "page";
  href: string;
}

const pageResults: SearchResult[] = [
  { id: "page-research", name: "Research Portal", type: "page", href: "/research" },
  { id: "page-education", name: "Education & Outreach", type: "page", href: "/education" },
  { id: "page-methodology", name: "Methodology & Data Sources", type: "page", href: "/methodology" },
  { id: "page-dashboard", name: "Dashboard — Water Quality Overview", type: "page", href: "/" },
];

export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { openMobile } = useSidebar();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
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
        project.tags.some((t: string) => t.toLowerCase().includes(q))
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

    for (const page of pageResults) {
      const keywords = page.name.toLowerCase();
      if (keywords.includes(q) || page.href.toLowerCase().includes(q)) {
        results.push(page);
      }
    }

    return results.slice(0, 8);
  }, [searchQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
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
      isDark ? "border-panel-border bg-panel-bg/80" : "border-slate-200 bg-white/80"
    }`}>
      {/* Left side: hamburger + logo + search */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
        {/* Hamburger — mobile/tablet only */}
        <button
          onClick={openMobile}
          aria-label="Open navigation menu"
          className={`lg:hidden p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
            isDark ? "hover:bg-panel-hover text-slate-400" : "hover:bg-slate-100 text-slate-500"
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
          <Search className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-600"}`} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search stations, data, and research"
            placeholder="Search..."
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
                ? "bg-udc-dark/50 border-panel-border text-slate-300 placeholder:text-slate-600 focus:border-udc-blue/50"
                : "bg-slate-100 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-blue-400"
            }`}
          />
          {showResults && searchQuery && (
            <div className={`absolute left-0 top-full mt-1 w-full sm:w-80 rounded-lg border shadow-lg py-1 z-50 max-h-80 overflow-y-auto ${
              isDark ? "bg-panel-bg border-panel-border" : "bg-white border-slate-200"
            }`}>
              {searchResults.length === 0 ? (
                <div className={`px-3 py-4 text-sm text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  No results found
                </div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                      isDark ? "text-slate-300 hover:bg-panel-hover" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${
                      result.type === "station" ? "text-blue-400" : result.type === "research" ? "text-green-400" : "text-amber-400"
                    }`} />
                    <div className="min-w-0">
                      <span className="block truncate">{result.name}</span>
                      <span className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {result.type}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: date, live, theme, bell, stakeholder */}
      <div className="flex items-center gap-0.5 sm:gap-1.5 md:gap-3 flex-shrink-0 ml-2">
        {/* Date — hidden below md */}
        <div className={`hidden md:flex items-center gap-2 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{dateStr}</span>
          <span className="lg:hidden">{now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>

        {/* Live indicator — hidden below sm */}
        <div className="hidden sm:flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-water-clean animate-pulse" />
          <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-500"}`}>Live</span>
        </div>

        {/* Theme Switcher */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              isDark ? "hover:bg-panel-hover text-slate-400" : "hover:bg-slate-100 text-slate-500"
            }`}
            title="Change appearance"
            aria-label="Change appearance theme"
            aria-expanded={showThemeMenu}
            aria-haspopup="true"
          >
            <CurrentIcon className="w-4 h-4" aria-hidden="true" />
          </button>
          {showThemeMenu && (
            <div className={`absolute right-0 top-full mt-1 rounded-lg border shadow-lg py-1 min-w-[140px] z-50 ${
              isDark ? "bg-panel-bg border-panel-border" : "bg-white border-slate-200"
            }`}>
              <div className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}>
                Appearance
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
                          ? "text-slate-300 hover:bg-panel-hover"
                          : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{opt.label}</span>
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
            isDark ? "hover:bg-panel-hover" : "hover:bg-slate-100"
          }`}
          title="Notifications — coming soon"
          aria-label="Notifications (coming soon)"
        >
          <Bell className={`w-4 h-4 ${isDark ? "text-slate-300" : "text-slate-500"}`} aria-hidden="true" />
        </button>

        {/* Stakeholder button — hidden on mobile, icon-only on tablet */}
        <button
          className={`hidden sm:flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg transition-colors border ${
            isDark
              ? "hover:bg-panel-hover border-panel-border"
              : "hover:bg-slate-50 border-slate-200"
          }`}
          title="Stakeholder portal — coming soon"
          aria-label="Stakeholder portal (coming soon)"
        >
          <User className={`w-4 h-4 ${isDark ? "text-slate-300" : "text-slate-500"}`} aria-hidden="true" />
          <span className={`hidden md:inline text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>Stakeholder</span>
        </button>
      </div>
    </header>
  );
}
