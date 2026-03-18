import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack resolves from the project root, not a parent directory
  turbopack: {
    root: ".",
  },
  // Exclude native modules from serverless bundling (SQLite is local-dev only)
  serverExternalPackages: ["better-sqlite3"],
  // output: "standalone" is for Docker only; Vercel uses its own serverless build
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.live",
              "script-src-elem 'self' 'unsafe-inline' https://vercel.live https://*.vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://unpkg.com https://vercel.live https://*.vercel.live",
              "connect-src 'self' https://waterservices.usgs.gov https://www.waterqualitydata.us https://*.basemaps.cartocdn.com https://vercel.live https://*.vercel.live wss://ws-us3.pusher.com",
              "frame-src 'self' https://vercel.live https://*.vercel.live",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
