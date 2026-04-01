import type { MetadataRoute } from "next";
import { institution, watershed, branding, getDescription } from "@/config/site.config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${institution.shortName} Water Resources Dashboard`,
    short_name: `${institution.shortName} Water`,
    description: getDescription(),
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#090B11",
    theme_color: branding.themeColor,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
