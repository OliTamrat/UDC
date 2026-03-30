"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Thermometer,
  Droplets,
  FlaskConical,
  Bug,
  Atom,
  AlertTriangle,
  Shield,
  Info,
  Search,
  Beaker,
  Filter,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ParameterDef {
  id: string;
  name: string;
  unit: string;
  category: string;
  epaMin: number | null;
  epaMax: number | null;
  description: string;
}

interface ParameterExplorerProps {
  open: boolean;
  onClose: () => void;
  selectedParams: string[];
  onParamsChange: (params: string[]) => void;
}

const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    icon: typeof Thermometer;
    color: string;
    bgColor: string;
    borderColor: string;
    lightBg: string;
    lightBorder: string;
    tagline: string;
  }
> = {
  physical: {
    label: "Physical",
    icon: Thermometer,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    lightBg: "bg-blue-50",
    lightBorder: "border-blue-200",
    tagline: "Temperature, clarity, and dissolved substances",
  },
  nutrients: {
    label: "Nutrients",
    icon: FlaskConical,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    lightBg: "bg-green-50",
    lightBorder: "border-green-200",
    tagline: "Nitrogen and phosphorus that fuel algae growth",
  },
  biological: {
    label: "Biological",
    icon: Bug,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    lightBg: "bg-red-50",
    lightBorder: "border-red-200",
    tagline: "Bacteria indicators of sewage contamination",
  },
  metals: {
    label: "Metals",
    icon: Atom,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    lightBg: "bg-orange-50",
    lightBorder: "border-orange-200",
    tagline: "Toxic heavy metals from pipes and industry",
  },
  organic: {
    label: "Emerging Contaminants",
    icon: Beaker,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    lightBg: "bg-purple-50",
    lightBorder: "border-purple-200",
    tagline: "Industrial chemicals and flame retardants",
  },
};

const CATEGORY_ORDER = ["physical", "nutrients", "biological", "metals", "organic"];

// Educational "why it matters" blurbs for each parameter — plain language for community
const WHY_IT_MATTERS: Record<string, string> = {
  temperature:
    "When water gets too warm, fish can't get enough oxygen. Summer heat waves and urban runoff from hot pavement can raise river temperatures dangerously.",
  dissolved_oxygen:
    "Fish, crabs, and insects need oxygen dissolved in water to breathe — just like we need it in air. After heavy rains, sewage overflows can starve the river of oxygen.",
  ph: "Think of pH like a health check for the water. Too acidic or too basic, and aquatic life struggles. Acid rain and industrial runoff are common culprits.",
  turbidity:
    "If you can't see through the water, neither can fish. Muddy, cloudy water blocks sunlight that underwater plants need and can smother fish eggs.",
  conductivity:
    "Salty water in a freshwater river is a warning sign. In winter, DC's road salt washes into streams. Year-round high readings can point to sewage leaks.",
  ecoli:
    "E. coli in waterways means sewage or animal waste is present. After heavy rain, DC's combined sewer system can overflow directly into the Anacostia.",
  nitrate_n:
    "Too much nitrogen is like overfeeding a lawn — it causes explosive algae growth that sucks oxygen from the water when it dies and decomposes.",
  phosphorus_total:
    "Even a tiny amount of phosphorus triggers algae blooms. Laundry detergent, fertilizer, and wastewater are the main sources in DC's waterways.",
  nitrate_nitrite:
    "The combined nitrogen measure used by modern monitoring. High levels downstream often point to fertilizer runoff or wastewater treatment plant discharge.",
  nitrogen_total:
    "Total nitrogen tracks all forms at once — critical for meeting Chesapeake Bay cleanup targets that DC must comply with.",
  kjeldahl_nitrogen:
    "High organic nitrogen signals raw sewage or decomposing material in the water. This is one of the first things scientists check after a sewer overflow.",
  orthophosphate:
    "Unlike total phosphorus, orthophosphate is the form that algae can use immediately. It's the fastest indicator of a new pollution source.",
  total_coliform:
    "A broad test for bacteria — not all are dangerous, but high numbers tell scientists the water may harbor disease-causing pathogens.",
  lead_total:
    "There is no safe level of lead. DC's aging infrastructure, especially in Wards 7 and 8, puts communities at risk from lead pipes and contaminated soil.",
  hardness:
    "Hard water isn't directly harmful, but it affects how toxic metals behave. In soft water, lead and copper dissolve more easily into drinking water.",
  ssc: "Sediment in the water comes from construction sites, eroding riverbanks, and stormwater. It smothers aquatic habitats and carries attached pollutants.",
  tds: "A catchall for everything dissolved — salts, minerals, metals. Winter road salt spikes are visible here, and they can make water toxic for freshwater species.",
  temperature_air:
    "Air temperature drives water temperature. On 100°F summer days, urban rivers can heat up rapidly, especially where tree canopy has been removed.",
  turbidity_field:
    "Field measurements are taken right at the water's edge during sampling. They capture real-time conditions that lab results — taken hours later — might miss.",
  ssd: "This tells you how much soil the river is moving each day. After construction or storms, sediment discharge can spike dramatically.",
  methylene_chloride:
    "An industrial solvent linked to cancer. Found near old industrial sites — a reminder that contamination from decades ago can still affect waterways.",
  vinyl_chloride:
    "A known carcinogen that can leach from old PVC pipes. DC's aging water infrastructure makes monitoring for this chemical especially important.",
  tributyl_phosphate:
    "Used in plastics and electronics manufacturing. It's an emerging concern because we're only beginning to understand its effects on aquatic life.",
  triphenyl_phosphate:
    "Found in flame retardants in furniture and electronics. This chemical can act as an endocrine disruptor, affecting hormones in fish and potentially people.",
  tcep: "A chlorinated flame retardant detected in urban wastewater. It's persistent in the environment and classified as a probable carcinogen.",
};

