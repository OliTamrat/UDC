-- One-off duplicate cleanup for readings and measurements.
--
-- These statements used to run inside initSchema() on every cold start. That was
-- harmless when the tables were small, but they are full anti-join scans: as the
-- tables grew into the millions of rows they took over a minute, and because
-- every request waits for schema initialisation, a cold container timed out every
-- database-backed API call until it finished.
--
-- They are a MIGRATION, not a startup step, and were already applied to the
-- production database. Run them by hand only if a database is found to contain
-- duplicates that block creation of the unique indexes below.
--
-- Usage:
--   psql "$DATABASE_URL" -f scripts/dedupe-legacy-rows.sql
--
-- Expect this to take minutes on a large table, and take a backup first.

BEGIN;

DELETE FROM readings WHERE id NOT IN (
  SELECT MIN(id) FROM readings GROUP BY station_id, timestamp, source
);

DELETE FROM measurements WHERE id NOT IN (
  SELECT MIN(id) FROM measurements GROUP BY station_id, parameter_id, timestamp, source
);

-- These are created by initSchema() too; repeated here so this script is
-- self-contained when used to repair a database.
CREATE UNIQUE INDEX IF NOT EXISTS idx_readings_station_time_source
  ON readings(station_id, timestamp, source);

CREATE UNIQUE INDEX IF NOT EXISTS idx_measurements_station_param_time_source
  ON measurements(station_id, parameter_id, timestamp, source);

COMMIT;
