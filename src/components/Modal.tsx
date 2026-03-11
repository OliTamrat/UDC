"use client";

import { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, subtitle, icon, children, maxWidth = "max-w-2xl" }: ModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 ${isDark ? "bg-black/70" : "bg-black/40"} backdrop-blur-sm`} />

      {/* Modal Panel */}
      <div
        className={`relative ${maxWidth} w-full rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          isDark
            ? "bg-panel-bg border-panel-border shadow-black/40"
            : "bg-white border-slate-200 shadow-slate-300/30"
        }`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between p-3 sm:p-5 pb-3 border-b ${isDark ? "border-panel-border" : "border-slate-100"}`}>
          <div className="flex items-start gap-3">
            {icon && (
              <div className={`p-2.5 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                {icon}
              </div>
            )}
            <div>
              <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h2>
              {subtitle && (
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
