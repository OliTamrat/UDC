import type { MetadataRoute } from "next";

const BASE_URL = "https://udc-one.vercel.app";

const STATION_IDS = [
  "ANA-001", "ANA-002", "ANA-003", "ANA-004",
  "WB-001", "PB-001", "HR-001",
  "GI-001", "GI-002", "GI-003",
  "SW-001", "SW-002",
];

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

  const stationPages: MetadataRoute.Sitemap = STATION_IDS.map((id) => ({
    url: `${BASE_URL}/station/${id}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...stationPages];
}
