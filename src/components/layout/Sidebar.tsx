"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, section: "overview" },
  { href: "/#map", label: "Interactive Map", icon: Map, section: "overview" },
  { href: "/#water-quality", label: "Water Quality", icon: Droplets, section: "monitoring" },
  { href: "/#stormwater", label: "Stormwater", icon: TreePine, section: "monitoring" },
  { href: "/#analytics", label: "Analytics", icon: BarChart3, section: "monitoring" },
  { href: "/research", label: "Research", icon: FlaskConical, section: "research" },
  { href: "/education", label: "Education", icon: GraduationCap, section: "community" },
  { href: "/education#community", label: "Community", icon: Users, section: "community" },
  { href: "/education#resources", label: "Open Data", icon: Globe, section: "community" },
];

const sections = [
  { key: "overview", label: "OVERVIEW" },
  { key: "monitoring", label: "MONITORING" },
  { key: "research", label: "RESEARCH" },
  { key: "community", label: "COMMUNITY" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-panel-bg border-r border-panel-border z-50 flex flex-col transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-panel-border">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-sm flex-shrink-0">
          UDC
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm text-white leading-tight">Water Resources</h1>
            <p className="text-[10px] text-slate-400 leading-tight">CAUSES / WRRI Dashboard</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {sections.map((section) => {
          const items = navItems.filter((item) => item.section === section.key);
          return (
            <div key={section.key} className="mb-3">
              {!collapsed && (
                <p className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {section.label}
                </p>
              )}
              {items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all mb-0.5 ${
                      isActive
                        ? "bg-udc-blue/20 text-water-blue font-medium border border-udc-blue/30"
                        : "text-slate-400 hover:text-white hover:bg-panel-hover"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-panel-border p-3">
        <Link
          href="#settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-panel-hover transition-all ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Settings className="w-4 h-4" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-panel-hover transition-all w-full ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
