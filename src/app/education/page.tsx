"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useTheme } from "@/context/ThemeContext";
import {
  GraduationCap,
  BookOpen,
  Users,
  Globe,
  Droplets,
  TreePine,
  Microscope,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Video,
  Calendar,
  MapPin,
  ArrowRight,
  Leaf,
  Waves,
  AlertTriangle,
} from "lucide-react";

const educationalModules = [
  {
    title: "Understanding the Anacostia",
    icon: Waves,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    level: "Beginner",
    description:
      "Learn about the Anacostia River's history, ecology, and current restoration efforts. Explore how urbanization has impacted water quality and what's being done to restore this vital waterway.",
    topics: [
      "River history & geography",
      "Urban watershed ecology",
      "Current restoration initiatives",
      "Community cleanup efforts",
    ],
    duration: "30 min",
  },
  {
    title: "Water Quality 101",
    icon: Droplets,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    level: "Beginner",
    description:
      "Understand key water quality parameters including dissolved oxygen, pH, turbidity, and E. coli. Learn how to read monitoring data and what it means for public health.",
    topics: [
      "Key water quality parameters",
      "EPA standards explained",
      "Reading monitoring data",
      "Public health implications",
    ],
    duration: "45 min",
  },
  {
    title: "Green Infrastructure Solutions",
    icon: TreePine,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    level: "Intermediate",
    description:
      "Explore how green roofs, rain gardens, bioswales, and tree cells manage stormwater in urban settings. See real examples from UDC's research sites across DC.",
    topics: [
      "Green roof technology",
      "Rain garden design",
      "Bioswale engineering",
      "Tree cell filtration systems",
    ],
    duration: "60 min",
  },
  {
    title: "Environmental Justice & Water",
    icon: AlertTriangle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    level: "Intermediate",
    description:
      "Examine how water quality impacts are disproportionately felt in DC's underserved communities. Analyze ward-level data on CSO events, flooding, and green space access.",
    topics: [
      "Environmental justice framework",
      "Ward-level disparities",
      "CSO impacts on communities",
      "Policy and advocacy tools",
    ],
    duration: "50 min",
  },
  {
    title: "Stormwater Data Analysis",
    icon: Microscope,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    level: "Advanced",
    description:
      "Hands-on data analysis using real stormwater monitoring datasets from UDC research sites. Learn statistical methods for environmental data interpretation.",
    topics: [
      "Data collection methods",
      "Statistical analysis techniques",
      "Visualization with Python/R",
      "Publishing research findings",
    ],
    duration: "90 min",
  },
  {
    title: "Emerging Contaminants",
    icon: Leaf,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    level: "Advanced",
    description:
      "Deep dive into PFAS, pharmaceuticals, microplastics, and other emerging contaminants in DC waterways. Understand detection methods and health risk assessments.",
    topics: [
      "PFAS in water systems",
      "Pharmaceutical contamination",
      "Microplastics detection",
      "Risk characterization methods",
    ],
    duration: "75 min",
  },
];

const communityEvents = [
  {
    title: "Anacostia River Cleanup Day",
    date: "April 12, 2026",
    location: "Anacostia Park",
    type: "Community",
    description: "Join UDC students and community members for the annual spring cleanup along the Anacostia River.",
  },
  {
    title: "Water Quality Workshop",
    date: "April 25, 2026",
    location: "UDC Van Ness Campus",
    type: "Workshop",
    description: "Hands-on workshop learning to use water quality testing kits. Open to DC residents.",
  },
  {
    title: "WRRI Research Symposium",
    date: "May 8, 2026",
    location: "UDC Auditorium",
    type: "Academic",
    description: "Annual presentation of WRRI research findings. Faculty, students, and public welcome.",
  },
  {
    title: "Green Infrastructure Tour",
    date: "May 15, 2026",
    location: "Multiple UDC Sites",
    type: "Tour",
    description: "Guided tour of UDC's green infrastructure installations including green roofs and rain gardens.",
  },
];

const openDatasets = [
  {
    name: "Anacostia Water Quality (2020-2026)",
    format: "CSV / JSON",
    size: "12.4 MB",
    records: "45,000+",
    description: "Historical water quality measurements from all Anacostia monitoring stations.",
  },
  {
    name: "Stormwater BMP Performance",
    format: "CSV",
    size: "3.8 MB",
    records: "12,000+",
    description: "Green infrastructure performance data including retention rates and water quality improvements.",
  },
  {
    name: "DC Ward Environmental Data",
    format: "GeoJSON / CSV",
    size: "8.2 MB",
    records: "2,400+",
    description: "Ward-level environmental justice indicators including CSO events, impervious surfaces, and green space.",
  },
  {
    name: "UDC Green Roof Monitoring",
    format: "CSV",
    size: "5.1 MB",
    records: "18,000+",
    description: "Detailed measurements from UDC's experimental green roof installations.",
  },
];

