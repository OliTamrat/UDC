"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useTheme } from "@/context/ThemeContext";
import Modal from "@/components/Modal";
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
  Target,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Fish,
  Thermometer,
  Activity,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Educational modules — enriched with learning outcomes and key takeaways
// ---------------------------------------------------------------------------
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
    outcomes: [
      "Describe the Anacostia watershed geography and its 176 square-mile drainage area",
      "Explain how impervious surfaces increase stormwater runoff volume and pollutant loading",
      "Identify three major restoration programs (DC Clean Rivers, Anacostia Waterfront Initiative, DOEE MS4)",
      "Recognize the historical role of environmental racism in the Anacostia's degradation",
    ],
    keyFact: "The Anacostia River drains a 176 square-mile watershed across DC, Maryland, and Virginia, serving over 800,000 residents. Over 70% of its watershed is covered by impervious surfaces.",
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
    outcomes: [
      "Define dissolved oxygen, pH, turbidity, conductivity, and E. coli and their units",
      "Explain EPA water quality criteria under the Clean Water Act Section 304(a)",
      "Interpret a water quality monitoring report and identify compliance issues",
      "Describe how combined sewer overflows (CSOs) affect E. coli levels and recreational safety",
    ],
    keyFact: "Dissolved oxygen below 5 mg/L means fish can't survive. The Anacostia frequently drops below this threshold in summer when warm temperatures reduce oxygen solubility.",
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
    outcomes: [
      "Compare pollutant removal efficiency across four types of green infrastructure",
      "Calculate stormwater retention volume for a simple rain garden design",
      "Analyze real performance data from UDC's green infrastructure monitoring stations",
      "Evaluate cost-effectiveness of green vs. grey infrastructure solutions",
    ],
    keyFact: "UDC's green roof research station captures 60-80% of rainfall, reducing stormwater runoff that would otherwise carry pollutants directly to the Anacostia.",
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
    outcomes: [
      "Apply EPA's EJ framework to analyze disproportionate environmental burdens in DC Wards 7 and 8",
      "Interpret ward-level CSO, impervious surface, and green space data from this dashboard",
      "Describe the relationship between income, race, flood risk, and water quality in DC",
      "Identify community-driven policy tools for environmental justice advocacy",
    ],
    keyFact: "DC's Ward 8 has the highest flood risk, fewest green spaces (28%), and most CSO overflow events (45/year) — yet has the least political representation in environmental policy.",
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
    outcomes: [
      "Fetch and clean water quality data from the UDC dashboard API using Python or R",
      "Perform time-series analysis to identify seasonal patterns and trends",
      "Apply EPA compliance threshold checks programmatically to large datasets",
      "Create publication-quality charts using matplotlib or ggplot2",
    ],
    keyFact: "Download our Python and R templates from the Analysis Templates section below — they connect directly to this dashboard's API with real data.",
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
    outcomes: [
      "Explain the bioaccumulation pathway and health risks of PFAS 'forever chemicals'",
      "Describe analytical methods for detecting pharmaceuticals at parts-per-trillion levels",
      "Evaluate microplastic sampling and identification protocols for urban waterways",
      "Apply EPA's four-step risk assessment framework to emerging contaminant data",
    ],
    keyFact: "PFAS compounds have been detected in the Potomac and Anacostia at concentrations exceeding EPA's 2024 health advisory of 4 parts per trillion for PFOA.",
  },
];

