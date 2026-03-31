import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UDC Water Resources Dashboard",
    short_name: "UDC Water",
    description:
      "Real-time water quality monitoring, analysis, and visualization for the Anacostia River watershed. University of the District of Columbia CAUSES/WRRI.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#090B11",
    theme_color: "#FDB927",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
