/**
 * A hard daily ceiling on AI spend, shared across replicas.
 *
 * The per-IP limiters in `ai-rate-limit.ts` bound how fast one caller can go.
 * They do not bound the day, they do not bound the sum across callers, and
 * because the counters live in each replica's memory a configured 10/min is
 * really up to 30/min at maxReplicas=3. Nothing in the app stopped the Gemini
 * or Anthropic bill from running away — the design note in CLAUDE.md put it as
 * "an uncapped AI endpoint is an uncapped invoice", and this is the cap.
 *
 * It is deliberately NOT the per-student quota described in Phase 13b. That
 * needs identity, and identity is UDC IT's decision. This is a circuit breaker
 * for the invoice, which needs no identity and can ship today.
 */

import { getDbClient } from "@/lib/db";

/**
 * Requests are weighted, not counted.
 *
 * A report summarises far more tokens than a chat turn, so counting raw
 * requests would let the most expensive endpoint hide behind the cheapest.
 * These track the relative token cost of each route.
 */
export const AI_UNIT_WEIGHTS = {
  chat: 1,
  analyze: 3,
  report: 10,
} as const;

export type AiRouteKind = keyof typeof AI_UNIT_WEIGHTS;

/** Units per UTC day. Override with AI_DAILY_UNIT_BUDGET. */
export const DEFAULT_DAILY_UNIT_BUDGET = 1500;

export function dailyUnitBudget(): number {
  const raw = process.env.AI_DAILY_UNIT_BUDGET;
  if (!raw) return DEFAULT_DAILY_UNIT_BUDGET;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_UNIT_BUDGET;
}

/** UTC day key. UTC, not local time, so replicas in any region agree. */
export function utcDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export interface AiBudgetResult {
  allowed: boolean;
  used: number;
  budget: number;
}

/**
 * Charges `kind` against today's allowance and reports whether to proceed.
 *
 * The increment and the read are one statement so concurrent replicas cannot
 * both observe room that only one of them has. A rejected call still leaves its
 * units on the counter — the day is already over budget, and paying to
 * subtract them would mean a second round trip to reach the same answer.
 *
 * Fails CLOSED. A cost ceiling that opens when its bookkeeping breaks is not a
 * ceiling, and every route guarded here already needs the database to do its
 * real work, so a failure open would buy no availability worth the risk.
 */
export async function consumeAiUnits(kind: AiRouteKind): Promise<AiBudgetResult> {
  const budget = dailyUnitBudget();
  const weight = AI_UNIT_WEIGHTS[kind];

  try {
    const db = await getDbClient();
    const result = await db.query(
      `INSERT INTO ai_usage_daily (day, units) VALUES (?, ?)
       ON CONFLICT (day) DO UPDATE SET units = ai_usage_daily.units + EXCLUDED.units
       RETURNING units`,
      [utcDay(), weight],
    );

    const row = result.rows[0] as { units?: number | string } | undefined;
    const used = Number(row?.units ?? weight);

    return { allowed: used <= budget, used, budget };
  } catch (error) {
    console.error("[ai-budget] could not record usage, denying request:", error);
    return { allowed: false, used: budget, budget };
  }
}

/** Today's consumption without charging anything. For the admin panel. */
export async function readAiUsage(): Promise<AiBudgetResult> {
  const budget = dailyUnitBudget();
  try {
    const db = await getDbClient();
    const result = await db.query(
      `SELECT units FROM ai_usage_daily WHERE day = ?`,
      [utcDay()],
    );
    const row = result.rows[0] as { units?: number | string } | undefined;
    const used = Number(row?.units ?? 0);
    return { allowed: used < budget, used, budget };
  } catch {
    return { allowed: false, used: 0, budget };
  }
}