// ---------------------------------------------------------------------------
// Interactive exercises — "What does this reading mean?"
// ---------------------------------------------------------------------------
const interactiveExercises = [
  {
    parameter: "Dissolved Oxygen",
    icon: Droplets,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    value: "4.0 mg/L",
    question: "A station reports DO of 4.0 mg/L. What does this mean for fish survival?",
    answer: "This reading is below the EPA minimum of 5.0 mg/L for aquatic life support. Fish species like largemouth bass need at least 5 mg/L — at 4.0, sensitive species begin to suffocate. Catfish and carp can tolerate down to 3 mg/L temporarily, but prolonged exposure causes die-offs. This reading would trigger a compliance alert on the dashboard.",
    threshold: "EPA minimum: 5.0 mg/L",
    severity: "warning" as const,
  },
  {
    parameter: "E. coli",
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    value: "850 CFU/100mL",
    question: "E. coli reads 850 CFU/100mL after a rainstorm. Is it safe to wade in?",
    answer: "No. The EPA recreational water quality criterion is 410 CFU/100mL for a single sample. At 850, the risk of gastrointestinal illness from recreational contact (swimming, wading, kayaking) is significantly elevated. This likely resulted from a combined sewer overflow during the storm. Wait at least 48 hours after heavy rain for levels to return to baseline.",
    threshold: "EPA limit: 410 CFU/100mL",
    severity: "danger" as const,
  },
  {
    parameter: "pH Level",
    icon: Activity,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    value: "7.2",
    question: "The Anacostia reads pH 7.2 today. Is this healthy?",
    answer: "Yes! pH 7.2 is within the EPA optimal range of 6.5-9.0 for freshwater aquatic life. It's slightly above neutral (7.0), which is typical for the Anacostia. This pH supports diverse biological communities, allows nutrients to remain bioavailable, and keeps metals like aluminum in their less toxic forms.",
    threshold: "EPA range: 6.5–9.0",
    severity: "good" as const,
  },
  {
    parameter: "Water Temperature",
    icon: Thermometer,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    value: "29.5°C",
    question: "August readings show 29.5°C (85°F). Should we be concerned?",
    answer: "This is approaching the warm-water aquatic life limit of 32°C. At 29.5°C, dissolved oxygen capacity drops to about 7.5 mg/L (compared to 11 mg/L at 10°C), stressing fish. Thermal pollution from hot pavement runoff during summer storms can push temperatures even higher. Green infrastructure helps by slowing and cooling runoff before it enters the river.",
    threshold: "EPA warm-water limit: 32°C",
    severity: "warning" as const,
  },
];

const communityEvents = [
  {
    title: "Anacostia River Cleanup Day",
    date: "April 12, 2026",
    location: "Anacostia Park",
    type: "Community",
    description: "Join UDC students and community members for the annual spring cleanup along the Anacostia River. Gloves, bags, and refreshments provided. All ages welcome.",
  },
  {
    title: "Water Quality Workshop",
    date: "April 25, 2026",
    location: "UDC Van Ness Campus",
    type: "Workshop",
    description: "Hands-on workshop learning to use water quality testing kits — measure pH, dissolved oxygen, and turbidity. Ideal for students and DC residents. No experience needed.",
  },
  {
    title: "WRRI Research Symposium",
    date: "May 8, 2026",
    location: "UDC Auditorium",
    type: "Academic",
    description: "Annual presentation of WRRI research findings including Anacostia restoration, green infrastructure performance, and emerging contaminant detection. Keynote by EPA Region 3.",
  },
  {
    title: "Green Infrastructure Tour",
    date: "May 15, 2026",
    location: "Multiple UDC Sites",
    type: "Tour",
    description: "Guided tour of UDC's green infrastructure installations: green roofs at Van Ness, rain gardens at Community College, and bioswales at research sites. See real monitoring equipment in action.",
  },
];

const openDatasets = [
  {
    name: "Anacostia Water Quality (2020-2026)",
    format: "CSV / JSON",
    size: "12.4 MB",
    records: "45,000+",
    description: "Historical water quality measurements from all Anacostia monitoring stations. Includes temperature, DO, pH, turbidity, conductivity, E. coli, nutrients.",
    apiLink: "/api/export?format=csv",
  },
  {
    name: "Stormwater BMP Performance",
    format: "CSV",
    size: "3.8 MB",
    records: "12,000+",
    description: "Green infrastructure performance data including retention rates and water quality improvements from UDC's BMP monitoring network.",
    apiLink: "/api/export?format=csv&station=GI-001",
  },
  {
    name: "DC Ward Environmental Data",
    format: "GeoJSON / CSV",
    size: "8.2 MB",
    records: "2,400+",
    description: "Ward-level environmental justice indicators: CSO events, impervious surface coverage, green space access, flood risk, and demographic data.",
    apiLink: "",
  },
  {
    name: "UDC Green Roof Monitoring",
    format: "CSV",
    size: "5.1 MB",
    records: "18,000+",
    description: "Detailed measurements from UDC's experimental green roof installations — rainfall capture, runoff volume, influent/effluent quality, and temperature buffering.",
    apiLink: "/api/export?format=csv&station=GI-002",
  },
];

