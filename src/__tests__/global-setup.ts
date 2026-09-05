import { execSync } from "node:child_process";
import fs from "node:fs";

import { TEST_DB_PATH } from "./test-db-path";

/**
 * Seeds a clean database for the suite, then removes it afterwards.
 *
 * Runs once before any test worker starts. The WAL and shared-memory sidecars
 * are deleted alongside the database file; leaving a stale WAL behind would
 * carry rows into the next run and reintroduce the count mismatches this
 * isolation exists to prevent.
 */
const SQLITE_FILES = ["", "-wal", "-shm"];

function removeTestDb(): void {
  for (const suffix of SQLITE_FILES) {
    fs.rmSync(`${TEST_DB_PATH}${suffix}`, { force: true });
  }
}

export default function setup() {
  removeTestDb();
  execSync("npx tsx scripts/seed.ts", {
    stdio: "inherit",
    env: { ...process.env, DB_PATH: TEST_DB_PATH },
  });

  return removeTestDb;
}
