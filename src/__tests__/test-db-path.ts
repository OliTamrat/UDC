import os from "node:os";
import path from "node:path";

/**
 * Where the test suite's SQLite database lives.
 *
 * Several suites assert exact row counts — 144 readings, 12 stations, zero
 * non-seed rows — that only hold for a freshly seeded database. Pointing them
 * at data/udc-water.db meant they ran against whatever a developer's local
 * dashboard had ingested, so the suite failed locally with counts in the
 * thousands while CI, which seeds from scratch on every run, passed. Give the
 * tests their own file instead.
 */
export const TEST_DB_PATH = path.join(os.tmpdir(), "udc-wqis-test.db");