export default function ParameterExplorer({
  open,
  onClose,
  selectedParams,
  onParamsChange,
}: ParameterExplorerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [parameters, setParameters] = useState<ParameterDef[]>([]);
  const [expandedParam, setExpandedParam] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchParams = useCallback(async () => {
    try {
      const res = await fetch("/api/parameters");
      if (res.ok) setParameters(await res.json());
    } catch {
      // API unavailable
    }
  }, []);

  useEffect(() => {
    if (open) fetchParams();
  }, [open, fetchParams]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    ...CATEGORY_CONFIG[cat],
    params: parameters.filter((p) => p.category === cat),
  })).filter((g) => g.params.length > 0);

  const toggle = (id: string) => {
    if (selectedParams.includes(id)) {
      onParamsChange(selectedParams.filter((p) => p !== id));
    } else {
      onParamsChange([...selectedParams, id]);
    }
  };

  const selectCategory = (category: string) => {
    const catIds = parameters
      .filter((p) => p.category === category)
      .map((p) => p.id);
    const allSelected = catIds.every((id) => selectedParams.includes(id));
    if (allSelected) {
      onParamsChange(selectedParams.filter((id) => !catIds.includes(id)));
    } else {
      const merged = new Set([...selectedParams, ...catIds]);
      onParamsChange([...merged]);
    }
  };

  const clearAll = () => onParamsChange([]);

  const filteredGroups = grouped
    .map((g) => ({
      ...g,
      params: g.params.filter(
        (p) =>
          (!activeCategory || p.category === activeCategory) &&
          (!searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter((g) => g.params.length > 0);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[90] transition-opacity duration-300 ${
          isDark ? "bg-black/60" : "bg-black/30"
        } backdrop-blur-sm`}
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Parameter Explorer"
        className={`fixed top-0 right-0 z-[100] h-full w-full sm:w-[480px] md:w-[540px] flex flex-col
          animate-slide-in-right shadow-2xl border-l
          ${
            isDark
              ? "bg-udc-dark border-panel-border"
              : "bg-white border-[#E5E7EB]"
          }`}
      >
        {/* Header */}
        <div
          className={`flex-shrink-0 border-b px-5 py-4 ${
            isDark ? "border-panel-border" : "border-[#E5E7EB]"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  isDark ? "bg-water-blue/10" : "bg-blue-50"
                }`}
              >
                <Droplets className="w-5 h-5 text-water-blue" />
              </div>
              <div>
                <h2
                  className={`text-lg font-bold ${
                    isDark ? "text-white" : "text-[#111827]"
                  }`}
                >
                  Water Quality Parameters
                </h2>
                <p
                  className={`text-xs ${
                    isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"
                  }`}
                >
                  Explore what we measure and why it matters
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close parameter explorer"
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? "hover:bg-white/10 text-[#D1D5DB]"
                  : "hover:bg-[#F3F4F6] text-[#6B7280]"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"
              }`}
            />
            <input
              type="text"
              placeholder="Search parameters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm border transition-colors ${
                isDark
                  ? "bg-panel-bg border-panel-border text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:border-water-blue/50"
                  : "bg-[#F9FAFB] border-[#E5E7EB] text-slate-800 placeholder:text-[#9CA3AF] focus:border-blue-400"
              } focus:outline-none`}
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === null
                  ? isDark
                    ? "bg-water-blue/20 text-blue-300 border border-water-blue/40"
                    : "bg-blue-100 text-blue-700 border border-blue-300"
                  : isDark
                    ? "bg-panel-bg text-[#D1D5DB] border border-panel-border hover:border-slate-500"
                    : "bg-slate-100 text-[#6B7280] border border-[#E5E7EB] hover:border-slate-300"
              }`}
            >
              All ({parameters.length})
            </button>
            {grouped.map((g) => {
              const Icon = g.icon;
              return (
                <button
                  key={g.category}
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === g.category ? null : g.category
                    )
                  }
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === g.category
                      ? isDark
                        ? `${g.bgColor} ${g.color} border ${g.borderColor}`
                        : `${g.lightBg} ${g.color} border ${g.lightBorder}`
                      : isDark
                        ? "bg-panel-bg text-[#D1D5DB] border border-panel-border hover:border-slate-500"
                        : "bg-slate-100 text-[#6B7280] border border-[#E5E7EB] hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {g.label} ({g.params.length})
                </button>
              );
            })}
          </div>

          {/* Selection summary */}
          {selectedParams.length > 0 && (
            <div
              className={`flex items-center justify-between mt-3 pt-3 border-t ${
                isDark ? "border-panel-border" : "border-[#F3F4F6]"
              }`}
            >
              <span
                className={`text-xs ${
                  isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"
                }`}
              >
                <span className="font-semibold text-water-blue">
                  {selectedParams.length}
                </span>{" "}
                parameters selected for dashboard filter
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-red-400 hover:text-red-300 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {filteredGroups.map((group) => {
            const Icon = group.icon;
            const catIds = group.params.map((p) => p.id);
            const allSelected = catIds.every((id) =>
              selectedParams.includes(id)
            );
            const someSelected = catIds.some((id) =>
              selectedParams.includes(id)
            );

            return (
              <div key={group.category} className="mb-1">
                {/* Category Header */}
                <div
                  className={`sticky top-0 z-10 px-5 py-3 border-b ${
                    isDark
                      ? "bg-udc-dark/95 backdrop-blur-sm border-panel-border/50"
                      : "bg-white/95 backdrop-blur-sm border-[#F3F4F6]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isDark ? group.bgColor : group.lightBg
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${group.color}`} />
                      </div>
                      <div>
                        <h3
                          className={`text-sm font-semibold ${
                            isDark ? "text-white" : "text-[#111827]"
                          }`}
                        >
                          {group.label}
                        </h3>
                        <p
                          className={`text-[11px] ${
                            isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"
                          }`}
                        >
                          {group.tagline}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => selectCategory(group.category)}
                      role="checkbox"
                      aria-checked={allSelected ? "true" : someSelected ? "mixed" : "false"}
                      aria-label={`Select all ${group.category} parameters`}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        allSelected
                          ? isDark
                            ? "bg-water-blue/20 text-blue-300"
                            : "bg-blue-100 text-blue-700"
                          : isDark
                            ? "bg-panel-bg text-[#D1D5DB] hover:text-[#E5E7EB]"
                            : "bg-slate-100 text-[#6B7280] hover:text-[#374151]"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          allSelected
                            ? "bg-water-blue border-water-blue"
                            : someSelected
                              ? "border-water-blue/50 bg-water-blue/20"
                              : isDark
                                ? "border-white/[0.06]"
                                : "border-slate-300"
                        }`}
                      >
                        {allSelected && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                        {someSelected && !allSelected && (
                          <span className="w-1.5 h-1.5 rounded-sm bg-water-blue" />
                        )}
                      </div>
                      Select all
                    </button>
                  </div>
                </div>

                {/* Parameter Cards */}
                <div className="px-4 py-2 space-y-2">
                  {group.params.map((param) => {
                    const isSelected = selectedParams.includes(param.id);
                    const isExpanded = expandedParam === param.id;
                    const whyText = WHY_IT_MATTERS[param.id];
                    const hasThreshold =
                      param.epaMin != null || param.epaMax != null;

                    return (
                      <div
                        key={param.id}
                        className={`rounded-xl border transition-all duration-200 ${
                          isExpanded
                            ? isDark
                              ? `${group.bgColor} ${group.borderColor}`
                              : `${group.lightBg} ${group.lightBorder}`
                            : isDark
                              ? "border-panel-border hover:border-panel-border/80 bg-panel-bg/50"
                              : "border-[#E5E7EB] hover:border-slate-300 bg-white"
                        }`}
                      >
                        {/* Card Header — always visible */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(param.id);
                            }}
                            className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-water-blue border-water-blue"
                                : isDark
                                  ? "border-white/[0.06] hover:border-slate-400"
                                  : "border-slate-300 hover:border-slate-400"
                            }`}
                            role="checkbox"
                            aria-checked={isSelected}
                            aria-label={`${isSelected ? "Deselect" : "Select"} ${param.name}`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </button>

                          {/* Name + Unit */}
                          <button
                            onClick={() =>
                              setExpandedParam(
                                isExpanded ? null : param.id
                              )
                            }
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-medium ${
                                  isDark ? "text-slate-100" : "text-slate-800"
                                }`}
                              >
                                {param.name}
                              </span>
                              {hasThreshold && (
                                <span
                                  className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                                    isDark
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  EPA Regulated
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-xs ${
                                isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"
                              }`}
                            >
                              Measured in {param.unit}
                            </span>
                          </button>

                          {/* Expand arrow */}
                          <button
                            onClick={() =>
                              setExpandedParam(
                                isExpanded ? null : param.id
                              )
                            }
                            className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                              isDark
                                ? "text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-white/5"
                                : "text-[#9CA3AF] hover:text-[#4B5563] hover:bg-[#F3F4F6]"
                            }`}
                            aria-label={isExpanded ? "Collapse details" : "Expand details"}
                          >
                            {isExpanded ? (
                              <ChevronLeft className="w-4 h-4 rotate-90" />
                            ) : (
                              <ChevronRight className="w-4 h-4 rotate-90" />
                            )}
                          </button>
                        </div>

                        {/* Expanded Detail */}
                        {isExpanded && (
                          <div
                            className={`px-4 pb-4 pt-1 border-t ${
                              isDark
                                ? "border-white/5"
                                : "border-[#F3F4F6]"
                            }`}
                          >
                            {/* What it measures */}
                            <div className="mb-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Info
                                  className={`w-3.5 h-3.5 ${group.color}`}
                                />
                                <span
                                  className={`text-xs font-semibold uppercase tracking-wide ${
                                    isDark
                                      ? "text-[#E5E7EB]"
                                      : "text-[#374151]"
                                  }`}
                                >
                                  What it measures
                                </span>
                              </div>
                              <p
                                className={`text-sm leading-relaxed ${
                                  isDark ? "text-[#E5E7EB]" : "text-[#4B5563]"
                                }`}
                              >
                                {param.description}
                              </p>
                            </div>

                            {/* Why it matters to DC */}
                            {whyText && (
                              <div className="mb-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <AlertTriangle
                                    className={`w-3.5 h-3.5 text-amber-400`}
                                  />
                                  <span
                                    className={`text-xs font-semibold uppercase tracking-wide ${
                                      isDark
                                        ? "text-[#E5E7EB]"
                                        : "text-[#374151]"
                                    }`}
                                  >
                                    Why it matters in DC
                                  </span>
                                </div>
                                <p
                                  className={`text-sm leading-relaxed ${
                                    isDark
                                      ? "text-[#E5E7EB]"
                                      : "text-[#4B5563]"
                                  }`}
                                >
                                  {whyText}
                                </p>
                              </div>
                            )}

                            {/* EPA Thresholds */}
                            {hasThreshold && (
                              <div
                                className={`rounded-lg border p-3 ${
                                  isDark
                                    ? "bg-panel-bg/50 border-panel-border"
                                    : "bg-white border-[#E5E7EB]"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Shield className="w-3.5 h-3.5 text-water-blue" />
                                  <span
                                    className={`text-xs font-semibold ${
                                      isDark
                                        ? "text-[#E5E7EB]"
                                        : "text-[#374151]"
                                    }`}
                                  >
                                    EPA Safety Thresholds
                                  </span>
                                </div>
                                <div className="flex gap-4">
                                  {param.epaMin != null && (
                                    <div>
                                      <span
                                        className={`text-[10px] uppercase ${
                                          isDark
                                            ? "text-[#9CA3AF]"
                                            : "text-[#9CA3AF]"
                                        }`}
                                      >
                                        Minimum
                                      </span>
                                      <div className="flex items-baseline gap-1">
                                        <span
                                          className={`text-lg font-bold ${
                                            isDark
                                              ? "text-green-400"
                                              : "text-green-600"
                                          }`}
                                        >
                                          {param.epaMin}
                                        </span>
                                        <span
                                          className={`text-xs ${
                                            isDark
                                              ? "text-[#9CA3AF]"
                                              : "text-[#9CA3AF]"
                                          }`}
                                        >
                                          {param.unit}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {param.epaMax != null && (
                                    <div>
                                      <span
                                        className={`text-[10px] uppercase ${
                                          isDark
                                            ? "text-[#9CA3AF]"
                                            : "text-[#9CA3AF]"
                                        }`}
                                      >
                                        Maximum
                                      </span>
                                      <div className="flex items-baseline gap-1">
                                        <span
                                          className={`text-lg font-bold ${
                                            isDark
                                              ? "text-red-400"
                                              : "text-red-600"
                                          }`}
                                        >
                                          {param.epaMax}
                                        </span>
                                        <span
                                          className={`text-xs ${
                                            isDark
                                              ? "text-[#9CA3AF]"
                                              : "text-[#9CA3AF]"
                                          }`}
                                        >
                                          {param.unit}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {/* Threshold bar visualization */}
                                <ThresholdBar
                                  epaMin={param.epaMin}
                                  epaMax={param.epaMax}
                                  isDark={isDark}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <Search
                className={`w-8 h-8 mb-3 ${
                  isDark ? "text-[#9CA3AF]" : "text-slate-300"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-[#D1D5DB]" : "text-[#6B7280]"
                }`}
              >
                No parameters match your search
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory(null);
                }}
                className="mt-2 text-xs text-water-blue hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Footer / Apply Button */}
        <div
          className={`flex-shrink-0 border-t px-5 py-4 ${
            isDark ? "border-panel-border bg-udc-dark" : "border-[#E5E7EB] bg-white"
          }`}
        >
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-water-blue hover:bg-blue-600 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Apply{selectedParams.length > 0 ? ` (${selectedParams.length} selected)` : " — No filters"}
          </button>
        </div>
      </div>
    </>
  );
}

/** Mini threshold bar visualization */
function ThresholdBar({
  epaMin,
  epaMax,
  isDark,
}: {
  epaMin: number | null;
  epaMax: number | null;
  isDark: boolean;
}) {
  return (
    <div className="mt-2">
      <div
        className={`h-2 rounded-full overflow-hidden flex ${
          isDark ? "bg-slate-700" : "bg-slate-200"
        }`}
      >
        {epaMin != null && (
          <>
            <div className="h-full bg-red-400/60 w-[15%]" title="Below minimum — violation" />
            <div className="h-full bg-amber-400/60 w-[10%]" title="Warning zone" />
          </>
        )}
        <div className="h-full bg-green-400/60 flex-1" title="Safe range" />
        {epaMax != null && (
          <>
            <div className="h-full bg-amber-400/60 w-[10%]" title="Warning zone" />
            <div className="h-full bg-red-400/60 w-[15%]" title="Above maximum — violation" />
          </>
        )}
      </div>
      <div className="flex justify-between mt-1">
        <span className={`text-[9px] ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
          {epaMin != null ? `Min: ${epaMin}` : "Low"}
        </span>
        <span className={`text-[9px] text-green-500 font-medium`}>Safe Range</span>
        <span className={`text-[9px] ${isDark ? "text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
          {epaMax != null ? `Max: ${epaMax}` : "High"}
        </span>
      </div>
    </div>
  );
}
