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
  { href: "/education", labelKey: "sidebar.education", icon: GraduationCap, section: "community" },
  { href: "/education#community", labelKey: "sidebar.community_link", icon: Users, section: "community" },
  { href: "/education#resources", labelKey: "sidebar.open_data", icon: Globe, section: "community" },
  { href: "/admin", labelKey: "sidebar.data_admin", icon: DatabaseZap, section: "admin" },
];

const sections: { key: string; labelKey: TranslationKey }[] = [
  { key: "overview", labelKey: "sidebar.overview" },
  { key: "monitoring", labelKey: "sidebar.monitoring" },
  { key: "research", labelKey: "sidebar.research" },
  { key: "community", labelKey: "sidebar.community" },
  { key: "admin", labelKey: "sidebar.admin" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { mobileOpen, closeMobile } = useSidebar();
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
      <div className={`flex items-center gap-3 px-4 py-5 border-b ${isDark ? "border-panel-border" : "border-slate-200"}`}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-sm flex-shrink-0">
          UDC
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1 min-w-0">
            <h1 className={`font-bold text-sm leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>{t("sidebar.water_resources")}</h1>
            <p className={`text-[10px] leading-tight ${isDark ? "text-slate-300" : "text-slate-500"}`}>{t("sidebar.subtitle")}</p>
          </div>
        )}
        {/* Close button — mobile only */}
        <button
          onClick={closeMobile}
          aria-label={t("sidebar.close_nav")}
          className={`lg:hidden p-1.5 rounded-lg transition-colors ${
            isDark ? "text-slate-400 hover:text-white hover:bg-panel-hover" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {sections.map((section) => {
          const items = navItems.filter((item) => item.section === section.key);
          return (
            <div key={section.key} className="mb-3">
              {!collapsed && (
                <p className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}>
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
                          ? "bg-udc-blue/20 text-water-blue font-medium border border-udc-blue/30"
                          : "bg-blue-50 text-blue-600 font-medium border border-blue-200"
                        : isDark
                          ? "text-slate-400 hover:text-white hover:bg-panel-hover"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
      <div className={`border-t p-3 ${isDark ? "border-panel-border" : "border-slate-200"}`}>
        <button
          onClick={() => setSettingsOpen(true)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full ${
            isDark ? "text-slate-400 hover:text-white hover:bg-panel-hover" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          } ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? t("sidebar.settings") : undefined}
        >
          <Settings className="w-4 h-4" />
          {!collapsed && <span>{t("sidebar.settings")}</span>}
        </button>
        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse_sidebar")}
          className={`hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full ${
            isDark ? "text-slate-400 hover:text-white hover:bg-panel-hover" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
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
          isDark ? "bg-panel-bg border-panel-border" : "bg-white border-slate-200"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — overlay drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMobile}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            aria-label="Main navigation"
            className={`absolute left-0 top-0 h-full w-[280px] flex flex-col shadow-2xl animate-slide-in-left ${
              isDark ? "bg-panel-bg border-r border-panel-border" : "bg-white border-r border-slate-200"
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