export default function EducationPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [levelFilter, setLevelFilter] = useState("All");
  const [activeModule, setActiveModule] = useState<(typeof educationalModules)[0] | null>(null);
  const [revealedExercises, setRevealedExercises] = useState<Set<number>>(new Set());

  const filteredModules = levelFilter === "All"
    ? educationalModules
    : educationalModules.filter((m) => m.level === levelFilter);

  function toggleExercise(index: number) {
    setRevealedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? "bg-udc-dark" : "bg-slate-50"}`}>
      <Sidebar />
      <main id="main-content" className="flex-1 lg:ml-[240px]">
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

          {/* Audience Selector — now scrolls to relevant sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "DC Community",
                icon: Users,
                color: "text-blue-400",
                bgColor: "bg-blue-500/10",
                borderColor: "border-blue-500/20",
                description: "Accessible information about water quality, safety, and how to get involved in watershed protection.",
                action: () => { setLevelFilter("Beginner"); document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" }); },
                cta: "Start with the basics",
              },
              {
                title: "UDC Students",
                icon: GraduationCap,
                color: "text-green-400",
                bgColor: "bg-green-500/10",
                borderColor: "border-green-500/20",
                description: "Course materials, real datasets for analysis, and downloadable Python/R templates for coursework.",
                action: () => { setLevelFilter("Intermediate"); document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" }); },
                cta: "Explore course materials",
              },
              {
                title: "Faculty & Researchers",
                icon: Microscope,
                color: "text-purple-400",
                bgColor: "bg-purple-500/10",
                borderColor: "border-purple-500/20",
                description: "Open datasets, API access for programmatic data retrieval, and publication resources for water research.",
                action: () => document.getElementById("resources")?.scrollIntoView({ behavior: "smooth" }),
                cta: "Access open data & API",
              },
            ].map((audience) => (
              <button
                key={audience.title}
                onClick={audience.action}
                className={`glass-panel rounded-xl p-5 text-left transition-all group hover:scale-[1.02] ${
                  isDark ? "hover:border-slate-600" : "hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div className={`p-3 rounded-lg ${audience.bgColor} w-fit mb-3`}>
                  <audience.icon className={`w-5 h-5 ${audience.color}`} />
                </div>
                <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{audience.title}</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{audience.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-slate-500 group-hover:text-water-blue transition-colors">
                  <span>{audience.cta}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>

          {/* Interactive Exercises */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>What Does This Reading Mean?</h2>
            </div>
            <p className={`text-xs mb-4 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              Interactive exercises — click to reveal the answer and learn how to interpret real water quality data
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interactiveExercises.map((ex, i) => {
                const revealed = revealedExercises.has(i);
                const Icon = ex.icon;
                return (
                  <div key={i} className="glass-panel rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleExercise(i)}
                      className={`w-full p-4 text-left transition-colors ${
                        isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${ex.bgColor} flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${ex.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold ${ex.color}`}>{ex.parameter}: {ex.value}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              ex.severity === "good"
                                ? "text-green-400 bg-green-500/10 border-green-500/20"
                                : ex.severity === "warning"
                                ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                : "text-red-400 bg-red-500/10 border-red-500/20"
                            }`}>{ex.threshold}</span>
                          </div>
                          <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>{ex.question}</p>
                          <span className={`text-[10px] mt-2 inline-flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                            {revealed ? "Hide" : "Reveal"} answer
                            <ArrowRight className={`w-2.5 h-2.5 transition-transform ${revealed ? "rotate-90" : ""}`} />
                          </span>
                        </div>
                      </div>
                    </button>
                    {revealed && (
                      <div className={`px-4 pb-4 pt-0 border-t ${isDark ? "border-panel-border" : "border-slate-100"}`}>
                        <div className={`mt-3 rounded-lg p-3 ${
                          ex.severity === "good"
                            ? isDark ? "bg-green-500/5" : "bg-green-50"
                            : ex.severity === "warning"
                            ? isDark ? "bg-amber-500/5" : "bg-amber-50"
                            : isDark ? "bg-red-500/5" : "bg-red-50"
                        }`}>
                          <div className="flex items-start gap-2">
                            <Lightbulb className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                              ex.severity === "good" ? "text-green-400" : ex.severity === "warning" ? "text-amber-400" : "text-red-400"
                            }`} />
                            <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                              {ex.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Educational Modules */}
          <section id="modules">
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
                    onClick={() => setLevelFilter(level)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      levelFilter === level
                        ? isDark
                          ? "bg-water-blue/20 border-water-blue/30 text-water-blue"
                          : "bg-blue-50 border-blue-300 text-blue-600"
                        : isDark
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
              {filteredModules.map((module) => (
                <button
                  key={module.title}
                  onClick={() => setActiveModule(module)}
                  className={`glass-panel rounded-xl p-5 text-left transition-all group cursor-pointer hover:scale-[1.02] ${
                    isDark ? "hover:border-slate-600" : "hover:border-slate-300 hover:shadow-md"
                  }`}
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
                    <span>View module details</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Module Detail Modal */}
          {activeModule && (
            <Modal
              open={true}
              onClose={() => setActiveModule(null)}
              title={activeModule.title}
              subtitle={`${activeModule.level} · ${activeModule.duration}`}
              icon={<activeModule.icon className={`w-5 h-5 ${activeModule.color}`} />}
            >
              <div className="space-y-5">
                <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {activeModule.description}
                </p>

                {/* Key Fact */}
                <div className={`rounded-xl p-4 ${isDark ? "bg-amber-500/5 border border-amber-500/20" : "bg-amber-50 border border-amber-200"}`}>
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <strong>Key fact:</strong> {activeModule.keyFact}
                    </p>
                  </div>
                </div>

                {/* Topics Covered */}
                <div>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Topics Covered</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {activeModule.topics.map((topic) => (
                      <div key={topic} className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                        <BookOpen className={`w-3 h-3 flex-shrink-0 ${activeModule.color}`} />
                        <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learning Outcomes */}
                <div>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    <Target className="w-3 h-3 inline mr-1" />
                    Learning Outcomes
                  </h4>
                  <div className="space-y-2">
                    {activeModule.outcomes.map((outcome, i) => (
                      <div key={i} className={`flex items-start gap-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${activeModule.color}`} />
                        <span className="text-xs leading-relaxed">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Related resources */}
                <div className={`rounded-xl p-4 ${isDark ? "bg-white/5 border border-panel-border" : "bg-slate-50 border border-slate-200"}`}>
                  <h4 className={`text-xs font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Related Dashboard Resources</h4>
                  <div className="flex flex-wrap gap-2">
                    <a href="/methodology" className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                      <BookOpen className="w-3 h-3" /> Methodology & Data Dictionary
                    </a>
                    <a href="/api/export?format=csv" className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 text-[10px] border border-green-500/20 hover:bg-green-500/20 transition-colors">
                      <Download className="w-3 h-3" /> Download Full Dataset (CSV)
                    </a>
                    <a href="/research" className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                      <ExternalLink className="w-3 h-3" /> Research Projects
                    </a>
                  </div>
                </div>
              </div>
            </Modal>
          )}

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
                  <p className={`text-xs mb-3 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>{event.description}</p>
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
              Download research datasets for analysis and education. Data is available via the API or as direct downloads.
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
                    {dataset.apiLink ? (
                      <a
                        href={dataset.apiLink}
                        download
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-water-blue/20 text-water-blue text-xs border border-water-blue/30 hover:bg-water-blue/30 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </a>
                    ) : (
                      <span className={`text-[10px] px-2 py-1 rounded-lg ${isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"}`}>
                        Coming soon
                      </span>
                    )}
                  </div>
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{dataset.name}</h3>
                  <p className={`text-xs mb-3 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>{dataset.description}</p>
                  <div className={`flex items-center gap-4 text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                    <span>Format: {dataset.format}</span>
                    <span>Size: {dataset.size}</span>
                    <span>Records: {dataset.records}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* API Access Banner */}
          <section className={`rounded-xl border p-5 ${isDark ? "border-blue-500/20 bg-blue-500/5" : "border-blue-200 bg-blue-50"}`}>
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Programmatic API Access</h3>
                <p className={`text-xs leading-relaxed mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  All data is available via REST API for integration into your own applications,
                  research scripts, or community tools. No authentication required for read access.
                </p>
                <div className={`font-mono text-[10px] p-3 rounded-lg space-y-1 ${isDark ? "bg-udc-dark/50 text-slate-400" : "bg-white text-slate-600"}`}>
                  <div>GET /api/stations — All stations with latest readings</div>
                  <div>GET /api/stations/:id/history — Historical data for a station</div>
                  <div>GET /api/export?format=csv — Full dataset export</div>
                  <div>GET /api/export?format=json&station=ANA-001 — Station-specific JSON</div>
                </div>
                <a
                  href="/methodology"
                  className="inline-flex items-center gap-1 mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View full API documentation <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
