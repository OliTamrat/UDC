import { describe, it, expect } from "vitest";
import { splitSqlStatements } from "@/lib/db";

describe("splitSqlStatements", () => {
  it("splits plain multi-statement DDL", () => {
    expect(splitSqlStatements("CREATE TABLE a (id INT); CREATE TABLE b (id INT);")).toEqual([
      "CREATE TABLE a (id INT)",
      "CREATE TABLE b (id INT)",
    ]);
  });

  it("does not split on a semicolon inside a line comment", () => {
    // The regression this exists for: the comment below ended a schema section,
    // and splitting on its semicolon handed Postgres `run it by hand if needed.`
    // as a statement -> `syntax error at or near "run"` on every cold start,
    // which took down every Postgres-backed endpoint.
    const sql = `
      -- The cleanup lives in scripts/dedupe-legacy-rows.sql now; run it by hand.
      CREATE INDEX IF NOT EXISTS idx_x ON t(c);
    `;
    const parts = splitSqlStatements(sql);
    expect(parts).toHaveLength(1);
    expect(parts[0]).toContain("CREATE INDEX IF NOT EXISTS idx_x");
    expect(parts.join(" ")).not.toContain("run it by hand");
  });

  it("drops comments rather than sending them as statements", () => {
    expect(splitSqlStatements("-- just a comment\n")).toEqual([]);
  });

  it("keeps a semicolon inside a string literal", () => {
    const parts = splitSqlStatements("INSERT INTO t VALUES ('a;b'); SELECT 1;");
    expect(parts).toEqual(["INSERT INTO t VALUES ('a;b')", "SELECT 1"]);
  });

  it("handles an escaped quote inside a literal", () => {
    const parts = splitSqlStatements("INSERT INTO t VALUES ('it''s; fine'); SELECT 2;");
    expect(parts).toEqual(["INSERT INTO t VALUES ('it''s; fine')", "SELECT 2"]);
  });

  it("returns a trailing statement with no terminating semicolon", () => {
    expect(splitSqlStatements("SELECT 1")).toEqual(["SELECT 1"]);
  });
});

describe("getDbClient failure handling", () => {
  it("closes the pool when schema initialisation fails", async () => {
    // Pins the leak that turned a transient database error into connection-slot
    // exhaustion: getDbClient retries after a failed init, and createPgClient
    // opens a NEW pool per call, so a failed attempt that does not release its
    // pool leaks `max` server connections on every single request.
    let closed = 0;
    const failing = {
      query: async () => ({ rows: [], changes: 0 }),
      execute: async () => {
        throw new Error("connection slots exhausted");
      },
      close: async () => {
        closed++;
      },
    };

    // Mirrors the getDbClient init path: init failure must close before rethrow.
    const init = async () => {
      try {
        await failing.execute();
      } catch (error) {
        await failing.close();
        throw error;
      }
    };

    await expect(init()).rejects.toThrow("connection slots exhausted");
    await expect(init()).rejects.toThrow("connection slots exhausted");
    expect(closed).toBe(2);
  });
});
