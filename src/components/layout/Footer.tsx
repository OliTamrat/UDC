"use client";

import { institution } from "@/config/site.config";
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
    isDark ? "text-[#D1D5DB] hover:text-udc-gold" : "text-[#1F2937] hover:text-udc-red"
  }`;

  return (
    <footer
      className={`border-t mt-8 ${
        isDark ? "border-white/[0.06] bg-[#0C0F17]/50" : "border-[#D1D5DB] bg-[#F0F1F3]/80"
      }`}
    >
      {/* Main footer grid */}
      <div className="px-4 sm:px-6 pt-8 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Column 1: Branding */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-xs flex-shrink-0">
                {institution.shortName}
              </div>
              <div>
                <p
                  className={`text-sm font-semibold leading-tight ${
                    isDark ? "text-white" : "text-[#111827]"
                  }`}
                >
                  {t("footer.udc_full")}
                </p>
                <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
                  {t("footer.causes_full")}
                </p>
              </div>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`}>
              {t("footer.mission")}
            </p>
          </div>

          {/* Column 2: Institute & Contact */}
          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"
              }`}
            >
              {t("footer.institute")}
            </h3>
            <ul className="space-y-2 text-xs">
              <li className={isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}>
                <span className="font-medium">{t("footer.wrri")}</span> ({institution.instituteAcronym})
              </li>
              <li className={isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}>
                Center for Urban Resilience, Innovation &amp; Infrastructure (CURII)
              </li>
              <li className={isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}>
                Environmental Quality Testing Laboratory (EQTL)
              </li>
              <li className="pt-1">
                <div className={`flex items-start gap-2 ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`}>
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-udc-gold" />
                  <span>{institution.contact.address}<br />{institution.contact.city}, {institution.contact.state} {institution.contact.zip}</span>
                </div>
              </li>
              <li>
                <a href={`mailto:${institution.contact.email}`} className={`flex items-center gap-2 ${linkClass}`}>
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {institution.contact.email}
                </a>
              </li>
              <li>
                <a href={`tel:${institution.contact.phone.replace(/\D/g, "")}`} className={`flex items-center gap-2 ${linkClass}`}>
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {institution.contact.phone}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"
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
                isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"
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
          isDark ? "border-white/[0.06] bg-udc-dark/80" : "border-[#D1D5DB]/80 bg-[#E5E7EB]/60"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className={`text-[11px] text-center sm:text-left leading-relaxed ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
            {t("footer.built_by")}{" "}
            <span className={`font-semibold ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
              {institution.partners[0].name}
            </span>{" "}
            {t("footer.and")}{" "}
            <span className={`font-semibold ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
              {institution.partners[1].name}
            </span>{" "}
            {t("footer.in_collaboration")}{" "}
            <span className={`font-semibold ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
              {institution.principalInvestigator}
            </span>
            {t("footer.director_title")}
          </p>
          <div className={`flex items-center gap-1.5 shrink-0 ${isDark ? "text-[#6B7280]" : "text-[#D1D5DB]"}`}>
            <Droplets className="w-3.5 h-3.5" />
            <span className="text-[10px]">
              &copy; {new Date().getFullYear()} {institution.shortName} {institution.departmentAcronym} / {institution.instituteAcronym}
            </span>
          </div>
        </div>
      </div>

      {/* Funding line */}
      <div
        className={`border-t text-center px-4 py-2 ${
          isDark ? "border-white/[0.06]" : "border-[#D1D5DB]/50"
        }`}
      >
        <p className={`text-[10px] ${isDark ? "text-[#6B7280]" : "text-[#D1D5DB]"}`}>
          {t("footer.funded")}
        </p>
      </div>
    </footer>
  );
}