export default function EducationPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? "bg-udc-dark" : "bg-slate-50"}`}>
      <Sidebar />
      <main id="main-content" className="flex-1 ml-[240px]">
        <Header />
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <section className={`relative overflow-hidden rounded-2xl border p-8 ${
            isDark
              ? "border-panel-border bg-gradient-to-br from-emerald-900/20 via-panel-bg to-udc-dark"
              : "border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50"
          }`}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Education & Outreach
                </span>
              </div>
              <h1 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                Learn About DC&apos;s Water Resources
              </h1>
              <p className={`text-sm max-w-2xl ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Educational resources for DC residents, UDC students, and faculty. From
                introductory water quality concepts to advanced data analysis — empowering informed
                stewardship of our waterways.
              </p>
            </div>
          </section>

          {/* Audience Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "DC Community",
                icon: Users,
                color: "text-blue-400",
                bgColor: "bg-blue-500/10",
                borderColor: "border-blue-500/20",
                description: "Accessible information about water quality, safety, and how to get involved in watershed protection.",
              },
              {
                title: "UDC Students",
                icon: GraduationCap,
                color: "text-green-400",
                bgColor: "bg-green-500/10",
                borderColor: "border-green-500/20",
                description: "Course materials, datasets for analysis, and research opportunities in environmental science.",
              },
              {
                title: "Faculty & Researchers",
                icon: Microscope,
                color: "text-purple-400",
                bgColor: "bg-purple-500/10",
                borderColor: "border-purple-500/20",
                description: "Open datasets, API access, collaboration tools, and publication resources for water research.",
              },
            ].map((audience) => (
              <div
                key={audience.title}
                className={`glass-panel rounded-xl p-5 cursor-pointer hover:${audience.borderColor} transition-all group`}
              >
                <div className={`p-3 rounded-lg ${audience.bgColor} w-fit mb-3`}>
                  <audience.icon className={`w-5 h-5 ${audience.color}`} />
                </div>
                <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{audience.title}</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{audience.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-slate-500 group-hover:text-water-blue transition-colors">
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>

          {/* Educational Modules */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Learning Modules</h2>
                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                  Self-paced educational content for all knowledge levels
                </p>
              </div>
              <div className="flex gap-2">
                {["All", "Beginner", "Intermediate", "Advanced"].map((level) => (
                  <button
                    key={level}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      isDark
                        ? "bg-panel-bg border-panel-border text-slate-400 hover:border-slate-500"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {educationalModules.map((module) => (
                <div
                  key={module.title}
                  className={`glass-panel rounded-xl p-5 hover:${module.borderColor} transition-all group cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${module.bgColor}`}>
                      <module.icon className={`w-4 h-4 ${module.color}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{module.duration}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          module.level === "Beginner"
                            ? "text-green-400 bg-green-500/10 border-green-500/20"
                            : module.level === "Intermediate"
                            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                            : "text-red-400 bg-red-500/10 border-red-500/20"
                        }`}
                      >
                        {module.level}
                      </span>
                    </div>
                  </div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>{module.title}</h3>
                  <p className={`text-xs mb-3 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    {module.description}
                  </p>
                  <ul className="space-y-1.5">
                    {module.topics.map((topic) => (
                      <li key={topic} className={`flex items-center gap-2 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                        <BookOpen className={`w-3 h-3 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                        {topic}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-1 mt-4 text-xs text-slate-500 group-hover:text-water-blue transition-colors">
                    <span>Start learning</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Community Events */}
          <section id="community">
            <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Community Events</h2>
            <p className={`text-xs mb-4 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              Upcoming opportunities to engage with DC water resources
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {communityEvents.map((event) => (
                <div
                  key={event.title}
                  className="glass-panel rounded-xl p-5 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-medium text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {event.type}
                    </span>
                  </div>
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{event.title}</h3>
                  <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{event.description}</p>
                  <div className={`flex items-center gap-4 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Analysis Templates */}
          <section>
            <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Analysis Templates</h2>
            <p className={`text-xs mb-4 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              Download ready-to-use scripts that fetch real data from the dashboard API
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  name: "Python Analysis Template",
                  file: "/templates/udc_water_analysis.py",
                  lang: "Python",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                  borderColor: "border-blue-500/20",
                  description: "Pandas + Matplotlib script: fetches station data, calculates summary stats, checks EPA compliance, and generates publication-ready charts.",
                  requires: "pip install requests pandas matplotlib",
                },
                {
                  name: "R Analysis Template",
                  file: "/templates/udc_water_analysis.R",
                  lang: "R",
                  color: "text-green-400",
                  bg: "bg-green-500/10",
                  borderColor: "border-green-500/20",
                  description: "tidyverse + ggplot2 script: fetches station data, performs statistical analysis, EPA compliance checks, and multi-parameter visualizations.",
                  requires: 'install.packages(c("httr", "jsonlite", "ggplot2", "dplyr", "tidyr"))',
                },
              ].map((tmpl) => (
                <div
                  key={tmpl.file}
                  className="glass-panel rounded-xl p-5 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${tmpl.bg}`}>
                      <FileSpreadsheet className={`w-4 h-4 ${tmpl.color}`} />
                    </div>
                    <a
                      href={tmpl.file}
                      download
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-water-blue/20 text-water-blue text-xs border border-water-blue/30 hover:bg-water-blue/30 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download .{tmpl.lang === "Python" ? "py" : "R"}
                    </a>
                  </div>
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{tmpl.name}</h3>
                  <p className={`text-xs mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{tmpl.description}</p>
                  <code className={`text-[10px] block p-2 rounded ${isDark ? "bg-udc-dark/50 text-slate-500" : "bg-slate-100 text-slate-500"}`}>
                    {tmpl.requires}
                  </code>
                </div>
              ))}
            </div>
          </section>

          {/* Open Data */}
          <section id="resources">
            <h2 className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Open Data Portal</h2>
            <p className={`text-xs mb-4 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              Download research datasets for analysis and education
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openDatasets.map((dataset) => (
                <div
                  key={dataset.name}
                  className="glass-panel rounded-xl p-5 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-3 py-1 rounded-lg bg-water-blue/20 text-water-blue text-xs border border-water-blue/30">
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{dataset.name}</h3>
                  <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{dataset.description}</p>
                  <div className={`flex items-center gap-4 text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                    <span>Format: {dataset.format}</span>
                    <span>Size: {dataset.size}</span>
                    <span>Records: {dataset.records}</span>
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
