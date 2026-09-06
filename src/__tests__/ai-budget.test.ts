import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  AI_UNIT_WEIGHTS,
  DEFAULT_DAILY_UNIT_BUDGET,
  consumeAiUnits,
  dailyUnitBudget,
  readAiUsage,
  utcDay,
} from "@/lib/ai-budget";
import { getDbClient } from "@/lib/db";

async function resetUsage() {
  const db = await getDbClient();
  await db.query("DELETE FROM ai_usage_daily", []);
}

const ORIGINAL_BUDGET = process.env.AI_DAILY_UNIT_BUDGET;

beforeEach(async () => {
  delete process.env.AI_DAILY_UNIT_BUDGET;
  await resetUsage();
});

afterEach(() => {
  if (ORIGINAL_BUDGET === undefined) delete process.env.AI_DAILY_UNIT_BUDGET;
  else process.env.AI_DAILY_UNIT_BUDGET = ORIGINAL_BUDGET;
});

describe("AI unit weights", () => {
  it("charges the expensive routes more than the cheap one", () => {
    // Counting raw requests would let /report — which summarises far more
    // tokens than a chat turn — hide behind the cheapest endpoint.
    expect(AI_UNIT_WEIGHTS.report).toBeGreaterThan(AI_UNIT_WEIGHTS.analyze);
    expect(AI_UNIT_WEIGHTS.analyze).toBeGreaterThan(AI_UNIT_WEIGHTS.chat);
  });
});

describe("dailyUnitBudget", () => {
  it("falls back to the default when unset or nonsense", () => {
    expect(dailyUnitBudget()).toBe(DEFAULT_DAILY_UNIT_BUDGET);
    process.env.AI_DAILY_UNIT_BUDGET = "not-a-number";
    expect(dailyUnitBudget()).toBe(DEFAULT_DAILY_UNIT_BUDGET);
    process.env.AI_DAILY_UNIT_BUDGET = "0";
    expect(dailyUnitBudget()).toBe(DEFAULT_DAILY_UNIT_BUDGET);
  });

  it("honours a valid override", () => {
    process.env.AI_DAILY_UNIT_BUDGET = "42";
    expect(dailyUnitBudget()).toBe(42);
  });
});

describe("utcDay", () => {
  it("keys on UTC so replicas in any region agree", () => {
    // 03:00 UTC is the previous calendar day in Washington DC. The key must
    // still be the UTC date, or two replicas could disagree about "today".
    expect(utcDay(new Date("2026-09-05T03:00:00Z"))).toBe("2026-09-05");
    expect(utcDay(new Date("2026-09-05T23:59:59Z"))).toBe("2026-09-05");
  });
});

describe("consumeAiUnits", () => {
  it("accumulates across calls and routes", async () => {
    const first = await consumeAiUnits("chat");
    expect(first.used).toBe(AI_UNIT_WEIGHTS.chat);

    const second = await consumeAiUnits("report");
    expect(second.used).toBe(AI_UNIT_WEIGHTS.chat + AI_UNIT_WEIGHTS.report);
    expect(second.allowed).toBe(true);
  });

  it("denies once the day's allowance is spent", async () => {
    process.env.AI_DAILY_UNIT_BUDGET = "5";

    expect((await consumeAiUnits("analyze")).allowed).toBe(true); // 3
    const over = await consumeAiUnits("analyze"); // 6 > 5
    expect(over.allowed).toBe(false);
    expect(over.used).toBe(6);
    expect(over.budget).toBe(5);
  });

  it("stays denied for the rest of the day once over", async () => {
    process.env.AI_DAILY_UNIT_BUDGET = "1";
    await consumeAiUnits("report");
    // Even the cheapest route must not slip through after the ceiling is hit.
    expect((await consumeAiUnits("chat")).allowed).toBe(false);
  });
});

describe("readAiUsage", () => {
  it("reports usage without charging for the look", async () => {
    await consumeAiUnits("analyze");
    const before = await readAiUsage();
    const after = await readAiUsage();
    expect(before.used).toBe(AI_UNIT_WEIGHTS.analyze);
    expect(after.used).toBe(before.used);
  });

  it("reports zero on a day with no calls", async () => {
    expect((await readAiUsage()).used).toBe(0);
  });
});
