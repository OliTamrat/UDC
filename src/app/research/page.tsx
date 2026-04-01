"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { researchProjects } from "@/data/dc-waterways";
import {
  FlaskConical,
  Calendar,
  User,
  Building2,
  ExternalLink,
  Tag,
  DollarSign,
  Search,
  Filter,
  BookOpen,
  Download,
  Globe,
  ArrowRight,
  BrainCircuit,
} from "lucide-react";
import { useState } from "react";
import { WqisReportModal } from "@/components/ai/WqisReportModal";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { useSidebarClass } from "@/hooks/useSidebarMargin";

const tagColors: Record<string, string> = {
  "green-infrastructure": "bg-green-500/10 text-green-400 border-green-500/20",
  stormwater: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "water-quality": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "urban-agriculture": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  community: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  pfas: "bg-red-500/10 text-red-400 border-red-500/20",
  "emerging-contaminants": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "environmental-justice": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "drinking-water": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "watershed-management": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  collaboration: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "tree-cells": "bg-lime-500/10 text-lime-400 border-lime-500/20",
  "rainwater-reuse": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "rain-gardens": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const allTags = Array.from(new Set(researchProjects.flatMap((p) => p.tags)));

export default function ResearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const sidebarClass = useSidebarClass();

  const filteredProjects = researchProjects.filter((project) => {
    const matchesSearch =
      !searchTerm ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.pi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || project.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? "bg-udc-dark" : "bg-[#F0F1F3]"}`}>
      <Sidebar />
      <main id="main-content" className={`flex-1 ${sidebarClass} min-w-0 overflow-x-hidden`}>
        <Header />
        <div className="p-3 sm:p-4 md:p-6 space-y-6">
          {/* Page Header */}
          <section className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-4 sm:p-6 md:p-8 ${
            isDark
              ? "border-white/[0.06] bg-gradient-to-br from-purple-900/10 via-[#0C0F17] to-[#0C0F17]"
              : "border-[#D1D5DB] bg-gradient-to-br from-white via-purple-50/30 to-[#F9FAFB]"
          }`}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                  Research Portal
                </span>
              </div>
              <h1 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-[#111827]"}`}>
                WRRI & CAUSES Research Projects
              </h1>
              <p className={`text-sm max-w-2xl mb-4 ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>
                Active research initiatives from UDC&apos;s Water Resources Research Institute and
                the College of Agriculture, Urban Sustainability & Environmental Sciences.
                Addressing critical water quality, stormwater management, and environmental justice
                challenges in the District of Columbia.
              </p>
              <button
                onClick={() => setShowReport(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isDark
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20"
                    : "bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200"
                }`}
              >
                <BrainCircuit className="w-4 h-4" />
                Generate AI Report
              </button>
            </div>
          </section>

          {/* WQIS Report Modal */}
          {showReport && <WqisReportModal onClose={() => setShowReport(false)} />}

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`} />
              <input
                type="text"
                placeholder="Search projects, PIs, descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none transition-colors ${
                  isDark
                    ? "bg-[#13161F] border-white/[0.06] text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-udc-blue/50"
                    : "bg-white border-[#D1D5DB] text-[#374151] placeholder:text-[#6B7280] focus:border-blue-400"
                }`}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className={`w-4 h-4 ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`} />
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  !selectedTag
                    ? "bg-water-blue/20 text-water-blue border-water-blue/30"
                    : isDark
                      ? "bg-[#13161F] text-[#D1D5DB] border-white/[0.06] hover:border-white/[0.06]"
                      : "bg-white text-[#374151] border-[#D1D5DB] hover:border-[#9CA3AF]"
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    selectedTag === tag
                      ? tagColors[tag] || "bg-[#6B7280]/10 text-[#D1D5DB] border-[#6B7280]/20"
                      : isDark
                        ? "bg-[#13161F] text-[#D1D5DB] border-white/[0.06] hover:border-white/[0.06]"
                        : "bg-white text-[#374151] border-[#D1D5DB] hover:border-[#9CA3AF]"
                  }`}
                >
                  {tag.replace(/-/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className={`text-xs ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`}>
            Showing {filteredProjects.length} of {researchProjects.length} projects
            {selectedTag && <span> tagged <strong className={isDark ? "text-[#E5E7EB]" : "text-[#374151]"}>{selectedTag.replace(/-/g, " ")}</strong></span>}
            {searchTerm && <span> matching &quot;{searchTerm}&quot;</span>}
          </div>

          {/* Research Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="glass-panel rounded-2xl p-3 sm:p-5 hover:border-purple-500/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <FlaskConical className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border ${
                      project.status === "Active"
                        ? "text-green-400 bg-green-500/10 border-green-500/20"
                        : project.status === "Planning"
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <Link
                    href="/methodology"
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg ${isDark ? "hover:bg-white/[0.04]" : "hover:bg-[#E5E7EB]"}`}
                    title="View methodology & data"
                  >
                    <ExternalLink className={`w-3.5 h-3.5 ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`} />
                  </Link>
                </div>

                <h3 className={`text-sm font-semibold mb-2 leading-snug ${isDark ? "text-white" : "text-[#111827]"}`}>
                  {project.title}
                </h3>

                <p className={`text-xs mb-4 leading-relaxed ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>
                  {project.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className={`flex items-center gap-2 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                    <User className={`w-3.5 h-3.5 ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`} />
                    <span className={`font-medium ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>{project.pi}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                    <Building2 className={`w-3.5 h-3.5 ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`} />
                    <span>{project.department}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                    <Calendar className={`w-3.5 h-3.5 ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`} />
                    <span>
                      {project.startDate} — {project.endDate}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>
                    <DollarSign className={`w-3.5 h-3.5 ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`} />
                    <span>{project.funding}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        tagColors[tag] || "bg-[#6B7280]/10 text-[#D1D5DB] border-[#6B7280]/20"
                      }`}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Links for Researchers */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/methodology"
              className={`glass-panel rounded-2xl p-3 sm:p-5 transition-all hover:scale-[1.02] group ${isDark ? "hover:border-white/[0.06]" : "hover:border-[#9CA3AF] hover:shadow-md"}`}
            >
              <BookOpen className="w-5 h-5 text-blue-400 mb-2" />
              <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>Methodology & Data Dictionary</h3>
              <p className={`text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>
                Sampling protocols, QA/QC procedures, parameter definitions, and EPA threshold documentation.
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs text-[#374151] group-hover:text-water-blue transition-colors">
                View documentation <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
            <a
              href="/api/export?format=csv"
              download
              className={`glass-panel rounded-2xl p-3 sm:p-5 transition-all hover:scale-[1.02] group ${isDark ? "hover:border-white/[0.06]" : "hover:border-[#9CA3AF] hover:shadow-md"}`}
            >
              <Download className="w-5 h-5 text-green-400 mb-2" />
              <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>Export Full Dataset</h3>
              <p className={`text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>
                Download all water quality readings as CSV with citation metadata, source provenance, and station metadata.
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs text-[#374151] group-hover:text-water-blue transition-colors">
                Download CSV <ArrowRight className="w-3 h-3" />
              </div>
            </a>
            <Link
              href="/education#resources"
              className={`glass-panel rounded-2xl p-3 sm:p-5 transition-all hover:scale-[1.02] group ${isDark ? "hover:border-white/[0.06]" : "hover:border-[#9CA3AF] hover:shadow-md"}`}
            >
              <Globe className="w-5 h-5 text-purple-400 mb-2" />
              <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>API & Open Data</h3>
              <p className={`text-xs ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>
                REST API access, Python/R analysis templates, and programmatic data retrieval for research integration.
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs text-[#374151] group-hover:text-water-blue transition-colors">
                Access API docs <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </section>

          {/* Data Sources */}
          <section className="glass-panel rounded-2xl p-3 sm:p-4 md:p-6">
            <h2 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>Data Integration Sources</h2>
            <p className={`text-xs mb-4 ${isDark ? "text-[#D1D5DB]" : "text-[#1F2937]"}`}>
              Partner organizations and external data feeds integrated into the dashboard
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {[
                {
                  name: "DC Dept. of Energy & Environment (DOEE)",
                  description:
                    "River monitoring data, environmental permits, water quality assessments, and CSO tracking.",
                  datasets: ["Water Quality Dashboard", "Rapid Stream Assessment", "Environmental GIS"],
                },
                {
                  name: "EPA Region 3",
                  description:
                    "Federal water quality standards, NPDES permits, Clean Water Act compliance data.",
                  datasets: ["STORET/WQX", "ECHO Database", "Drinking Water Watch"],
                },
                {
                  name: "USGS Water Resources",
                  description:
                    "Stream gauge data, groundwater monitoring, water use statistics, and flood alerts.",
                  datasets: ["NWIS Real-Time", "Stream Stats", "National Water Dashboard"],
                },
                {
                  name: "Anacostia Riverkeeper",
                  description:
                    "Community-based water quality monitoring, recreational safety data, and cleanup events.",
                  datasets: ["Swim Guide Data", "Monitoring Cooperative", "Citizen Science"],
                },
                {
                  name: "DC Water",
                  description:
                    "Wastewater treatment data, CSO tunnel project updates, and sewer infrastructure data.",
                  datasets: ["Clean Rivers Project", "Treatment Plant Data", "CSO Reports"],
                },
                {
                  name: "UDC EQTL",
                  description:
                    "Environmental Quality Testing Lab data including water sampling and contaminant analysis.",
                  datasets: ["Lab Analysis Reports", "Field Sampling Data", "PFAS Testing"],
                },
              ].map((source) => (
                <div
                  key={source.name}
                  className={`rounded-lg border p-4 hover:border-blue-500/30 transition-all ${
                    isDark ? "border-white/[0.06]" : "border-[#D1D5DB] bg-white"
                  }`}
                >
                  <h4 className={`text-xs font-semibold mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>{source.name}</h4>
                  <p className={`text-[10px] mb-3 ${isDark ? "text-[#E5E7EB]" : "text-[#374151]"}`}>{source.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {source.datasets.map((ds) => (
                      <span
                        key={ds}
                        className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      >
                        {ds}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
