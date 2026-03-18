"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface SidebarContextType {
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  mobileOpen: false,
  openMobile: () => {},
  closeMobile: () => {},
  collapsed: false,
  setCollapsed: () => {},
  toggleCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <SidebarContext.Provider value={{ mobileOpen, openMobile, closeMobile, collapsed, setCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
