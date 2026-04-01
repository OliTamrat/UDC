"use client";

import { institution, watershed } from "@/config/site.config";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useTheme } from "@/context/ThemeContext";
import {
  GraduationCap,
  Building2,
  Landmark,
  Code2,
  BarChart3,
  Users,
  ShieldCheck,
  Droplets,
  ExternalLink,
  Mail,
} from "lucide-react";
import { useSidebarClass } from "@/hooks/useSidebarMargin";

export default function AboutPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const sidebarClass = useSidebarClass();

  const cardClass = `rounded-xl border p-6 ${
    isDark ? "bg-[#13161F]/90 border-white/[0.06]" : "bg-white border-[#D1D5DB] shadow-sm"
  }`;

  const headingClass = `text-lg font-bold mb-3 ${isDark ? "text-white" : "text-[#111827]"}`;

  const textClass = `text-sm leading-relaxed ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`;

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? "bg-udc-dark" : "bg-[#F0F1F3]"}`}>
      <Sidebar />
      <main id="main-content" className={`flex-1 ${sidebarClass} min-w-0 overflow-x-hidden`}>
        <Header />
        <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">

          {/* Hero */}
          <section
            className={`relative overflow-hidden rounded-2xl border p-8 md:p-10 ${
              isDark
                ? "border-white/[0.06] bg-gradient-to-br from-[#13161F] via-[#0C0F17] to-[#0C0F17]"
                : "border-[#D1D5DB] bg-gradient-to-br from-white via-blue-50/30 to-[#F9FAFB] shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center font-extrabold text-white text-sm">
                {institution.shortName}
              </div>
              <div>
                <h1 className={`text-2xl lg:text-3xl font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>
                  About This Dashboard
                </h1>
                <p className={`text-sm ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
                  Project attribution, purpose &amp; disclaimer
                </p>
              </div>
            </div>
          </section>

          {/* Project Purpose */}
          <section className={cardClass}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-500/15" : "bg-blue-100"}`}>
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className={headingClass}>Project Purpose</h2>
            </div>
            <p className={textClass}>
              The {institution.shortName} Water Resources Dashboard is a data integration and visualization platform
              created to support teaching, learning, research, and public service within the{" "}
              {institution.name} ({institution.shortName}). It is designed to benefit:
            </p>
            <ul className={`mt-4 space-y-3 ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>
              {[
                { icon: GraduationCap, text: `${institution.shortName} ${institution.departmentAcronym} / ${institution.instituteAcronym} faculty, staff, and students` },
                { icon: Users, text: "Researchers and environmental professionals" },
                { icon: Landmark, text: "District of Columbia government agencies" },
                { icon: BarChart3, text: `The general public seeking accessible ${watershed.name} water-resource information` },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3 text-sm">
                  <item.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? "text-udc-gold" : "text-amber-500"}`} />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Project Origin & Funding */}
          <section className={cardClass}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-amber-500/15" : "bg-amber-100"}`}>
                <Landmark className="w-4 h-4 text-amber-400" />
              </div>
              <h2 className={headingClass}>Project Origin &amp; Funding</h2>
            </div>
            <div className="space-y-3">
              <p className={textClass}>
                This project was proposed and academically guided by{" "}
                <strong className={isDark ? "text-white" : "text-[#111827]"}>{institution.principalInvestigator}</strong>,
                Faculty Head of the {institution.institute} ({institution.instituteAcronym}) at the{" "}
                {institution.name}.
              </p>
              <div className={`flex items-start gap-3 p-4 rounded-lg ${isDark ? "bg-udc-gold/5 border border-udc-gold/20" : "bg-amber-100 border border-amber-100"}`}>
                <Landmark className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? "text-udc-gold" : "text-amber-600"}`} />
                <p className={`text-sm ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>
                  This initiative is funded by the{" "}
                  <strong className={isDark ? "text-white" : "text-[#111827]"}>District of Columbia Government</strong>{" "}
                  as part of its commitment to environmental data accessibility and water-resource resilience.
                </p>
              </div>
            </div>
          </section>

          {/* Design & Development */}
          <section className={cardClass}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-purple-500/15" : "bg-purple-100"}`}>
                <Code2 className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className={headingClass}>Design &amp; Development</h2>
            </div>
            <p className={`${textClass} mb-4`}>
              Although the project was proposed by {institution.shortName} {institution.instituteAcronym} and funded by the DC Government, the full
              design, engineering, and implementation of the platform were carried out by:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Olink Technologies */}
              <div className={`rounded-xl border p-5 ${isDark ? "bg-[#1F2937]/50 border-white/[0.06]" : "bg-[#F0F1F3] border-[#D1D5DB]"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-500/15" : "bg-blue-100"}`}>
                    <Building2 className="w-4.5 h-4.5 text-blue-400" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>{institution.partners[0].name}</p>
                    <p className={`text-[11px] ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>Software Engineering &amp; Architecture</p>
                  </div>
                </div>
              </div>

              {/* DAPS Analytics */}
              <div className={`rounded-xl border p-5 ${isDark ? "bg-[#1F2937]/50 border-white/[0.06]" : "bg-[#F0F1F3] border-[#D1D5DB]"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? "bg-emerald-500/15" : "bg-emerald-100"}`}>
                    <BarChart3 className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>{institution.partners[1].name}</p>
                    <p className={`text-[11px] ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>Data Analytics &amp; Visualization</p>
                  </div>
                </div>
              </div>
            </div>
            <p className={textClass}>
              These organizations collaborated closely with {institution.principalInvestigator} and the {institution.shortName} {institution.instituteAcronym} team
              to ensure the platform meets academic, research, and public-service needs.
            </p>
          </section>

          {/* Disclaimer */}
          <section
            className={`rounded-xl border-2 p-6 ${
              isDark
                ? "bg-red-950/10 border-udc-red/30"
                : "bg-red-100/50 border-red-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-red-500/15" : "bg-red-100"}`}>
                <ShieldCheck className="w-4 h-4 text-red-400" />
              </div>
              <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-[#111827]"}`}>Disclaimer</h2>
            </div>
            <div className={`space-y-3 text-sm leading-relaxed ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>
              <p>
                This dashboard is a collaborative project. While {institution.shortName} {institution.instituteAcronym} provides scientific guidance
                and project direction, the software, architecture, and technical development are the
                intellectual work of{" "}
                <strong className={isDark ? "text-white" : "text-[#111827]"}>{institution.partners[0].name}</strong> and{" "}
                <strong className={isDark ? "text-white" : "text-[#111827]"}>{institution.partners[1].name}</strong>.
              </p>
              <p>
                The platform is provided for educational, research, and public informational purposes.
                It should <strong className={isDark ? "text-red-300" : "text-red-700"}>not</strong> be
                used as the sole basis for legal, regulatory, or emergency decision-making.
              </p>
              <p>
                Data is sourced from public federal APIs (USGS NWIS, EPA Water Quality Portal) and
                local DC government datasets. While we strive for accuracy, sensor data may contain
                gaps, calibration offsets, or transmission errors inherent to field instrumentation.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className={cardClass}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-green-500/15" : "bg-green-100"}`}>
                <Mail className="w-4 h-4 text-green-400" />
              </div>
              <h2 className={headingClass}>Contact</h2>
            </div>
            <p className={`${textClass} mb-4`}>
              For questions about this project, the data, or partnership inquiries:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`rounded-lg p-4 ${isDark ? "bg-[#1F2937]/50" : "bg-[#F0F1F3]"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
                  Academic &amp; Research
                </p>
                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#111827]"}`}>
                  {institution.principalInvestigator}
                </p>
                <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
                  {institution.instituteAcronym} Director, {institution.shortName} {institution.departmentAcronym}
                </p>
                <a
                  href={`mailto:${institution.contact.email}`}
                  className={`inline-flex items-center gap-1.5 text-xs mt-2 transition-colors ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                >
                  <Mail className="w-3 h-3" /> {institution.contact.email}
                </a>
              </div>
              <div className={`rounded-lg p-4 ${isDark ? "bg-[#1F2937]/50" : "bg-[#F0F1F3]"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
                  Technical &amp; Development
                </p>
                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#111827]"}`}>
                  {institution.partners[0].name}
                </p>
                <p className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
                  Platform Design &amp; Engineering
                </p>
                <a
                  href={institution.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 text-xs mt-2 transition-colors ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                >
                  <ExternalLink className="w-3 h-3" /> {institution.shortName} {institution.instituteAcronym} Website
                </a>
              </div>
            </div>
          </section>
        </div>

        <Footer />
      </main>
    </div>
  );
}
