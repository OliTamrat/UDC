/**
 * Lightweight cron runner for UDC-WQIS data ingestion.
 * Deployed as Azure Container Apps Job (schedule trigger).
 *
 * Environment variables:
 *   APP_URL      — base URL of the UDC-WQIS app
 *   INGEST_API_KEY — API key for ingestion endpoint
 *   INGEST_SOURCE  — one of: usgs, epa, wqp
 */

const appUrl = process.env.APP_URL;
const apiKey = process.env.INGEST_API_KEY;
const source = process.env.INGEST_SOURCE || "usgs";

if (!appUrl || !apiKey) {
  console.error("Missing APP_URL or INGEST_API_KEY");
  process.exit(1);
}

const url = `${appUrl}/api/ingest?source=${source}`;
console.log(`[${source.toUpperCase()} Ingest] Starting — ${new Date().toISOString()}`);
console.log(`[${source.toUpperCase()} Ingest] URL: ${url}`);

try {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json();

  if (res.ok) {
    console.log(`[${source.toUpperCase()} Ingest] Success — ${JSON.stringify(data)}`);
  } else {
    console.error(`[${source.toUpperCase()} Ingest] Failed — HTTP ${res.status}: ${JSON.stringify(data)}`);
    process.exit(1);
  }
} catch (err) {
  console.error(`[${source.toUpperCase()} Ingest] Error — ${err.message}`);
  process.exit(1);
}
