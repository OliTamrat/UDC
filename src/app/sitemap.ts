import type { MetadataRoute } from "next";
import { deployment, allStationIds } from "@/config/site.config";

const BASE_URL = deployment.siteUrl;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/stories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/scenarios`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/research`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/education`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const stationPages: MetadataRoute.Sitemap = allStationIds.map((id) => ({
    url: `${BASE_URL}/station/${id}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...stationPages];
}
