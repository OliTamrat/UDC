import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UDC Water Resources Dashboard | Data Integration, Analysis & Visualization",
  description:
    "University of the District of Columbia CAUSES/WRRI interactive water resources dashboard for the Anacostia River watershed. Real-time monitoring, research data, and environmental education for DC communities.",
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
    <html lang="en">
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
      <body className="bg-udc-dark text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
