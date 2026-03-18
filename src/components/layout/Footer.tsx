"use client";

import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Droplets,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  FileDown,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Database,
  Info,
} from "lucide-react";

export default function Footer() {
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";

  const linkClass = `transition-colors ${
    isDark ? "text-slate-400 hover:text-udc-gold" : "text-slate-600 hover:text-udc-red"
  }`;

  return (
    <footer
      className={`border-t mt-8 ${
        isDark ? "border-panel-border bg-udc-dark/50" : "border-slate-200 bg-slate-50/80"
      }`}
    >
      {/* Main footer grid */}
      <div className="px-4 sm:px-6 pt-8 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Column 1: Branding */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-xs flex-shrink-0">
                UDC
              </div>
              <div>
                <p
                  className={`text-sm font-semibold leading-tight ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {t("footer.udc_full")}
                </p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {t("footer.causes_full")}
                </p>
              </div>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {t("footer.mission")}
            </p>
          </div>

          {/* Column 2: Institute & Contact */}
          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDark ? "text-slate-300" : "text-slate-800"
              }`}
            >
              {t("footer.institute")}
            </h3>
            <ul className="space-y-2 text-xs">
              <li className={isDark ? "text-slate-400" : "text-slate-600"}>
                <span className="font-medium">{t("footer.wrri")}</span> (WRRI)
              </li>
              <li className={isDark ? "text-slate-400" : "text-slate-600"}>
                Center for Urban Resilience, Innovation &amp; Infrastructure (CURII)
              </li>
              <li className={isDark ? "text-slate-400" : "text-slate-600"}>
                Environmental Quality Testing Laboratory (EQTL)
              </li>
              <li className="pt-1">
                <div className={`flex items-start gap-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-udc-gold" />
                  <span>4200 Connecticut Ave NW<br />Washington, DC 20008</span>
                </div>
              </li>
              <li>
                <a href="mailto:wrri@udc.edu" className={`flex items-center gap-2 ${linkClass}`}>
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  wrri@udc.edu
                </a>
              </li>
              <li>
                <a href="tel:+12022746406" className={`flex items-center gap-2 ${linkClass}`}>
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  (202) 274-6406
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDark ? "text-slate-300" : "text-slate-800"
              }`}
            >
              {t("footer.quick_links")}
            </h3>
            <ul className="space-y-2 text-xs">
              {[
                { href: "/about", label: "About & Disclaimer", icon: Info },
                { href: "/research", label: t("footer.research_portal"), icon: FlaskConical },
                { href: "/education", label: t("footer.education_outreach"), icon: GraduationCap },
                { href: "/methodology", label: t("footer.methodology_sources"), icon: BookOpen },
                { href: "/api/export?format=csv", label: t("footer.export_csv"), icon: FileDown },
                { href: "/api/export?format=json", label: t("footer.export_json"), icon: FileDown },
              ].map((link) => (
                <li key={link.href + link.label}>
                  <a href={link.href} className={`flex items-center gap-2 ${linkClass}`}>
                    <link.icon className="w-3.5 h-3.5 shrink-0" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Data Sources */}
          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDark ? "text-slate-300" : "text-slate-800"
              }`}
            >
              {t("footer.data_sources")}
            </h3>
            <ul className="space-y-2 text-xs">
              {[
                {
                  label: "USGS NWIS — National Water Information System",
                  href: "https://waterdata.usgs.gov/nwis",
                },
                {
                  label: "EPA Water Quality Portal",
                  href: "https://www.waterqualitydata.us/",
                },
                {
                  label: "DC DOEE — Dept. of Energy & Environment",
                  href: "https://doee.dc.gov/",
                },
                {
                  label: "DC Open Data — GIS & Geospatial",
                  href: "https://opendata.dc.gov/",
                },
                {
                  label: "Anacostia Riverkeeper",
                  href: "https://www.anacostiariverkeeper.org/",
                },
              ].map((src) => (
                <li key={src.label}>
                  <a
                    href={src.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 ${linkClass}`}
                  >
                    <Database className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{src.label}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Attribution bar */}
      <div
        className={`border-t px-4 sm:px-6 py-4 ${
          isDark ? "border-panel-border/50 bg-udc-dark/80" : "border-slate-200/80 bg-slate-100/60"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className={`text-[11px] text-center sm:text-left leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {t("footer.built_by")}{" "}
            <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Olink Technologies Inc
            </span>{" "}
            {t("footer.and")}{" "}
            <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              DAPS Analytics
            </span>{" "}
            {t("footer.in_collaboration")}{" "}
            <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Dr. Tolessa Deksissa
            </span>
            {t("footer.director_title")}
          </p>
          <div className={`flex items-center gap-1.5 shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            <Droplets className="w-3.5 h-3.5" />
            <span className="text-[10px]">
              &copy; {new Date().getFullYear()} UDC CAUSES / WRRI
            </span>
          </div>
        </div>
      </div>

      {/* Funding line */}
      <div
        className={`border-t text-center px-4 py-2 ${
          isDark ? "border-panel-border/30" : "border-slate-200/50"
        }`}
      >
        <p className={`text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>
          {t("footer.funded")}
        </p>
      </div>
    </footer>
  );
}
