import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("/api/health", () => {
  it("returns status with expected fields", async () => {
    const response = await GET();
    const data = await response.json();

    // Health endpoint returns 200 (healthy) or 503 (degraded) depending on DB state
    expect([200, 503]).toContain(response.status);
    expect(["healthy", "degraded"]).toContain(data.status);
    expect(data.timestamp).toBeDefined();
    expect(data.version).toBeDefined();
    expect(typeof data.uptime).toBe("number");
    expect(data.database).toBeDefined();
    expect(data.database.provider).toBeDefined();
  });
});
