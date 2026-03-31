import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/demo"],
    },
    sitemap: "https://udc-one.vercel.app/sitemap.xml",
  };
}
