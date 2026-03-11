import { describe, it, expect } from "vitest";
import { sanitizeSearchInput, isInputSafe } from "@/lib/validation";

describe("sanitizeSearchInput", () => {
  it("trims whitespace", () => {
    expect(sanitizeSearchInput("  hello  ")).toBe("hello");
  });

  it("truncates to 200 characters", () => {
    const long = "a".repeat(300);
    expect(sanitizeSearchInput(long).length).toBe(200);
  });

  it("escapes HTML entities", () => {
    expect(sanitizeSearchInput("<b>bold</b>")).toBe("&lt;b&gt;bold&lt;/b&gt;");
  });
});

describe("isInputSafe", () => {
  it("allows normal search terms", () => {
    expect(isInputSafe("anacostia river")).toBe(true);
    expect(isInputSafe("ANA-001")).toBe(true);
    expect(isInputSafe("green infrastructure")).toBe(true);
  });

  it("rejects script injection", () => {
    expect(isInputSafe('<script>alert("xss")</script>')).toBe(false);
  });

  it("rejects javascript: URIs", () => {
    expect(isInputSafe("javascript:alert(1)")).toBe(false);
  });

  it("rejects event handler injection", () => {
    expect(isInputSafe('onerror=alert(1)')).toBe(false);
  });
});
