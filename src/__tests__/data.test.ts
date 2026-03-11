import { describe, it, expect } from "vitest";
import {
  monitoringStations,
  anacostiaRiver,
  dcStreams,
  getStationHistoricalData,
} from "@/data/dc-waterways";

describe("dc-waterways data", () => {
  it("has 12 monitoring stations", () => {
    expect(monitoringStations).toHaveLength(12);
  });

  it("all stations have required fields", () => {
    for (const station of monitoringStations) {
      expect(station.id).toBeTruthy();
      expect(station.name).toBeTruthy();
      expect(station.position).toHaveLength(2);
      expect(["river", "stream", "stormwater", "green-infrastructure"]).toContain(station.type);
      expect(["active", "maintenance", "offline"]).toContain(station.status);
      expect(station.parameters.length).toBeGreaterThan(0);
    }
  });

  it("anacostia river has valid coordinates", () => {
    expect(anacostiaRiver.coordinates.length).toBeGreaterThan(10);
    for (const [lat, lng] of anacostiaRiver.coordinates) {
      expect(lat).toBeGreaterThan(38.8);
      expect(lat).toBeLessThan(39.0);
      expect(lng).toBeGreaterThan(-77.1);
      expect(lng).toBeLessThan(-76.9);
    }
  });

  it("dc streams are defined", () => {
    expect(dcStreams.length).toBeGreaterThan(0);
    for (const stream of dcStreams) {
      expect(stream.name).toBeTruthy();
      expect(stream.coordinates.length).toBeGreaterThan(0);
    }
  });

  it("generates historical data for a valid station", () => {
    const station = monitoringStations[0];
    const result = getStationHistoricalData(station.id);
    expect(result).not.toBeNull();
    expect(result!.months).toHaveLength(12);
    expect(result!.data).toHaveLength(12);
    for (const reading of result!.data) {
      expect(reading.month).toBeTruthy();
      expect(reading.dissolvedOxygen).toBeGreaterThan(0);
      expect(reading.pH).toBeGreaterThan(0);
      expect(reading.temperature).toBeDefined();
    }
  });

  it("returns null for unknown station", () => {
    const result = getStationHistoricalData("nonexistent");
    expect(result).toBeNull();
  });
});
