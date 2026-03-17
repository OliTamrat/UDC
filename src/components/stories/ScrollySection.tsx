"use client";

import { useRef, useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

interface ScrollySectionProps {
  children: React.ReactNode;
  id: string;
  onProgress?: (progress: number) => void;
}

/**
 * Scrollytelling section that tracks scroll progress (0-1) within its bounds.
 * Used to drive animations and transitions as the user scrolls.
 */
export function ScrollySection({ children, id, onProgress }: ScrollySectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onProgress) return;

    const observer = new IntersectionObserver(
      () => {
        // Use scroll handler instead for smooth progress
      },
      { threshold: [0, 0.1, 0.5, 0.9, 1] }
    );

    function handleScroll() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (viewH - rect.top) / (rect.height + viewH)));
      onProgress?.(progress);
    }

    observer.observe(el);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [onProgress]);

  return (
    <div ref={ref} id={id} className="relative">
      {children}
    </div>
  );
}

interface StoryCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  children: React.ReactNode;
}

/**
 * A self-contained story card with title, icon, and animated content.
 */
export function StoryCard({ title, subtitle, icon, accentColor, children }: StoryCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`rounded-2xl border overflow-hidden transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${isDark ? "bg-panel-bg border-panel-border" : "bg-white border-slate-200 shadow-sm"}`}
    >
      {/* Header */}
      <div className={`px-6 pt-6 pb-4 border-b ${isDark ? "border-panel-border" : "border-slate-100"}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${accentColor}`}>
            {icon}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              {title}
            </h3>
            <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {subtitle}
            </p>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className = "" }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      {children}
    </div>
  );
}
