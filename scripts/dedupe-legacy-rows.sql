-- One-off duplicate cleanup for readings / measurements.
--
-- This used to run inside initSchema on every cold container start. It was a
-- full sequential scan of both tables (~237k and ~682k rows) that deleted
-- nothing, because the unique indexes below have prevented duplicates ever
-- since they were created. The scan pushed /api/ingest past the ~60s ingress
-- timeout, which stalled ingestion.
--
-- Run by hand ONLY if a duplicate check reports rows, e.g.:
--   SELECT count(*) FROM (SELECT station_id,timestamp,source FROM readings
--     GROUP BY 1,2,3 HAVING count(*)>1) d;

BEGIN;

DELETE FROM readings WHERE id NOT IN (
  SELECT MIN(id) FROM readings GROUP BY station_id, timestamp, source
);

DELETE FROM measurements WHERE id NOT IN (
  SELECT MIN(id) FROM measurements GROUP BY station_id, parameter_id, timestamp, source
);

COMMIT;
