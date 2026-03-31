import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { LanguageProvider } from "@/context/LanguageContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ResearchAssistantWrapper from "@/components/ai/ResearchAssistantWrapper";
import "./globals.css";

const siteUrl = "https://udc-one.vercel.app";
const siteTitle = "UDC Water Resources Dashboard | Data Integration, Analysis & Visualization";
const siteDescription =
  "Real-time water quality monitoring, analysis, and visualization for the Anacostia River watershed. University of the District of Columbia CAUSES/WRRI research dashboard with USGS sensor data, EPA standards tracking, and environmental education.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | UDC Water Resources",
  },
  description: siteDescription,
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
    "USGS",
    "EPA",
    "water monitoring",
    "dissolved oxygen",
    "environmental justice",
  ],
  authors: [{ name: "UDC CAUSES / WRRI", url: "https://www.udc.edu/causes/" }],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    siteName: "UDC Water Resources Dashboard",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Preconnect to external origins for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://unpkg.com" />
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
          <LanguageProvider>
            <SidebarProvider>
              <ErrorBoundary>
                {children}
                <ResearchAssistantWrapper />
              </ErrorBoundary>
            </SidebarProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
