import { useSidebar } from "@/context/SidebarContext";

/**
 * Returns the correct class string for main content margin
 * that transitions smoothly when sidebar collapses/expands.
 */
export function useSidebarClass(): string {
  const { collapsed } = useSidebar();
  return collapsed
    ? "lg:ml-[68px] transition-[margin-left] duration-300"
    : "lg:ml-[240px] transition-[margin-left] duration-300";
}
