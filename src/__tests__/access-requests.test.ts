import { describe, it, expect } from "vitest";

import {
  ACCESS_CRITERIA,
  DECISION_REASONS,
  DECISION_REASON_LABELS,
  REQUESTER_ROLES,
  RETENTION_DAYS,
  validateAccessRequest,
} from "@/lib/access-requests";

/**
 * These tests guard two promises made to people on a public university page:
 * that only what they typed is stored, and that they are judged on their stated
 * purpose rather than on who they are.
 */

const VALID = {
  name: "Jane Doe",
  email: "jane.doe@udc.edu",
  affiliation: "UDC CAUSES",
  requesterRole: "student",
  purpose: "Comparing dissolved oxygen trends across Anacostia stations for a capstone.",
};

describe("access request validation", () => {
  it("accepts a well-formed request", () => {
    const result = validateAccessRequest(VALID);
    expect(result.ok).toBe(true);
    expect(result.value?.email).toBe("jane.doe@udc.edu");
  });

  it("trims whitespace rather than rejecting it", () => {
    const result = validateAccessRequest({ ...VALID, name: "  Jane Doe  " });
    expect(result.value?.name).toBe("Jane Doe");
  });

  it.each(["name", "email", "affiliation", "purpose"])("requires %s", (field) => {
    const result = validateAccessRequest({ ...VALID, [field]: "" });
    expect(result.ok).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(validateAccessRequest({ ...VALID, email: "not-an-email" }).ok).toBe(false);
  });

  it("rejects an unknown role", () => {
    expect(validateAccessRequest({ ...VALID, requesterRole: "vip" }).ok).toBe(false);
  });

  it("caps field lengths so the form cannot be used as storage", () => {
    const result = validateAccessRequest({ ...VALID, purpose: "x".repeat(2001) });
    expect(result.ok).toBe(false);
  });

  it("rejects a non-object body", () => {
    expect(validateAccessRequest("nope").ok).toBe(false);
    expect(validateAccessRequest(null).ok).toBe(false);
  });
});

describe("data minimisation", () => {
  it("returns ONLY the four declared fields plus role", () => {
    const result = validateAccessRequest(VALID);
    expect(Object.keys(result.value ?? {}).sort()).toEqual([
      "affiliation",
      "email",
      "name",
      "purpose",
      "requesterRole",
    ]);
  });

  it("silently drops anything else a client tries to submit", () => {
    // A caller cannot smuggle extra personal data into the stored record.
    const result = validateAccessRequest({
      ...VALID,
      ipAddress: "10.0.0.1",
      dateOfBirth: "1999-01-01",
      studentId: "UDC-12345",
      nationality: "Ethiopian",
    });
    expect(result.ok).toBe(true);
    expect(result.value).not.toHaveProperty("ipAddress");
    expect(result.value).not.toHaveProperty("dateOfBirth");
    expect(result.value).not.toHaveProperty("studentId");
    expect(result.value).not.toHaveProperty("nationality");
  });

  it("keeps a finite retention window", () => {
    expect(RETENTION_DAYS).toBeGreaterThan(0);
    expect(RETENTION_DAYS).toBeLessThanOrEqual(365 * 2);
  });
});

describe("non-discrimination", () => {
  it("offers a decision reason for every refusal path", () => {
    expect(DECISION_REASONS.length).toBeGreaterThan(1);
    for (const reason of DECISION_REASONS) {
      expect(DECISION_REASON_LABELS[reason]).toBeTruthy();
    }
  });

  it("describes the request, never the requester", () => {
    // Every ground for refusal must be about what was asked for. If someone adds
    // a reason naming a personal characteristic, this fails.
    const forbidden = [
      "age", "sex", "gender", "race", "ethnic", "national", "nationality",
      "religion", "disab", "citizen", "immigra", "visa", "country",
      "language", "accent", "school", "gpa", "grade",
    ];
    const surface = [
      ...DECISION_REASONS,
      ...Object.values(DECISION_REASON_LABELS),
    ]
      .join(" ")
      .toLowerCase();

    for (const term of forbidden) {
      expect(surface).not.toContain(term);
    }
  });

  it("publishes the criteria applicants are judged against", () => {
    expect(ACCESS_CRITERIA.length).toBeGreaterThan(0);
    for (const criterion of ACCESS_CRITERIA) {
      expect(criterion.trim().length).toBeGreaterThan(10);
    }
  });

  it("treats role as a tier, so every role can be requested", () => {
    // No role is barred at validation — the decision is made on purpose alone.
    for (const role of REQUESTER_ROLES) {
      expect(validateAccessRequest({ ...VALID, requesterRole: role }).ok).toBe(true);
    }
  });
});
