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
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? "bg-udc-dark" : "bg-slate-50"}`}>
      <Sidebar />
      <main id="main-content" className="flex-1 lg:ml-[240px] min-w-0 overflow-x-hidden">
        <Header />
        <div className="p-3 sm:p-4 md:p-6 space-y-6">
          {/* Page Header */}
          <section className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-4 sm:p-6 md:p-8 ${
            isDark
              ? "border-panel-border bg-gradient-to-br from-purple-900/20 via-panel-bg to-udc-dark"
              : "border-slate-200 bg-gradient-to-br from-purple-50 via-white to-slate-50"
          }`}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                  Research Portal
                </span>
              </div>
              <h1 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                WRRI & CAUSES Research Projects
              </h1>
              <p className={`text-sm max-w-2xl ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Active research initiatives from UDC&apos;s Water Resources Research Institute and
                the College of Agriculture, Urban Sustainability & Environmental Sciences.
                Addressing critical water quality, stormwater management, and environmental justice
                challenges in the District of Columbia.
              </p>
            </div>
          </section>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-600"}`} />
              <input
                type="text"
                placeholder="Search projects, PIs, descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none transition-colors ${
                  isDark
                    ? "bg-panel-bg border-panel-border text-slate-300 placeholder:text-slate-600 focus:border-udc-blue/50"
                    : "bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-blue-400"
                }`}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-600"}`} />
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  !selectedTag
                    ? "bg-water-blue/20 text-water-blue border-water-blue/30"
                    : isDark
                      ? "bg-panel-bg text-slate-400 border-panel-border hover:border-slate-500"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
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
                      ? tagColors[tag] || "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      : isDark
                        ? "bg-panel-bg text-slate-400 border-panel-border hover:border-slate-500"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {tag.replace(/-/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Showing {filteredProjects.length} of {researchProjects.length} projects
            {selectedTag && <span> tagged <strong className={isDark ? "text-slate-300" : "text-slate-700"}>{selectedTag.replace(/-/g, " ")}</strong></span>}
            {searchTerm && <span> matching &quot;{searchTerm}&quot;</span>}
          </div>

          {/* Research Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="glass-panel rounded-xl p-3 sm:p-5 hover:border-purple-500/30 transition-all group"
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
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg ${isDark ? "hover:bg-panel-hover" : "hover:bg-slate-100"}`}
                    title="View methodology & data"
                  >
                    <ExternalLink className={`w-3.5 h-3.5 ${isDark ? "text-slate-300" : "text-slate-500"}`} />
                  </Link>
                </div>

                <h3 className={`text-sm font-semibold mb-2 leading-snug ${isDark ? "text-white" : "text-slate-900"}`}>
                  {project.title}
                </h3>

                <p className={`text-xs mb-4 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {project.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className={`flex items-center gap-2 text-xs ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                    <User className={`w-3.5 h-3.5 ${isDark ? "text-slate-400" : "text-slate-600"}`} />
                    <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{project.pi}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                    <Building2 className={`w-3.5 h-3.5 ${isDark ? "text-slate-400" : "text-slate-600"}`} />
                    <span>{project.department}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                    <Calendar className={`w-3.5 h-3.5 ${isDark ? "text-slate-400" : "text-slate-600"}`} />
                    <span>
                      {project.startDate} — {project.endDate}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                    <DollarSign className={`w-3.5 h-3.5 ${isDark ? "text-slate-400" : "text-slate-600"}`} />
                    <span>{project.funding}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        tagColors[tag] || "bg-slate-500/10 text-slate-400 border-slate-500/20"
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
              className={`glass-panel rounded-xl p-3 sm:p-5 transition-all hover:scale-[1.02] group ${isDark ? "hover:border-slate-600" : "hover:border-slate-300 hover:shadow-md"}`}
            >
              <BookOpen className="w-5 h-5 text-blue-400 mb-2" />
              <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Methodology & Data Dictionary</h3>
              <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Sampling protocols, QA/QC procedures, parameter definitions, and EPA threshold documentation.
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs text-slate-500 group-hover:text-water-blue transition-colors">
                View documentation <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
            <a
              href="/api/export?format=csv"
              download
              className={`glass-panel rounded-xl p-3 sm:p-5 transition-all hover:scale-[1.02] group ${isDark ? "hover:border-slate-600" : "hover:border-slate-300 hover:shadow-md"}`}
            >
              <Download className="w-5 h-5 text-green-400 mb-2" />
              <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Export Full Dataset</h3>
              <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Download all water quality readings as CSV with citation metadata, source provenance, and station metadata.
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs text-slate-500 group-hover:text-water-blue transition-colors">
                Download CSV <ArrowRight className="w-3 h-3" />
              </div>
            </a>
            <Link
              href="/education#resources"
              className={`glass-panel rounded-xl p-3 sm:p-5 transition-all hover:scale-[1.02] group ${isDark ? "hover:border-slate-600" : "hover:border-slate-300 hover:shadow-md"}`}
            >
              <Globe className="w-5 h-5 text-purple-400 mb-2" />
              <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>API & Open Data</h3>
              <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                REST API access, Python/R analysis templates, and programmatic data retrieval for research integration.
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs text-slate-500 group-hover:text-water-blue transition-colors">
                Access API docs <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </section>

          {/* Data Sources */}
          <section className="glass-panel rounded-xl p-3 sm:p-4 md:p-6">
            <h2 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Data Integration Sources</h2>
            <p className={`text-xs mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
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
                    isDark ? "border-panel-border" : "border-slate-200 bg-white"
                  }`}
                >
                  <h4 className={`text-xs font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{source.name}</h4>
                  <p className={`text-[10px] mb-3 ${isDark ? "text-slate-300" : "text-slate-500"}`}>{source.description}</p>
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
