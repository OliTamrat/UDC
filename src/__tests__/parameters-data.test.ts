import { describe, it, expect } from "vitest";
import { ALL_PARAMETERS, CORE_PARAMETERS, EMERGING_PARAMETERS, LEGACY_COLUMN_TO_PARAM } from "@/data/parameters";

describe("Parameter definitions", () => {
  it("has 25 total parameters (20 core + 5 emerging)", () => {
    expect(CORE_PARAMETERS).toHaveLength(20);
    expect(EMERGING_PARAMETERS).toHaveLength(5);
    expect(ALL_PARAMETERS).toHaveLength(25);
  });

  it("all parameters have required fields", () => {
    for (const param of ALL_PARAMETERS) {
      expect(param.id).toBeTruthy();
      expect(param.name).toBeTruthy();
      expect(param.unit).toBeTruthy();
      expect(["physical", "nutrients", "metals", "biological", "organic"]).toContain(param.category);
      expect(typeof param.display_order).toBe("number");
      expect(param.description).toBeTruthy();
    }
  });

  it("parameter IDs are unique", () => {
    const ids = ALL_PARAMETERS.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("USGS pcodes are set for physical parameters", () => {
    const physical = CORE_PARAMETERS.filter((p) => p.category === "physical");
    const withPcode = physical.filter((p) => p.usgs_pcode);
    expect(withPcode.length).toBeGreaterThan(5);
  });

  it("EPA thresholds are set for key parameters", () => {
    const find = (id: string) => ALL_PARAMETERS.find((p) => p.id === id);

    expect(find("dissolved_oxygen")?.epa_min).toBe(5.0);
    expect(find("ph")?.epa_min).toBe(6.5);
    expect(find("ph")?.epa_max).toBe(9.0);
    expect(find("ecoli")?.epa_max).toBe(410);
    expect(find("nitrate_n")?.epa_max).toBe(10.0);
    expect(find("phosphorus_total")?.epa_max).toBe(0.1);
    expect(find("lead_total")?.epa_max).toBe(15.0);
    expect(find("methylene_chloride")?.epa_max).toBe(5.0);
    expect(find("vinyl_chloride")?.epa_max).toBe(2.0);
  });

  it("legacy column mapping covers all 8 original columns", () => {
    expect(LEGACY_COLUMN_TO_PARAM.temperature).toBe("temperature");
    expect(LEGACY_COLUMN_TO_PARAM.dissolved_oxygen).toBe("dissolved_oxygen");
    expect(LEGACY_COLUMN_TO_PARAM.ph).toBe("ph");
    expect(LEGACY_COLUMN_TO_PARAM.turbidity).toBe("turbidity");
    expect(LEGACY_COLUMN_TO_PARAM.conductivity).toBe("conductivity");
    expect(LEGACY_COLUMN_TO_PARAM.ecoli_count).toBe("ecoli");
    expect(LEGACY_COLUMN_TO_PARAM.nitrate_n).toBe("nitrate_n");
    expect(LEGACY_COLUMN_TO_PARAM.phosphorus).toBe("phosphorus_total");
  });

  it("emerging contaminants are all in organic category", () => {
    for (const param of EMERGING_PARAMETERS) {
      expect(param.category).toBe("organic");
    }
  });
});
