"use client";

import { Bell, Search, User, Calendar } from "lucide-react";

export default function Header() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="h-14 border-b border-panel-border bg-panel-bg/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search stations, data, research..."
            className="w-72 bg-udc-dark/50 border border-panel-border rounded-lg pl-10 pr-4 py-1.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-udc-blue/50 transition-colors"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-water-clean animate-pulse" />
          <span className="text-xs text-slate-400">Live</span>
        </div>
        <button className="relative p-2 rounded-lg hover:bg-panel-hover transition-colors">
          <Bell className="w-4 h-4 text-slate-400" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-udc-red" />
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-panel-hover transition-colors border border-panel-border">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">Stakeholder</span>
        </button>
      </div>
    </header>
  );
}
