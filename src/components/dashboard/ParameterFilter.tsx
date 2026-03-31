"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Filter, ChevronDown, X, Check } from "lucide-react";
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

interface ParameterFilterProps {
  selectedParams: string[];
  onParamsChange: (params: string[]) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  physical:   { label: "Physical",    color: "text-blue-400" },
  nutrients:  { label: "Nutrients",   color: "text-green-400" },
  metals:     { label: "Metals",      color: "text-orange-400" },
  biological: { label: "Biological",  color: "text-red-400" },
  organic:    { label: "Organic",     color: "text-purple-400" },
};

const CATEGORY_ORDER = ["physical", "nutrients", "biological", "metals", "organic"];

export default function ParameterFilter({ selectedParams, onParamsChange }: ParameterFilterProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [parameters, setParameters] = useState<ParameterDef[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchParams = useCallback(async () => {
    try {
      const res = await fetch("/api/parameters");
      if (res.ok) setParameters(await res.json());
    } catch {
      // API unavailable — filter will be empty
    }
  }, []);

  useEffect(() => { fetchParams(); }, [fetchParams]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const grouped = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      ...CATEGORY_LABELS[cat],
      params: parameters.filter((p) => p.category === cat),
    }))
    .filter((g) => g.params.length > 0);

  const toggle = (id: string) => {
    if (selectedParams.includes(id)) {
      onParamsChange(selectedParams.filter((p) => p !== id));
    } else {
      onParamsChange([...selectedParams, id]);
    }
  };

  const selectCategory = (category: string) => {
    const catIds = parameters.filter((p) => p.category === category).map((p) => p.id);
    const allSelected = catIds.every((id) => selectedParams.includes(id));
    if (allSelected) {
      onParamsChange(selectedParams.filter((id) => !catIds.includes(id)));
    } else {
      const merged = new Set([...selectedParams, ...catIds]);
      onParamsChange([...merged]);
    }
  };

  const clearAll = () => onParamsChange([]);

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
          isDark
            ? "border-white/[0.06] bg-[#13161F] hover:bg-white/[0.04] text-[#E5E7EB]"
            : "border-[#D1D5DB] bg-white hover:bg-[#E5E7EB] text-[#374151]"
        } ${selectedParams.length > 0 ? (isDark ? "border-water-blue/50" : "border-blue-400") : ""}`}
      >
        <Filter className="w-3.5 h-3.5" />
        Parameters
        {selectedParams.length > 0 && (
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            isDark ? "bg-water-blue/20 text-blue-300" : "bg-blue-100 text-blue-700"
          }`}>
            {selectedParams.length}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Selected pills (show inline when closed) */}
      {selectedParams.length > 0 && !open && (
        <div className="inline-flex items-center gap-1 ml-2 flex-wrap">
          {selectedParams.slice(0, 3).map((id) => {
            const p = parameters.find((p) => p.id === id);
            return (
              <span
                key={id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
                  isDark ? "bg-[#13161F] border-white/[0.06] text-[#E5E7EB]" : "bg-[#E5E7EB] border-[#D1D5DB] text-[#1F2937]"
                }`}
              >
                {p?.name || id}
                <button onClick={(e) => { e.stopPropagation(); toggle(id); }} className="hover:text-red-400">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
          {selectedParams.length > 3 && (
            <span className={`text-[10px] ${isDark ? "text-[#D1D5DB]" : "text-[#374151]"}`}>
              +{selectedParams.length - 3} more
            </span>
          )}
          <button
            onClick={clearAll}
            className={`text-[10px] px-1.5 py-0.5 rounded hover:text-red-400 ${isDark ? "text-[#6B7280]" : "text-[#6B7280]"}`}
          >
            Clear
          </button>
        </div>
      )}

      {/* Dropdown panel */}
      {open && (
        <div className={`absolute z-50 mt-1 left-0 w-72 rounded-xl border shadow-xl overflow-hidden ${
          isDark ? "bg-udc-dark border-white/[0.06]" : "bg-white border-[#D1D5DB]"
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-3 py-2 border-b ${
            isDark ? "border-white/[0.06]" : "border-[#E5E7EB]"
          }`}>
            <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-[#111827]"}`}>
              Filter by Parameter
            </span>
            {selectedParams.length > 0 && (
              <button onClick={clearAll} className="text-[10px] text-red-400 hover:text-red-300">
                Clear all
              </button>
            )}
          </div>

          {/* Category groups */}
          <div className="max-h-72 overflow-y-auto">
            {grouped.map((group) => {
              const catIds = group.params.map((p) => p.id);
              const allSelected = catIds.every((id) => selectedParams.includes(id));
              const someSelected = catIds.some((id) => selectedParams.includes(id));

              return (
                <div key={group.category}>
                  {/* Category header */}
                  <button
                    onClick={() => selectCategory(group.category)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold ${
                      isDark ? "bg-[#13161F]/50 text-[#D1D5DB] hover:bg-white/[0.04]" : "bg-[#F0F1F3] text-[#374151] hover:bg-[#E5E7EB]"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                      allSelected
                        ? "bg-water-blue border-water-blue"
                        : someSelected
                          ? "border-water-blue/50 bg-water-blue/20"
                          : isDark ? "border-white/[0.06]" : "border-[#D1D5DB]"
                    }`}>
                      {allSelected && <Check className="w-2 h-2 text-white" />}
                      {someSelected && !allSelected && <span className="w-1.5 h-1.5 rounded-sm bg-water-blue" />}
                    </div>
                    <span className={group.color}>{group.label}</span>
                    <span className={`ml-auto ${isDark ? "text-[#6B7280]" : "text-[#6B7280]"}`}>
                      {catIds.filter((id) => selectedParams.includes(id)).length}/{catIds.length}
                    </span>
                  </button>

                  {/* Parameter items */}
                  {group.params.map((param) => {
                    const isSelected = selectedParams.includes(param.id);
                    return (
                      <button
                        key={param.id}
                        onClick={() => toggle(param.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                          isDark ? "hover:bg-white/[0.04]" : "hover:bg-[#E5E7EB]"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "bg-water-blue border-water-blue"
                            : isDark ? "border-white/[0.06]" : "border-[#D1D5DB]"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs truncate ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>
                            {param.name}
                          </div>
                          <div className={`text-[10px] ${isDark ? "text-[#6B7280]" : "text-[#6B7280]"}`}>
                            {param.unit}
                            {param.epaMax != null && ` · EPA max: ${param.epaMax}`}
                            {param.epaMin != null && param.epaMax == null && ` · EPA min: ${param.epaMin}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
