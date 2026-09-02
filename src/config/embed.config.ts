/**
 * Embed Configuration
 * ===================
 * Single source of truth for the /embed route: which external sites are allowed
 * to frame the WQIS dashboard, and which parent windows we will speak to.
 *
 * The allow-list is read from an environment variable so a newly approved UDC
 * host can be added by changing an Azure Container Apps setting and restarting
 * the revision — no code change, no rebuild. The defaults below cover the hosts
 * UDC is already using, so the embed works out of the box if the variable is
 * never set.
 *
 *   WQIS_EMBED_ANCESTORS             server-side, drives CSP `frame-ancestors`
 *   NEXT_PUBLIC_WQIS_EMBED_ANCESTORS client-side, drives postMessage targets
 *
 * Both take a comma-separated list of origins (scheme + host, no trailing slash).
 */

/** Origins approved to embed WQIS. Keep scheme, drop trailing slashes. */
export const DEFAULT_EMBED_ANCESTORS: readonly string[] = [
  // UDC staging, built by their web agency (abcdandcompany.com)
  "https://udc-dev.abcdandcompany.com",
  // Expected production hosts — confirm the exact one with UDC before go-live
  "https://www.udc.edu",
  "https://udc.edu",
];

/**
 * Reads process.env through an index signature so the bundler cannot inline the
 * value at build time. This keeps the allow-list a genuine runtime setting.
 */
function readEnv(key: string): string | undefined {
  return (process.env as Record<string, string | undefined>)[key];
}

function parseOrigins(raw: string | undefined): string[] | null {
  if (!raw) return null;
  const origins = raw
    .split(",")
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return origins.length > 0 ? origins : null;
}

/** Origins for the CSP `frame-ancestors` directive on /embed. Server-side. */
export function getEmbedAncestors(): string[] {
  return parseOrigins(readEnv("WQIS_EMBED_ANCESTORS")) ?? [...DEFAULT_EMBED_ANCESTORS];
}

/** Parent origins the embed will postMessage its height to. Client-side. */
export function getAllowedParentOrigins(): string[] {
  return (
    parseOrigins(readEnv("NEXT_PUBLIC_WQIS_EMBED_ANCESTORS")) ?? [...DEFAULT_EMBED_ANCESTORS]
  );
}

/** Message sent to the host page so it can size the iframe to the content. */
export const EMBED_HEIGHT_MESSAGE = "wqis:height" as const;
