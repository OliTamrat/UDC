"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SettingsModal from "@/components/SettingsModal";
import {
  LayoutDashboard,
  Map,
  FlaskConical,
  GraduationCap,
  Droplets,
  TreePine,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Globe,
  Users,
  BookOpen,
  X,
  DatabaseZap,
  BookHeart,
  Clapperboard,
  Info,
  BrainCircuit,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useSidebar } from "@/context/SidebarContext";
import { useLanguage } from "@/context/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

const navItems: { href: string; labelKey: TranslationKey; icon: typeof LayoutDashboard; section: string }[] = [
  { href: "/", labelKey: "sidebar.dashboard", icon: LayoutDashboard, section: "overview" },
  { href: "/#map", labelKey: "sidebar.interactive_map", icon: Map, section: "overview" },
  { href: "/#water-quality", labelKey: "sidebar.water_quality", icon: Droplets, section: "monitoring" },
  { href: "/#stormwater", labelKey: "sidebar.stormwater", icon: TreePine, section: "monitoring" },
  { href: "/#analytics", labelKey: "sidebar.analytics", icon: BarChart3, section: "monitoring" },
  { href: "/research", labelKey: "sidebar.research_link", icon: FlaskConical, section: "research" },
  { href: "/methodology", labelKey: "sidebar.methodology", icon: BookOpen, section: "research" },
  { href: "/#ai-insights", labelKey: "sidebar.ai_insights" as TranslationKey, icon: BrainCircuit, section: "research" },
  { href: "/stories", labelKey: "sidebar.stories", icon: BookHeart, section: "community" },
  { href: "/scenarios", labelKey: "sidebar.scenarios", icon: Clapperboard, section: "monitoring" },
  { href: "/education", labelKey: "sidebar.education", icon: GraduationCap, section: "community" },
  { href: "/education#community", labelKey: "sidebar.community_link", icon: Users, section: "community" },
  { href: "/education#resources", labelKey: "sidebar.open_data", icon: Globe, section: "community" },
  { href: "/admin", labelKey: "sidebar.data_admin", icon: DatabaseZap, section: "admin" },
  { href: "/about", labelKey: "sidebar.about", icon: Info, section: "about" },
];

const sections: { key: string; labelKey: TranslationKey }[] = [
  { key: "overview", labelKey: "sidebar.overview" },
  { key: "monitoring", labelKey: "sidebar.monitoring" },
  { key: "research", labelKey: "sidebar.research" },
  { key: "community", labelKey: "sidebar.community" },
  { key: "admin", labelKey: "sidebar.admin" },
  { key: "about", labelKey: "sidebar.about_section" },
];

export default function Sidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { mobileOpen, closeMobile, collapsed, toggleCollapsed } = useSidebar();
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b ${isDark ? "border-white/[0.06]" : "border-[#D1D5DB]"}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-sm flex-shrink-0 shadow-lg shadow-udc-gold/20">
          UDC
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1 min-w-0">
            <h1 className={`font-bold text-sm leading-tight ${isDark ? "text-white" : "text-[#111827]"}`}>{t("sidebar.water_resources")}</h1>
            <p className={`text-[10px] leading-tight ${isDark ? "text-[#6B7280]" : "text-[#374151]"}`}>{t("sidebar.subtitle")}</p>
          </div>
        )}
        {/* Close button — mobile only */}
        <button
          onClick={closeMobile}
          aria-label={t("sidebar.close_nav")}
          className={`lg:hidden p-1.5 rounded-lg transition-colors ${
            isDark ? "text-[#D1D5DB] hover:text-white hover:bg-white/[0.04]" : "text-[#1F2937] hover:text-[#111827] hover:bg-gray-100"
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Main navigation">
        {sections.map((section) => {
          const items = navItems.filter((item) => item.section === section.key);
          return (
            <div key={section.key} className="mb-3">
              {!collapsed && (
                <p className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-[#6B7280]" : "text-[#374151]"}`}>
                  {t(section.labelKey)}
                </p>
              )}
              {items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href + item.labelKey}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all mb-0.5 ${
                      isActive
                        ? isDark
                          ? "bg-water-blue/10 text-water-blue font-medium"
                          : "bg-blue-100 text-blue-700 font-medium"
                        : isDark
                          ? "text-[#D1D5DB] hover:text-white hover:bg-white/[0.04]"
                          : "text-[#1F2937] hover:text-[#111827] hover:bg-gray-100"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? t(item.labelKey) : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span>{t(item.labelKey)}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t p-3 ${isDark ? "border-white/[0.06]" : "border-[#D1D5DB]"}`}>
        <button
          onClick={() => setSettingsOpen(true)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full ${
            isDark ? "text-[#D1D5DB] hover:text-white hover:bg-white/[0.04]" : "text-[#1F2937] hover:text-[#111827] hover:bg-gray-100"
          } ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? t("sidebar.settings") : undefined}
        >
          <Settings className="w-4 h-4" />
          {!collapsed && <span>{t("sidebar.settings")}</span>}
        </button>
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse_sidebar")}
          className={`hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full ${
            isDark ? "text-[#D1D5DB] hover:text-white hover:bg-white/[0.04]" : "text-[#1F2937] hover:text-[#111827] hover:bg-gray-100"
          } ${collapsed ? "justify-center" : ""}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
          {!collapsed && <span>{t("sidebar.collapse")}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside
        aria-label="Main navigation"
        className={`hidden lg:flex fixed left-0 top-0 h-screen border-r z-50 flex-col transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-[240px]"
        } ${
          isDark ? "bg-[#13161F] border-white/[0.06]" : "bg-white border-[#D1D5DB]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — overlay drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside
            aria-label="Main navigation"
            className={`absolute left-0 top-0 h-full w-[calc(100vw-3rem)] max-w-[280px] flex flex-col shadow-2xl animate-slide-in-left ${
              isDark ? "bg-[#13161F] border-r border-white/[0.06]" : "bg-white border-r border-[#D1D5DB]"
            }`}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
