import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ResearchAssistantWrapper from "@/components/ai/ResearchAssistantWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "UDC Water Resources Dashboard | Data Integration, Analysis & Visualization",
  description:
    "University of the District of Columbia CAUSES/WRRI interactive water resources dashboard for the Anacostia River watershed. Monitoring, research data, and environmental education for DC communities.",
  keywords: [
    "UDC",
    "University of the District of Columbia",
    "CAUSES",
    "WRRI",
    "Anacostia River",
    "water quality",
    "stormwater",
    "green infrastructure",
    "environmental data",
    "DC watershed",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased transition-colors duration-300">
        {/* Skip-to-content link for keyboard/screen reader users (WCAG 2.1 AA §2.4.1) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-udc-gold focus:text-udc-dark focus:rounded-lg focus:text-sm focus:font-semibold"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <SidebarProvider>
            <ErrorBoundary>
              {children}
              <ResearchAssistantWrapper />
            </ErrorBoundary>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
