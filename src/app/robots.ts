import type { MetadataRoute } from "next";
import { deployment } from "@/config/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/demo"],
    },
    sitemap: `${deployment.siteUrl}/sitemap.xml`,
  };
}
