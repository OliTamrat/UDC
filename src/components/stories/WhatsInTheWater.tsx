"use client";

import { useState } from "react";
import {
  Droplets,
  Thermometer,
  FlaskConical,
  Bug,
  Atom,
  Beaker,
  ChevronRight,
  Shield,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { StoryCard, FadeIn } from "./ScrollySection";

interface ParamCard {
  id: string;
  name: string;
  icon: typeof Droplets;
  category: string;
  categoryColor: string;
  unit: string;
  simple: string; // one-sentence plain-English
  detail: string;
  epaMax?: number;
  epaMin?: number;
  funFact: string;
  dcContext: string;
}

const FEATURED_PARAMS: ParamCard[] = [
  {
    id: "dissolved_oxygen",
    name: "Dissolved Oxygen",
    icon: Droplets,
    category: "Physical",
    categoryColor: "text-blue-400",
    unit: "mg/L",
    simple: "The oxygen fish breathe — dissolved in water like sugar in tea.",
    detail:
      "Healthy rivers maintain at least 5 mg/L of dissolved oxygen. Below 2 mg/L creates 'dead zones' where fish and crabs cannot survive. Warm water holds less oxygen than cold water.",
    epaMin: 5.0,
    funFact:
      "A trout needs about 7 mg/L of oxygen to thrive — that's why you find them in cold mountain streams, not warm city rivers.",
    dcContext:
      "The Anacostia regularly drops below 5 mg/L in summer, especially after Combined Sewer Overflows flush warm, low-oxygen water into the river.",
  },
  {
    id: "ecoli",
    name: "E. coli Bacteria",
    icon: Bug,
    category: "Biological",
    categoryColor: "text-red-400",
    unit: "CFU/100mL",
    simple: "Bacteria from sewage that tells us if the water is safe for swimming.",
    detail:
      "E. coli itself isn't always dangerous, but its presence indicates fecal contamination — which means harmful pathogens may also be present. Above 410 CFU/100mL (EPA 2012 single-sample recreational standard), swimming is unsafe.",
    epaMax: 410,
    funFact:
      "After just 0.5 inches of rain, DC's combined sewers can overflow, releasing a cocktail of sewage, chemicals, and trash directly into the Anacostia.",
    dcContext:
      "The Anacostia Riverkeeper conducts regular swim testing. In recent years, the river has been 'swimmable' on about 70% of dry-weather days — a big improvement from nearly 0% a decade ago.",
  },
  {
    id: "phosphorus_total",
    name: "Phosphorus",
    icon: FlaskConical,
    category: "Nutrients",
    categoryColor: "text-green-400",
    unit: "mg/L",
    simple: "A nutrient that feeds explosive algae growth when there's too much.",
    detail:
      "Phosphorus is naturally rare in freshwater, so even small additions from detergents, fertilizers, and wastewater can trigger massive algae blooms. When algae die and decompose, they consume oxygen.",
    epaMax: 0.1,
    funFact:
      "Just one pound of phosphorus can produce up to 500 pounds of algae. That's why phosphorus bans in detergent made a real difference.",
    dcContext:
      "DC banned phosphorus in lawn fertilizer in 2013. UDC's WRRI tracks whether this policy is actually reducing phosphorus levels in the Anacostia watershed.",
  },
  {
    id: "lead_total",
    name: "Lead",
    icon: Atom,
    category: "Metals",
    categoryColor: "text-orange-400",
    unit: "µg/L",
    simple: "A toxic metal from old pipes — no amount is safe for drinking.",
    detail:
      "Lead accumulates in the body and is especially harmful to children's brain development. DC's 2004 lead-in-water crisis revealed widespread contamination from lead service lines.",
    epaMax: 15,
    funFact:
      "DC still has an estimated 25,000+ lead service lines, mostly in older neighborhoods. The city is working to replace them all by 2030.",
    dcContext:
      "Wards 7 and 8, which border the Anacostia, have some of the highest concentrations of lead pipes in the city — making water quality monitoring in these communities especially critical.",
  },
  {
    id: "turbidity",
    name: "Turbidity",
    icon: Droplets,
    category: "Physical",
    categoryColor: "text-blue-400",
    unit: "NTU",
    simple: "How cloudy the water is — clear is good, muddy is bad.",
    detail:
      "Turbidity measures suspended particles like sediment, algae, and organic matter. High turbidity blocks sunlight needed by underwater plants, smothers fish eggs, and can carry attached pollutants.",
    funFact:
      "You can do a rough turbidity test at home: fill a clear glass with river water and hold it up to a newspaper. If you can't read the text, turbidity is probably over 40 NTU.",
    dcContext:
      "After major storms, the Anacostia's turbidity can spike from 10 NTU to over 200 NTU in just a few hours as construction site runoff and eroded soil wash in.",
  },
  {
    id: "tcep",
    name: "Flame Retardants (TCEP)",
    icon: Beaker,
    category: "Emerging",
    categoryColor: "text-purple-400",
    unit: "µg/L",
    simple: "Chemicals from furniture and electronics that end up in our water.",
    detail:
      "TCEP (Tris(2-chloroethyl) phosphate) is a chlorinated flame retardant found in wastewater. It's persistent in the environment, meaning it doesn't break down easily.",
    funFact:
      "Your couch may be contaminating the river. Flame retardants in furniture break down, wash off hands, go down drains, and survive wastewater treatment.",
    dcContext:
      "UDC's WRRI is among the first HBCUs to monitor emerging contaminants in DC waterways — tracking chemicals that traditional testing programs often miss.",
  },
];

export default function WhatsInTheWater() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [expanded, setExpanded] = useState<string | null>("dissolved_oxygen");

  return (
    <StoryCard
      title="What's in the Water?"
      subtitle="A plain-English guide to what scientists measure"
      icon={<FlaskConical className="w-5 h-5 text-green-400" />}
      accentColor={isDark ? "bg-green-500/10" : "bg-green-50"}
    >
      <FadeIn>
        <p
          className={`text-sm leading-relaxed mb-6 ${
            isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"
          }`}
        >
          Water quality scientists measure dozens of parameters to understand
          river health. Here are the most important ones — explained without
          jargon. Click any parameter to learn more.
        </p>
      </FadeIn>

      <div className="space-y-3">
        {FEATURED_PARAMS.map((param, i) => {
          const isExpanded = expanded === param.id;
          const Icon = param.icon;

          return (
            <FadeIn key={param.id} delay={i * 100}>
              <div
                className={`rounded-xl border transition-all duration-300 ${
                  isExpanded
                    ? isDark
                      ? "bg-[#13161F] border-water-blue/30"
                      : "bg-white border-blue-200 shadow-sm"
                    : isDark
                      ? "bg-[#13161F]/50 border-white/[0.06] hover:border-white/[0.06]/80"
                      : "bg-white border-[#E5E7EB] hover:border-[#D1D5DB]"
                }`}
              >
                {/* Clickable header */}
                <button
                  onClick={() =>
                    setExpanded(isExpanded ? null : param.id)
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      isDark ? "bg-white/5" : "bg-[#F9FAFB]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${param.categoryColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          isDark ? "text-white" : "text-[#111827]"
                        }`}
                      >
                        {param.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${param.categoryColor} ${
                          isDark ? "bg-white/5" : "bg-[#F3F4F6]"
                        }`}
                      >
                        {param.category}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 ${
                        isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"
                      }`}
                    >
                      {param.simple}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    } ${isDark ? "text-[#6B7280]" : "text-[#D1D5DB]"}`}
                  />
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    className={`px-4 pb-4 pt-1 border-t space-y-4 ${
                      isDark ? "border-white/5" : "border-[#F3F4F6]"
                    }`}
                  >
                    {/* Science explanation */}
                    <p
                      className={`text-sm leading-relaxed ${
                        isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"
                      }`}
                    >
                      {param.detail}
                    </p>

                    {/* EPA threshold */}
                    {(param.epaMax || param.epaMin) && (
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                          isDark
                            ? "bg-amber-500/5 border border-amber-500/20"
                            : "bg-amber-50 border border-amber-200"
                        }`}
                      >
                        <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span
                          className={`text-xs ${
                            isDark ? "text-amber-300" : "text-amber-700"
                          }`}
                        >
                          <strong>EPA limit:</strong>{" "}
                          {param.epaMax
                            ? `Maximum ${param.epaMax} ${param.unit}`
                            : `Minimum ${param.epaMin} ${param.unit}`}
                        </span>
                      </div>
                    )}

                    {/* Fun fact */}
                    <div
                      className={`flex items-start gap-2 px-3 py-2 rounded-lg ${
                        isDark
                          ? "bg-blue-500/5 border border-blue-500/20"
                          : "bg-blue-50 border border-blue-200"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span
                        className={`text-xs ${
                          isDark ? "text-blue-300" : "text-blue-700"
                        }`}
                      >
                        <strong>Did you know?</strong> {param.funFact}
                      </span>
                    </div>

                    {/* DC context */}
                    <div
                      className={`flex items-start gap-2 px-3 py-2 rounded-lg ${
                        isDark
                          ? "bg-purple-500/5 border border-purple-500/20"
                          : "bg-purple-50 border border-purple-200"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span
                        className={`text-xs ${
                          isDark ? "text-purple-300" : "text-purple-700"
                        }`}
                      >
                        <strong>In DC:</strong> {param.dcContext}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </FadeIn>
          );
        })}
      </div>
    </StoryCard>
  );
}
