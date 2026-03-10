"use client";

import { Bell, Search, User, Calendar, Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/context/ThemeContext";
import { useState, useRef, useEffect } from "react";

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isDark = resolvedTheme === "dark";
  const CurrentIcon = theme === "system" ? Monitor : theme === "dark" ? Moon : Sun;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className={`h-14 border-b flex items-center justify-between px-3 md:px-6 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 ${
      isDark ? "border-panel-border bg-panel-bg/80" : "border-slate-200 bg-white/80"
    }`}>
      {/* Left side — search (hidden on mobile, shown on md+) */}
      <div className="flex items-center gap-4">
        {/* Spacer for mobile hamburger button */}
        <div className="w-10 md:hidden" />
        <div className="relative hidden md:block">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder="Search stations, data, research..."
            className={`w-72 border rounded-lg pl-10 pr-4 py-1.5 text-sm focus:outline-none transition-colors ${
              isDark
                ? "bg-udc-dark/50 border-panel-border text-slate-300 placeholder:text-slate-600 focus:border-udc-blue/50"
                : "bg-slate-100 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-blue-400"
            }`}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Date — hidden on small screens */}
        <div className={`hidden lg:flex items-center gap-2 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
          <Calendar className="w-3.5 h-3.5" />
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-water-clean animate-pulse" />
          <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Live</span>
        </div>

        {/* Theme Switcher */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? "hover:bg-panel-hover text-slate-400" : "hover:bg-slate-100 text-slate-500"
            }`}
            title="Change appearance"
          >
            <CurrentIcon className="w-4 h-4" />
          </button>
          {showThemeMenu && (
            <div className={`absolute right-0 top-full mt-1 rounded-lg border shadow-lg py-1 min-w-[140px] z-50 ${
              isDark ? "bg-panel-bg border-panel-border" : "bg-white border-slate-200"
            }`}>
              <div className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                isDark ? "text-slate-500" : "text-slate-400"
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

        <button className={`relative p-2 rounded-lg transition-colors ${
          isDark ? "hover:bg-panel-hover" : "hover:bg-slate-100"
        }`}>
          <Bell className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-udc-red" />
        </button>
        {/* User button — hide label on mobile */}
        <button className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg transition-colors border ${
          isDark
            ? "hover:bg-panel-hover border-panel-border"
            : "hover:bg-slate-50 border-slate-200"
        }`}>
          <User className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
          <span className={`text-sm hidden md:inline ${isDark ? "text-slate-300" : "text-slate-700"}`}>Stakeholder</span>
        </button>
      </div>
    </header>
  );
}
