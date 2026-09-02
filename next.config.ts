import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack resolves from the project root, not a parent directory
  turbopack: {
    root: ".",
  },
  // standalone output required for Docker/Azure Container Apps deployment
  output: "standalone",

  // NOTE: Security headers (CSP, X-Frame-Options, X-Content-Type-Options,
  // Referrer-Policy, HSTS) are set in src/middleware.ts, not here.
  //
  // Two reasons:
  //   1. The /embed route needs a different `frame-ancestors` value than the
  //      rest of the app. Headers defined here are static and would emit a
  //      SECOND Content-Security-Policy header on /embed; browsers intersect
  //      multiple CSP headers, so the stricter one wins and the embed breaks.
  //   2. next.config headers are baked in at build time. In middleware the
  //      allow-list is read at request time, so approving a new UDC host is an
  //      environment-variable change plus a restart — not a rebuild.
  //
  // See src/config/embed.config.ts for the allow-list.
};

export default nextConfig;
