import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "@/middleware";
import { DEFAULT_EMBED_ANCESTORS, getEmbedAncestors } from "@/config/embed.config";

/**
 * These tests guard the UDC website integration.
 *
 * UDC frames /embed from their own domain. If X-Frame-Options ever comes back
 * on that route, or frame-ancestors loses their origin, the dashboard silently
 * turns into an empty grey box on a live university page with no error anywhere
 * in our logs. The rest of the app must stay unframable at the same time.
 */

const ORIGINAL_ANCESTORS = process.env.WQIS_EMBED_ANCESTORS;

afterEach(() => {
  if (ORIGINAL_ANCESTORS === undefined) {
    delete process.env.WQIS_EMBED_ANCESTORS;
  } else {
    process.env.WQIS_EMBED_ANCESTORS = ORIGINAL_ANCESTORS;
  }
});

function headersFor(path: string) {
  const response = middleware(new NextRequest(`https://udc.wqis-app.com${path}`));
  return {
    csp: response.headers.get("content-security-policy") ?? "",
    xfo: response.headers.get("x-frame-options"),
    nosniff: response.headers.get("x-content-type-options"),
  };
}

function frameAncestors(csp: string): string {
  return csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("frame-ancestors")) ?? "";
}

describe("embed allow-list", () => {
  it("falls back to the known UDC hosts when unset", () => {
    delete process.env.WQIS_EMBED_ANCESTORS;
    expect(getEmbedAncestors()).toEqual([...DEFAULT_EMBED_ANCESTORS]);
  });

  it("includes the UDC staging host by default", () => {
    delete process.env.WQIS_EMBED_ANCESTORS;
    expect(getEmbedAncestors()).toContain("https://udc-dev.abcdandcompany.com");
  });

  it("is overridable at runtime without a rebuild", () => {
    process.env.WQIS_EMBED_ANCESTORS = "https://wrri.udc.edu, https://www.udc.edu";
    expect(getEmbedAncestors()).toEqual(["https://wrri.udc.edu", "https://www.udc.edu"]);
  });

  it("strips trailing slashes, which are invalid in frame-ancestors", () => {
    process.env.WQIS_EMBED_ANCESTORS = "https://www.udc.edu/";
    expect(getEmbedAncestors()).toEqual(["https://www.udc.edu"]);
  });

  it("ignores an empty value rather than emitting an empty directive", () => {
    process.env.WQIS_EMBED_ANCESTORS = "   ";
    expect(getEmbedAncestors()).toEqual([...DEFAULT_EMBED_ANCESTORS]);
  });
});

describe("/embed is framable by UDC", () => {
  it("does not send X-Frame-Options, which has no allow-list syntax", () => {
    expect(headersFor("/embed").xfo).toBeNull();
  });

  it("names the approved UDC origins in frame-ancestors", () => {
    const directive = frameAncestors(headersFor("/embed").csp);
    expect(directive).toContain("https://udc-dev.abcdandcompany.com");
    expect(directive).toContain("https://www.udc.edu");
  });

  it("sends exactly one frame-ancestors directive", () => {
    const csp = headersFor("/embed").csp;
    const count = csp.split(";").filter((d) => d.trim().startsWith("frame-ancestors")).length;
    expect(count).toBe(1);
  });

  it("keeps the rest of the policy intact", () => {
    const csp = headersFor("/embed").csp;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self' https://waterservices.usgs.gov");
    expect(headersFor("/embed").nosniff).toBe("nosniff");
  });
});

describe("everything else stays unframable", () => {
  it.each(["/", "/admin", "/station/ANA-002", "/api/stations"])(
    "denies framing of %s",
    (path) => {
      const { csp, xfo } = headersFor(path);
      expect(xfo).toBe("DENY");
      expect(frameAncestors(csp)).toBe("frame-ancestors 'none'");
    },
  );

  it("does not treat a lookalike path as the embed route", () => {
    // /embedded must not inherit the embed route's relaxed frame policy.
    expect(headersFor("/embedded").xfo).toBe("DENY");
  });

  it("still allows the embed route with a sub-path", () => {
    expect(headersFor("/embed/anything").xfo).toBeNull();
  });
});
